using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class Department
{
    public int DepartmentId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public virtual ICollection<AdUser> AdUsers { get; set; } = new List<AdUser>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<FileShare> FileShares { get; set; } = new List<FileShare>();

    public virtual ICollection<ServerApplication> ServerApplications { get; set; } = new List<ServerApplication>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
