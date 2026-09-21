using IsInventory.Infrastructure;
using IsInventory.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.Lookups;

[Route("api/lookups/server-roles")]
public sealed class ServerRolesController : LookupsControllerBase<ServerRole, ServerRolesController.Dto>
{
    public sealed record Dto(
        string Code, string Name, string RoleGroup, string? Description,
        bool IsDhcpProvider, bool IsCriticalService, string? IconName, int SortOrder);

    public ServerRolesController(IsInventoryDbContext db) : base(db) { }

    protected override DbSet<ServerRole> Set => Db.ServerRoles;
    protected override int GetId(ServerRole entity) => entity.ServerRoleId;
    protected override void SetActiveFlag(ServerRole entity, bool value) => entity.IsActive = value;

    protected override void Apply(ServerRole entity, Dto dto)
    {
        entity.Code = dto.Code.Trim();
        entity.Name = dto.Name.Trim();
        entity.RoleGroup = dto.RoleGroup;
        entity.Description = dto.Description;
        entity.IsDhcpProvider = dto.IsDhcpProvider;
        entity.IsCriticalService = dto.IsCriticalService;
        entity.IconName = dto.IconName;
        entity.SortOrder = dto.SortOrder;
    }

    protected override IReadOnlyList<UsageCount> UsageCounts { get; } = new UsageCount[]
    {
        new("Server Role Assignments", (db, id, ct) => db.ServerRoleAssignments.CountAsync(a => a.ServerRoleId == id, ct)),
        new("Server Applications", (db, id, ct) => db.ServerApplications.CountAsync(a => a.ServerTypeId == id, ct)),
    };
}
