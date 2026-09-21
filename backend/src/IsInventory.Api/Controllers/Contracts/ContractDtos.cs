namespace IsInventory.Api.Controllers.Contracts;

public sealed record ContractListItem(
    int ContractId, string ContractNo, string? VendorContractNo, string ContractType,
    string? VendorName, DateOnly StartDate, DateOnly EndDate, string Status,
    decimal? ContractValue, string Currency, int AssetCount, bool AutoRenew);

public sealed record ContractDetail(
    int ContractId, string ContractNo, string? VendorContractNo, string ContractType,
    int? VendorId, string? VendorName, int? PreviousContractId, string? PreviousContractNo,
    DateOnly StartDate, DateOnly EndDate, decimal? ContractValue, string Currency, decimal? ExchangeRate,
    string? PoNumber, string? CoverageHours, string? ServiceType, short? SlaResponseHours, short? SlaResolutionHours,
    bool AutoRenew, short? RenewalNoticeDays, string Status,
    int? OwnerUserId, string? OwnerName, string? ContactPerson, string? ContactPhone, string? ContactEmail,
    string? Notes, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt);

public sealed record ContractRequest(
    string ContractNo, string? VendorContractNo, string ContractType, int? VendorId, int? PreviousContractId,
    DateOnly StartDate, DateOnly EndDate, decimal? ContractValue, string? Currency, decimal? ExchangeRate,
    string? PoNumber, string? CoverageHours, string? ServiceType, short? SlaResponseHours, short? SlaResolutionHours,
    bool AutoRenew, short? RenewalNoticeDays, string Status,
    int? OwnerUserId, string? ContactPerson, string? ContactPhone, string? ContactEmail, string? Notes);

public sealed record ContractAssetItem(
    int ContractAssetId, int AssetId, string AssetTag, string AssetName,
    DateOnly CoverageStart, DateOnly CoverageEnd, decimal? AllocatedCost, int? SeatCount,
    string? ServiceLevelNote, string? Notes);

public sealed record ContractAssetCreateRequest(
    int AssetId, DateOnly CoverageStart, DateOnly CoverageEnd, decimal? AllocatedCost, int? SeatCount,
    string? ServiceLevelNote, string? Notes);

public sealed record ContractAssetUpdateRequest(
    DateOnly CoverageStart, DateOnly CoverageEnd, decimal? AllocatedCost, int? SeatCount,
    string? ServiceLevelNote, string? Notes);
