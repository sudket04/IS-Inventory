using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class MobileIotDetail
{
    public int AssetId { get; set; }

    public string? Imei { get; set; }

    public string? PhoneNumber { get; set; }

    public string? SimProvider { get; set; }

    public string? OsName { get; set; }

    public string? OsVersion { get; set; }

    public bool? IsMdmEnrolled { get; set; }

    public string? MdmPlatform { get; set; }

    public string? Hostname { get; set; }

    public string? MacAddress { get; set; }

    public string? FirmwareVersion { get; set; }

    public string? DeviceProtocol { get; set; }

    public string? ControllerModel { get; set; }

    public short? IoPointCount { get; set; }

    public string? Resolution { get; set; }

    public bool? HasPtz { get; set; }

    public bool? HasIr { get; set; }

    public string? StorageType { get; set; }

    public string? AssignedToName { get; set; }

    public DateOnly? AssignedDate { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
