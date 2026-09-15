/* =============================================================================
   IS-Inventory v2 — 06: Directory data and share permissions

   These tables record what Active Directory already contains — this app reads
   and documents that world, it does not authenticate against it. Application
   logins live in dbo.app_users (02_core.sql) with their own bcrypt hashes.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   AD users and their group memberships
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.ad_users', 'U') IS NULL
CREATE TABLE dbo.ad_users (
    ad_user_id   VARCHAR(20)   NOT NULL CONSTRAINT PK_ad_users PRIMARY KEY,   -- AD-001
    user_logon   NVARCHAR(60)  NOT NULL,
    display_name NVARCHAR(150) NULL,
    status       VARCHAR(10)   NOT NULL DEFAULT 'Enabled'
                 CONSTRAINT CK_adusers_status CHECK (status IN ('Enabled','Disabled')),
    job_title    NVARCHAR(120) NULL,
    department   NVARCHAR(120) NULL,
    email        NVARCHAR(150) NULL,
    remarks      NVARCHAR(400) NULL,

    is_deleted   BIT           NOT NULL DEFAULT 0,
    deleted_at   DATETIME2(0)  NULL,
    deleted_by   VARCHAR(20)   NULL CONSTRAINT FK_adusers_deletedby REFERENCES dbo.app_users(user_id),
    created_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by   VARCHAR(20)   NULL CONSTRAINT FK_adusers_createdby REFERENCES dbo.app_users(user_id),
    updated_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by   VARCHAR(20)   NULL CONSTRAINT FK_adusers_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_adusers_logon' AND object_id = OBJECT_ID('dbo.ad_users'))
CREATE UNIQUE INDEX UQ_adusers_logon ON dbo.ad_users(user_logon) WHERE is_deleted = 0;
GO

/* v1 kept a group_count INT alongside the memberships, so the number could
   disagree with the rows it was counting. It is derived in 09_views.sql now. */
IF OBJECT_ID('dbo.ad_memberships', 'U') IS NULL
CREATE TABLE dbo.ad_memberships (
    membership_id VARCHAR(20)   NOT NULL CONSTRAINT PK_ad_memberships PRIMARY KEY,  -- MBR-001
    ad_user_id    VARCHAR(20)   NOT NULL
                  CONSTRAINT FK_admember_user REFERENCES dbo.ad_users(ad_user_id) ON DELETE CASCADE,
    group_name    NVARCHAR(150) NOT NULL,
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_admember_user_group UNIQUE (ad_user_id, group_name)
);
GO

/* The FK that 05_software.sql had to defer until ad_users existed. */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_swalloc_aduser')
ALTER TABLE dbo.software_allocations
    ADD CONSTRAINT FK_swalloc_aduser FOREIGN KEY (ad_user_id) REFERENCES dbo.ad_users(ad_user_id);
GO

/* ---------------------------------------------------------------------------
   Shared folder permissions on a server
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.server_permissions', 'U') IS NULL
CREATE TABLE dbo.server_permissions (
    permission_id VARCHAR(20)   NOT NULL CONSTRAINT PK_server_permissions PRIMARY KEY,  -- PRM-001
    server_id     VARCHAR(20)   NOT NULL
                  CONSTRAINT FK_serverperm_server REFERENCES dbo.servers(server_id),
    folder_name   NVARCHAR(150) NOT NULL,
    folder_path   NVARCHAR(400) NULL,
    level         NVARCHAR(40)  NULL,
    department    NVARCHAR(120) NULL,
    rw_group      NVARCHAR(150) NULL,   -- AD group with read/write
    ro_group      NVARCHAR(150) NULL,   -- AD group with read-only
    quota_gb      INT           NULL,
    owner         NVARCHAR(120) NULL,
    remarks       NVARCHAR(400) NULL,

    is_deleted    BIT           NOT NULL DEFAULT 0,
    deleted_at    DATETIME2(0)  NULL,
    deleted_by    VARCHAR(20)   NULL CONSTRAINT FK_serverperm_deletedby REFERENCES dbo.app_users(user_id),
    created_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by    VARCHAR(20)   NULL CONSTRAINT FK_serverperm_createdby REFERENCES dbo.app_users(user_id),
    updated_at    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by    VARCHAR(20)   NULL CONSTRAINT FK_serverperm_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_serverperm_folder' AND object_id = OBJECT_ID('dbo.server_permissions'))
CREATE UNIQUE INDEX UQ_serverperm_folder ON dbo.server_permissions(server_id, folder_name) WHERE is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   Audit log — who did what, referenced rather than spelled out

   v1 stored the actor as a free NVARCHAR(60) username. That breaks the moment
   someone is renamed, and it cannot be joined to anything. It is a foreign
   key now; the display label is kept alongside so a deleted record still
   reads sensibly in the history.

   Field-level history is NOT here — 07_temporal.sql lets SQL Server keep that
   itself, which is both cheaper and impossible to forget to write.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.audit_log', 'U') IS NULL
CREATE TABLE dbo.audit_log (
    log_id     BIGINT        IDENTITY(1,1) CONSTRAINT PK_audit_log PRIMARY KEY,
    table_key  VARCHAR(40)   NOT NULL,   -- 'hardware', 'servers', ...
    record_id  VARCHAR(20)   NULL,
    display    NVARCHAR(200) NULL,       -- human label as it read at the time
    action     VARCHAR(10)   NOT NULL
               CONSTRAINT CK_auditlog_action
               CHECK (action IN ('Create','Update','Delete','Restore','Renew','Login','Logout','Denied')),
    user_id    VARCHAR(20)   NULL CONSTRAINT FK_auditlog_user REFERENCES dbo.app_users(user_id),
    ip_address NVARCHAR(45)  NULL,       -- client address, for the security trail
    detail     NVARCHAR(MAX) NULL,
    changed_at DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
