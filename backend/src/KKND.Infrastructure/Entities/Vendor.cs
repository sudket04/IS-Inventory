using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class Vendor
{
    public int VendorId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? ContactPerson { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? Address { get; set; }

    public string? TaxId { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}
