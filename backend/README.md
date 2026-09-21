# IS-Inventory Backend

ASP.NET Core Web API (.NET 8 LTS) + EF Core backend for the IS-Inventory IT Inventory
Management System. See `../docs/HANDOFF.md` §10 for why this stack was chosen
over Next.js Route Handlers + Prisma.

## Structure

```
src/
  IsInventory.Domain/          # Contracts only (IPasswordHasher, IJwtTokenService, IAuthService,
                                # Security/Auth models) — scaffolded EF entities still live in
                                # Infrastructure/Entities until they're reorganized in a later sprint
  IsInventory.Infrastructure/  # IsInventoryDbContext + Entities/ (scaffolded from the actual tested
                                # database, see docs/database/) + Security/Auth implementations
  IsInventory.Api/              # ASP.NET Core Web API — Program.cs, Controllers/
```

`IsInventoryDbContext` was generated with `dotnet ef dbcontext scaffold` against a
real SQL Server instance running all 8 files in `docs/database/` in order —
not hand-written — so it reflects the schema exactly, including all 45
temporal tables (via EF Core's native `IsTemporal()` config) and 45 reporting
views (as keyless entities).

## Getting started

Connection string is **never** committed — set it via user-secrets locally:

```bash
cd src/IsInventory.Api
dotnet user-secrets set "ConnectionStrings:IsInventoryDatabase" \
  "Server=<host>,<port>;Database=IS_Inventory;User Id=<user>;Password=<password>;TrustServerCertificate=True;Encrypt=True"
dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 48)"
dotnet run
```

`Jwt:Secret` signs access tokens (`IsInventory.Infrastructure/Security/JwtTokenService.cs`) — the app
refuses to start without one set. Rotating it invalidates every issued access token (refresh
tokens still work since they're validated against the DB, not the JWT signature).

`GET /health/db` confirms connectivity and returns the live table count —
useful for verifying Sprint 0 setup, remove once real endpoints exist.

Production reads the connection string from an environment variable /
Key Vault, never from `appsettings.json` (NFR-07).

## Regenerating entities after a schema change

If `docs/database/*.sql` changes, re-scaffold rather than hand-editing the
generated files:

```bash
dotnet tool install --global dotnet-ef  # once
cd src/IsInventory.Infrastructure
dotnet ef dbcontext scaffold "<connection string>" Microsoft.EntityFrameworkCore.SqlServer \
  --output-dir Entities --context-dir . --context IsInventoryDbContext \
  --namespace IsInventory.Infrastructure.Entities --context-namespace IsInventory.Infrastructure \
  --no-onconfiguring --force
```

Known gotcha: `dbo.file_shares` scaffolds to an entity named `FileShare`,
which collides with `System.IO.FileShare` (a .NET 8 classlib implicit global
using). `IsInventoryDbContext.cs` has a `using FileShare = IsInventory.Infrastructure.Entities.FileShare;`
alias for this — re-add it if a re-scaffold overwrites the file.
