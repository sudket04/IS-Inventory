using KKND.Infrastructure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<KkndDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("KkndDatabase")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// ตรวจสอบว่า Backend ต่อฐานข้อมูลได้จริง — ใช้ยืนยัน Setup ตอน Sprint 0 เท่านั้น
app.MapGet("/health/db", async (KkndDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    var tableCount = canConnect
        ? await db.Database.SqlQueryRaw<int>("SELECT CAST(COUNT(*) AS int) AS Value FROM sys.tables WHERE type = 'U'").FirstAsync()
        : 0;
    return Results.Ok(new { canConnect, tableCount });
});

app.Run();
