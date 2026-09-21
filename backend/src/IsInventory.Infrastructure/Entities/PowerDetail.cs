using System;
using System.Collections.Generic;

namespace IsInventory.Infrastructure.Entities;

public partial class PowerDetail
{
    public int AssetId { get; set; }

    public decimal? CapacityKva { get; set; }

    public decimal? CapacityKw { get; set; }

    public byte? InputPhase { get; set; }

    public string? InputVoltage { get; set; }

    public string? OutputVoltage { get; set; }

    public short? OutletCount { get; set; }

    public string? OutletType { get; set; }

    public short? BatteryCount { get; set; }

    public string? BatteryModel { get; set; }

    public DateOnly? BatteryInstallDate { get; set; }

    public DateOnly? BatteryReplaceDue { get; set; }

    public short? RuntimeMinutesFullLoad { get; set; }

    public decimal? CurrentLoadPercent { get; set; }

    public DateOnly? LoadMeasuredAt { get; set; }

    public bool? HasBypass { get; set; }

    public bool? HasSnmpCard { get; set; }

    public string? FirmwareVersion { get; set; }

    public int? CoolingCapacityBtu { get; set; }

    public string? RefrigerantType { get; set; }

    public DateOnly? LastServiceDate { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
