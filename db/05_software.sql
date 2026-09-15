/* =============================================================================
   IS-Inventory v2 — 05: Software catalogue, licences, allocations

   Two v1 problems are fixed here:

   1. software_licenses.currency survived in the schema after the UI was
      changed to THB-only, so the database still allowed a USD row the forms
      could no longer produce. Money is DECIMAL cost_thb, full stop.

   2. software_allocations pointed at its target by NAME
      (target_name NVARCHAR(150) + target_type). Renaming a server silently
      orphaned the allocation and the "seats used" count quietly went wrong —
      the worst kind of bug in a licence-compliance tool, because nothing
      looks broken. Targets are foreign keys now.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   Catalogue — what software exists, independent of what was bought
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.software_catalogue', 'U') IS NULL
CREATE TABLE dbo.software_catalogue (
    software_id VARCHAR(20)   NOT NULL CONSTRAINT PK_software_catalogue PRIMARY KEY,  -- SWC-001
    vendor      NVARCHAR(120) NOT NULL,
    name        NVARCHAR(150) NOT NULL,
    edition     NVARCHAR(80)  NULL,
    version     NVARCHAR(40)  NULL,
    category    NVARCHAR(80)  NOT NULL,
    type        NVARCHAR(80)  NOT NULL,
    deployment  VARCHAR(20)   NOT NULL DEFAULT 'On-Premise'
                CONSTRAINT CK_swcat_deploy CHECK (deployment IN ('On-Premise','Cloud','Hybrid')),
    criticality VARCHAR(10)   NOT NULL DEFAULT 'Medium'
                CONSTRAINT CK_swcat_critical CHECK (criticality IN ('Critical','High','Medium','Low')),
    status      VARCHAR(10)   NOT NULL DEFAULT 'Active'
                CONSTRAINT CK_swcat_status CHECK (status IN ('Active','Inactive','Retired')),
    description NVARCHAR(500) NULL,

    is_deleted  BIT           NOT NULL DEFAULT 0,
    deleted_at  DATETIME2(0)  NULL,
    deleted_by  VARCHAR(20)   NULL CONSTRAINT FK_swcat_deletedby REFERENCES dbo.app_users(user_id),
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  VARCHAR(20)   NULL CONSTRAINT FK_swcat_createdby REFERENCES dbo.app_users(user_id),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by  VARCHAR(20)   NULL CONSTRAINT FK_swcat_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_swcat_identity' AND object_id = OBJECT_ID('dbo.software_catalogue'))
CREATE UNIQUE INDEX UQ_swcat_identity
    ON dbo.software_catalogue(vendor, name, edition, version) WHERE is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   Licences — what was actually bought
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.software_licenses', 'U') IS NULL
CREATE TABLE dbo.software_licenses (
    license_id     VARCHAR(20)   NOT NULL CONSTRAINT PK_software_licenses PRIMARY KEY,  -- LIC-001
    software_id    VARCHAR(20)   NOT NULL
                   CONSTRAINT FK_swlic_software REFERENCES dbo.software_catalogue(software_id),
    license_type   NVARCHAR(60)  NULL,
    license_metric NVARCHAR(60)  NULL,
    purchased_qty  INT           NOT NULL
                   CONSTRAINT CK_swlic_qty CHECK (purchased_qty > 0),
    unit           NVARCHAR(40)  NULL,

    purchase_date  DATE          NULL,
    start_date     DATE          NULL,
    expiry_date    DATE          NULL,          -- NULL = perpetual
    CONSTRAINT CK_swlic_period CHECK (start_date IS NULL OR expiry_date IS NULL OR expiry_date >= start_date),

    contract_no    NVARCHAR(60)  NULL,
    po_no          NVARCHAR(60)  NULL,
    invoice_no     NVARCHAR(60)  NULL,

    /* THB only — the column name says so, so no future reader has to wonder
       which currency an untyped `cost` was in. */
    cost_thb       DECIMAL(14,2) NULL
                   CONSTRAINT CK_swlic_cost CHECK (cost_thb IS NULL OR cost_thb >= 0),

    auto_renewal   BIT           NOT NULL DEFAULT 0,
    owner          NVARCHAR(120) NULL,
    remark         NVARCHAR(500) NULL,

    is_deleted     BIT           NOT NULL DEFAULT 0,
    deleted_at     DATETIME2(0)  NULL,
    deleted_by     VARCHAR(20)   NULL CONSTRAINT FK_swlic_deletedby REFERENCES dbo.app_users(user_id),
    created_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by     VARCHAR(20)   NULL CONSTRAINT FK_swlic_createdby REFERENCES dbo.app_users(user_id),
    updated_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by     VARCHAR(20)   NULL CONSTRAINT FK_swlic_updatedby REFERENCES dbo.app_users(user_id)
);
GO

/* ---------------------------------------------------------------------------
   Allocations — where each seat went
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.software_allocations', 'U') IS NULL
CREATE TABLE dbo.software_allocations (
    allocation_id  VARCHAR(20)   NOT NULL CONSTRAINT PK_software_allocations PRIMARY KEY,  -- ALC-001
    license_id     VARCHAR(20)   NOT NULL
                   CONSTRAINT FK_swalloc_license REFERENCES dbo.software_licenses(license_id),

    /* Same pattern as ip_allocations: one nullable FK per possible target,
       plus a CHECK that exactly one is set. Renaming a server can no longer
       detach its licence. free_text_target stays for the genuinely
       unmodelled cases (a site-wide entitlement, an external contractor). */
    server_id      VARCHAR(20)   NULL CONSTRAINT FK_swalloc_server REFERENCES dbo.servers(server_id),
    device_id      VARCHAR(20)   NULL CONSTRAINT FK_swalloc_device REFERENCES dbo.network_devices(device_id),
    hardware_id    VARCHAR(20)   NULL CONSTRAINT FK_swalloc_hw     REFERENCES dbo.hardware(hardware_id),
    ad_user_id     VARCHAR(20)   NULL,   -- FK added in 06 once ad_users exists
    location_id    VARCHAR(20)   NULL CONSTRAINT FK_swalloc_location REFERENCES dbo.locations(location_id),
    free_text_target NVARCHAR(150) NULL,

    CONSTRAINT CK_swalloc_one_target CHECK (
        (CASE WHEN server_id        IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN device_id        IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN hardware_id      IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN ad_user_id       IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN location_id      IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN free_text_target IS NOT NULL THEN 1 ELSE 0 END) = 1
    ),

    quantity       INT           NOT NULL
                   CONSTRAINT CK_swalloc_qty CHECK (quantity > 0),
    unit           NVARCHAR(40)  NULL,
    environment    VARCHAR(20)   NOT NULL DEFAULT 'Production'
                   CONSTRAINT CK_swalloc_env CHECK (environment IN ('Production','DR','Test','Development')),
    remark         NVARCHAR(500) NULL,

    is_deleted     BIT           NOT NULL DEFAULT 0,
    deleted_at     DATETIME2(0)  NULL,
    deleted_by     VARCHAR(20)   NULL CONSTRAINT FK_swalloc_deletedby REFERENCES dbo.app_users(user_id),
    created_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by     VARCHAR(20)   NULL CONSTRAINT FK_swalloc_createdby REFERENCES dbo.app_users(user_id),
    updated_at     DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by     VARCHAR(20)   NULL CONSTRAINT FK_swalloc_updatedby REFERENCES dbo.app_users(user_id)
);
GO
