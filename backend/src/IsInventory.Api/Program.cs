using System.Text;
using IsInventory.Domain.Auth;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Auth;
using IsInventory.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<IsInventoryDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("IsInventoryDatabase")));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();

// One-time install-time bootstrap: `dotnet IsInventory.Api.dll seed-admin` sets the initial
// admin password (Argon2id-hashed via the real IPasswordHasher, never a hand-rolled hash) and
// forces a change on first login. Password comes from an env var, not argv, so it never lands
// in shell history or a visible process list. Runs before Jwt/Licensing config is required.
if (args.Length > 0 && string.Equals(args[0], "seed-admin", StringComparison.OrdinalIgnoreCase))
{
    // ASP0000: fine here — this branch exits right after, well before app.Build() would run,
    // so there's no duplicate-singleton lifetime concern to worry about.
#pragma warning disable ASP0000
    return await SeedAdminPasswordAsync(builder.Services.BuildServiceProvider());
#pragma warning restore ASP0000
}

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwtOptions.Secret) && !builder.Environment.IsEnvironment("Testing"))
{
    throw new InvalidOperationException(
        "Jwt:Secret is not configured. Set it via 'dotnet user-secrets set Jwt:Secret \"<random 256-bit value>\"' locally, " +
        "or an environment variable / Key Vault in production (NFR-07).");
}

if (string.IsNullOrWhiteSpace(builder.Configuration["Licensing:EncryptionKeyBase64"]) && !builder.Environment.IsEnvironment("Testing"))
{
    throw new InvalidOperationException(
        "Licensing:EncryptionKeyBase64 is not configured. Set it via " +
        "'dotnet user-secrets set Licensing:EncryptionKeyBase64 \"<base64 of 32 random bytes>\"' locally, " +
        "or an environment variable / Key Vault in production (NFR-07). Generate one with: openssl rand -base64 32");
}
builder.Services.AddSingleton<ILicenseKeyProtector, AesGcmLicenseKeyProtector>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret ?? string.Empty)),
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

// เมนูตามสิทธิ์ (docs/design/01-user-flow.md §1.2) — Client ซ่อนเมนู แต่ Server ตรวจทุก Endpoint เสมอ (NFR-06)
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("Admin", p => p.RequireRole("ADMIN"))
    .AddPolicy("ItStaffOrAbove", p => p.RequireRole("ADMIN", "IT_STAFF"))
    .AddPolicy("AuditorOrAbove", p => p.RequireRole("ADMIN", "IT_STAFF", "AUDITOR"))
    .AddPolicy("AnyRole", p => p.RequireRole("ADMIN", "IT_STAFF", "AUDITOR", "VIEWER"));

const string FrontendCorsPolicy = "FrontendCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? new[] { "http://localhost:3000" };
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

// FR-AU: a user flagged must_change_password (fresh install's admin, or anyone an Admin just
// reset) is blocked from every API except /api/auth/* until they change it — enforced here
// (not just hidden in the UI) so a direct API call can't skip the frontend's forced prompt.
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true
        && context.User.FindFirst("must_change_password")?.Value == "true"
        && !context.Request.Path.StartsWithSegments("/api/auth"))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new
        {
            error = "password_change_required",
            message = "You must change your password before continuing.",
        });
        return;
    }

    await next();
});

app.MapControllers();

// ตรวจสอบว่า Backend ต่อฐานข้อมูลได้จริง — ใช้ยืนยัน Setup ตอน Sprint 0 เท่านั้น
app.MapGet("/health/db", async (IsInventoryDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    var tableCount = canConnect
        ? await db.Database.SqlQueryRaw<int>("SELECT CAST(COUNT(*) AS int) AS Value FROM sys.tables WHERE type = 'U'").FirstAsync()
        : 0;
    return Results.Ok(new { canConnect, tableCount });
});

app.Run();
return 0;

static async Task<int> SeedAdminPasswordAsync(IServiceProvider services)
{
    var password = Environment.GetEnvironmentVariable("ISINVENTORY_SEED_ADMIN_PASSWORD");
    if (string.IsNullOrWhiteSpace(password))
    {
        Console.Error.WriteLine("ISINVENTORY_SEED_ADMIN_PASSWORD environment variable is not set.");
        return 1;
    }

    if (!System.Text.RegularExpressions.Regex.IsMatch(password, @"^(?=.*[A-Za-z])(?=.*\d).{8,}$"))
    {
        Console.Error.WriteLine("Password must be at least 8 characters and include both letters and digits.");
        return 1;
    }

    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IsInventoryDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    var admin = await db.Users.SingleOrDefaultAsync(u => u.Username == "admin");
    if (admin is null)
    {
        Console.Error.WriteLine("No 'admin' user found — run the database migration scripts first.");
        return 1;
    }

    admin.PasswordHash = hasher.Hash(password);
    admin.MustChangePassword = true;
    admin.FailedLoginAttempts = 0;
    admin.LockedUntil = null;
    admin.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    Console.WriteLine("Initial admin password set. It must be changed on first login.");
    return 0;
}
