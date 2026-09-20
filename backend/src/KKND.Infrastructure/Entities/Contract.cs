using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class Contract
{
    public int ContractId { get; set; }

    public string ContractNo { get; set; } = null!;

    public string? VendorContractNo { get; set; }

    public string ContractType { get; set; } = null!;

    public int? VendorId { get; set; }

    public int? PreviousContractId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal? ContractValue { get; set; }

    public string Currency { get; set; } = null!;

    public decimal? ExchangeRate { get; set; }

    public string? PoNumber { get; set; }

    public string? CoverageHours { get; set; }

    public string? ServiceType { get; set; }

    public short? SlaResponseHours { get; set; }

    public short? SlaResolutionHours { get; set; }

    public bool AutoRenew { get; set; }

    public short? RenewalNoticeDays { get; set; }

    public string Status { get; set; } = null!;

    public int? OwnerUserId { get; set; }

    public string? ContactPerson { get; set; }

    public string? ContactPhone { get; set; }

    public string? ContactEmail { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual ICollection<ContractAsset> ContractAssets { get; set; } = new List<ContractAsset>();

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<Contract> InversePreviousContract { get; set; } = new List<Contract>();

    public virtual User? OwnerUser { get; set; }

    public virtual Contract? PreviousContract { get; set; }

    public virtual User? UpdatedByNavigation { get; set; }

    public virtual Vendor? Vendor { get; set; }
}
