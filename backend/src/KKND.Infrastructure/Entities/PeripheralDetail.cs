using System;
using System.Collections.Generic;

namespace KKND.Infrastructure.Entities;

public partial class PeripheralDetail
{
    public int AssetId { get; set; }

    public string? ConnectionType { get; set; }

    public string? FirmwareVersion { get; set; }

    public string? PrintTechnology { get; set; }

    public bool? IsColor { get; set; }

    public string? MaxPaperSize { get; set; }

    public bool? HasDuplex { get; set; }

    public bool? HasAdf { get; set; }

    public int? PageCounterMono { get; set; }

    public int? PageCounterColor { get; set; }

    public DateOnly? CounterReadDate { get; set; }

    public string? TonerModel { get; set; }

    public decimal? ScreenSizeInch { get; set; }

    public string? Resolution { get; set; }

    public string? PanelType { get; set; }

    public short? RefreshRateHz { get; set; }

    public bool? HasSpeaker { get; set; }

    public string? MountType { get; set; }

    public virtual Asset Asset { get; set; } = null!;
}
