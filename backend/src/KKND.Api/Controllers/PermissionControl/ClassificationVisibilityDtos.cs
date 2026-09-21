namespace KKND.Api.Controllers.PermissionControl;

public sealed record ClassificationLevelItem(int ClassificationId, string Code, string NameTh, string NameEn, byte SensitivityRank, string ColorToken, bool RequiresViewAudit);

public sealed record RoleItem(int RoleId, string Code, string Name);

public sealed record VisibilityCell(int ClassificationId, int RoleId, bool CanView, bool CanEdit, bool CanExport);

public sealed record VisibilityMatrix(IReadOnlyList<ClassificationLevelItem> Classifications, IReadOnlyList<RoleItem> Roles, IReadOnlyList<VisibilityCell> Cells);

public sealed record VisibilityCellRequest(bool CanView, bool CanEdit, bool CanExport);
