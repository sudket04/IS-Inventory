using KKND.Infrastructure;
using KKND.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KKND.Api.Controllers.Lookups;

[Route("api/lookups/departments")]
public sealed class DepartmentsController : LookupsControllerBase<Department, DepartmentsController.Dto>
{
    public sealed record Dto(string Code, string Name);

    public DepartmentsController(KkndDbContext db) : base(db) { }

    protected override DbSet<Department> Set => Db.Departments;
    protected override int GetId(Department entity) => entity.DepartmentId;
    protected override void SetActiveFlag(Department entity, bool value) => entity.IsActive = value;

    protected override void Apply(Department entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.Name = dto.Name.Trim();
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Assets", (db, id, ct) => db.Assets.CountAsync(a => a.DepartmentId == id && !a.IsDeleted, ct)),
        new("Users", (db, id, ct) => db.Users.CountAsync(u => u.DepartmentId == id, ct)),
        new("File Shares", (db, id, ct) => db.FileShares.CountAsync(f => f.OwnerDepartmentId == id && !f.IsDeleted, ct)),
    };
}
