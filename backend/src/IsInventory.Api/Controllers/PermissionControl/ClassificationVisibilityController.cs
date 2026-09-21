using System.Security.Claims;
using IsInventory.Api.Authorization;
using IsInventory.Domain.Security;
using IsInventory.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IsInventory.Api.Controllers.PermissionControl;

/// <summary>
/// Admin-only screen for dbo.classification_role_visibility — the 7-level x 4-role matrix
/// that FileSharesController reads to decide what each caller may see/edit/export. Every
/// cell already exists (seeded as a full CROSS JOIN in the v1.5 migration), so this is
/// always an update to an existing row, never an insert.
/// </summary>
[ApiController]
[Route("api/admin/classification-visibility")]
[Authorize]
[RequiresPermission("admin_classification_visibility", PermissionAction.View)]
public sealed class ClassificationVisibilityController : ControllerBase
{
    private readonly IsInventoryDbContext _db;

    public ClassificationVisibilityController(IsInventoryDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<VisibilityMatrix>> Get(CancellationToken ct)
    {
        var classifications = await _db.FolderClassificationLevels
            .Where(c => c.IsActive)
            .OrderBy(c => c.SensitivityRank)
            .Select(c => new ClassificationLevelItem(c.ClassificationId, c.Code, c.NameTh, c.NameEn, c.SensitivityRank, c.ColorToken, c.RequiresViewAudit))
            .ToListAsync(ct);

        var roles = await _db.Roles
            .OrderBy(r => r.SortOrder)
            .Select(r => new RoleItem(r.RoleId, r.Code, r.Name))
            .ToListAsync(ct);

        var cells = await _db.ClassificationRoleVisibilities
            .Select(v => new VisibilityCell(v.ClassificationId, v.RoleId, v.CanView, v.CanEdit, v.CanExport))
            .ToListAsync(ct);

        return Ok(new VisibilityMatrix(classifications, roles, cells));
    }

    [HttpPut("{classificationId:int}/{roleId:int}")]
    [RequiresPermission("admin_classification_visibility", PermissionAction.Edit)]
    public async Task<ActionResult<VisibilityCell>> UpdateCell(int classificationId, int roleId, [FromBody] VisibilityCellRequest request, CancellationToken ct)
    {
        var cell = await _db.ClassificationRoleVisibilities
            .FirstOrDefaultAsync(v => v.ClassificationId == classificationId && v.RoleId == roleId, ct);
        if (cell is null) return NotFound();

        cell.CanView = request.CanView;
        // Editing or exporting implies being able to see it at all — never let those two
        // toggle on while view is off, since the UI reads can_view first everywhere else.
        cell.CanEdit = request.CanEdit && request.CanView;
        cell.CanExport = request.CanExport && request.CanView;
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new Infrastructure.Entities.AuditLog
        {
            UserId = CurrentUserId(),
            UsernameSnapshot = User.FindFirstValue(ClaimTypes.Name),
            Action = "SETTING_CHANGE",
            EntityType = "classification_role_visibility",
            EntityId = classificationId,
            EntityLabel = $"classification #{classificationId} / role #{roleId}",
        });
        await _db.SaveChangesAsync(ct);

        return Ok(new VisibilityCell(cell.ClassificationId, cell.RoleId, cell.CanView, cell.CanEdit, cell.CanExport));
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out var id) ? id : null;
    }
}
