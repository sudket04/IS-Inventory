/* =============================================================================
   IS-Inventory v2 — 02: Core (RBAC, users, locations, lookups)

   The big change from v1: `app_users.role` was a VARCHAR locked down by
   CHECK (role IN ('Admin','User','Viewer')). Permissions lived in the
   constraint, so adding a role meant ALTER TABLE and a redeploy, and there
   was nowhere to record *what* a role may do in *which* module.

   Here a role is a row, a permission is a row, and the link between them is a
   row. Adding "Site Support, may edit network gear but only view servers" is
   an INSERT, not a migration.

   Soft delete: rows carry is_deleted/deleted_at/deleted_by instead of being
   removed, which is what makes the Recycle bin restore a real record (with
   its foreign keys intact) rather than re-inserting a JSON blob. Business-key
   uniqueness is therefore enforced by FILTERED unique indexes — a deleted
   serial number must not block someone reusing it.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------------
   Roles
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.roles', 'U') IS NULL
CREATE TABLE dbo.roles (
    role_id     VARCHAR(20)   NOT NULL CONSTRAINT PK_roles PRIMARY KEY,   -- ROL-001
    role_name   NVARCHAR(60)  NOT NULL,
    description NVARCHAR(200) NULL,
    is_system   BIT           NOT NULL DEFAULT 0,   -- 1 = built-in, UI must refuse to delete it
    is_active   BIT           NOT NULL DEFAULT 1,
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_roles_name UNIQUE (role_name)
);
GO

/* ---------------------------------------------------------------------------
   Permissions — one row per (module, action).

   permission_id is the natural key 'hardware.create' rather than a surrogate:
   it is what the API and the front-end check against, so a readable id keeps
   the authorization code self-documenting (require("vlans.edit")).
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.permissions', 'U') IS NULL
CREATE TABLE dbo.permissions (
    permission_id VARCHAR(60)  NOT NULL CONSTRAINT PK_permissions PRIMARY KEY, -- 'hardware.create'
    module_key    VARCHAR(40)  NOT NULL,   -- 'hardware' — matches TABLES[] in app.js
    action        VARCHAR(10)  NOT NULL
                  CONSTRAINT CK_permissions_action
                  CHECK (action IN ('view','create','edit','delete','export')),
    label         NVARCHAR(120) NOT NULL,
    sort_order    INT          NOT NULL DEFAULT 0,
    CONSTRAINT UQ_permissions_module_action UNIQUE (module_key, action)
);
GO

IF OBJECT_ID('dbo.role_permissions', 'U') IS NULL
CREATE TABLE dbo.role_permissions (
    role_id       VARCHAR(20) NOT NULL
                  CONSTRAINT FK_roleperm_role REFERENCES dbo.roles(role_id) ON DELETE CASCADE,
    permission_id VARCHAR(60) NOT NULL
                  CONSTRAINT FK_roleperm_perm REFERENCES dbo.permissions(permission_id) ON DELETE CASCADE,
    granted_at    DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_role_permissions PRIMARY KEY (role_id, permission_id)
);
GO

/* ---------------------------------------------------------------------------
   Application users
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.app_users', 'U') IS NULL
CREATE TABLE dbo.app_users (
    user_id              VARCHAR(20)   NOT NULL CONSTRAINT PK_app_users PRIMARY KEY, -- USR-001
    username             NVARCHAR(60)  NOT NULL,
    full_name            NVARCHAR(120) NOT NULL,
    email                NVARCHAR(150) NULL,
    /* bcrypt / argon2 output — 60 chars for bcrypt, headroom for argon2id.
       v1 seeded this column with the literal string 'admin123'; the seed in
       10_seed.sql stores a real bcrypt hash and forces a change on first login. */
    password_hash        NVARCHAR(255) NOT NULL,
    password_changed_at  DATETIME2(0)  NULL,
    must_change_password BIT           NOT NULL DEFAULT 1,

    role_id              VARCHAR(20)   NOT NULL
                         CONSTRAINT FK_appusers_role REFERENCES dbo.roles(role_id),

    status               VARCHAR(10)   NOT NULL DEFAULT 'Active'
                         CONSTRAINT CK_appusers_status CHECK (status IN ('Active','Disabled')),

    /* Brute-force throttling: the API bumps failed_login_count and sets
       locked_until once it crosses the threshold. */
    failed_login_count   INT           NOT NULL DEFAULT 0,
    locked_until         DATETIME2(0)  NULL,
    last_login_at        DATETIME2(0)  NULL,

    is_deleted           BIT           NOT NULL DEFAULT 0,
    deleted_at           DATETIME2(0)  NULL,
    deleted_by           VARCHAR(20)   NULL,
    created_at           DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by           VARCHAR(20)   NULL,
    updated_at           DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by           VARCHAR(20)   NULL
);
GO

/* Username is unique among live accounts only — deleting USR-007 'somchai'
   must not stop a new 'somchai' being created later. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_appusers_username' AND object_id = OBJECT_ID('dbo.app_users'))
CREATE UNIQUE INDEX UQ_appusers_username ON dbo.app_users(username) WHERE is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   Location master — Site > Factory > Floor > Area > Rack (self-referencing)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.locations', 'U') IS NULL
CREATE TABLE dbo.locations (
    location_id VARCHAR(20)   NOT NULL CONSTRAINT PK_locations PRIMARY KEY,  -- LOC-001
    level       VARCHAR(10)   NOT NULL
                CONSTRAINT CK_locations_level CHECK (level IN ('Site','Factory','Floor','Area','Rack')),
    name        NVARCHAR(120) NOT NULL,
    parent_id   VARCHAR(20)   NULL
                CONSTRAINT FK_locations_parent REFERENCES dbo.locations(location_id),
    rack_units  INT           NULL           -- rack height in U; level = 'Rack' only
                CONSTRAINT CK_locations_rack_units CHECK (rack_units IS NULL OR rack_units BETWEEN 1 AND 60),
    remarks     NVARCHAR(400) NULL,

    /* A Site is the only level allowed to have no parent. */
    CONSTRAINT CK_locations_root CHECK (
        (level = 'Site' AND parent_id IS NULL) OR (level <> 'Site' AND parent_id IS NOT NULL)
    ),
    /* rack_units only means anything on a Rack. */
    CONSTRAINT CK_locations_rack_only CHECK (level = 'Rack' OR rack_units IS NULL),

    is_deleted  BIT           NOT NULL DEFAULT 0,
    deleted_at  DATETIME2(0)  NULL,
    deleted_by  VARCHAR(20)   NULL CONSTRAINT FK_locations_deletedby REFERENCES dbo.app_users(user_id),
    created_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  VARCHAR(20)   NULL CONSTRAINT FK_locations_createdby REFERENCES dbo.app_users(user_id),
    updated_at  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by  VARCHAR(20)   NULL CONSTRAINT FK_locations_updatedby REFERENCES dbo.app_users(user_id)
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_locations_sibling' AND object_id = OBJECT_ID('dbo.locations'))
CREATE UNIQUE INDEX UQ_locations_sibling ON dbo.locations(level, parent_id, name) WHERE is_deleted = 0;
GO

/* ---------------------------------------------------------------------------
   Per-user site scope — the second half of the authorization model.

   role_permissions answers "may this user edit network gear?";
   user_site_scope answers "…which network gear?". A user with no rows here
   sees every site (that is how Admin and the IS engineers work); a user with
   rows is limited to those Sites and everything beneath them.
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.user_site_scope', 'U') IS NULL
CREATE TABLE dbo.user_site_scope (
    user_id     VARCHAR(20) NOT NULL
                CONSTRAINT FK_usersite_user REFERENCES dbo.app_users(user_id) ON DELETE CASCADE,
    location_id VARCHAR(20) NOT NULL
                CONSTRAINT FK_usersite_location REFERENCES dbo.locations(location_id),
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_user_site_scope PRIMARY KEY (user_id, location_id)
);
GO

/* ---------------------------------------------------------------------------
   Editable lookups (the "+ Add" buttons in the forms write here)
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.catalog_values', 'U') IS NULL
CREATE TABLE dbo.catalog_values (
    catalog_key VARCHAR(40)  NOT NULL,   -- ram_gb / cpu_cores / os_version_windows / software_category / ...
    value       NVARCHAR(80) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BIT          NOT NULL DEFAULT 1,   -- retire a value without breaking rows that already use it
    created_at  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_catalog_values PRIMARY KEY (catalog_key, value)
);
GO

IF OBJECT_ID('dbo.server_roles', 'U') IS NULL
CREATE TABLE dbo.server_roles (
    role_name  NVARCHAR(80) NOT NULL CONSTRAINT PK_server_roles PRIMARY KEY,
    is_active  BIT          NOT NULL DEFAULT 1,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------------------------------------------------------
   Infrastructure tables
   --------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.app_config', 'U') IS NULL
CREATE TABLE dbo.app_config (
    config_key   VARCHAR(60)   NOT NULL CONSTRAINT PK_app_config PRIMARY KEY,
    config_value NVARCHAR(MAX) NULL,
    updated_at   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* Atomic id allocation. v1 computed "max + 1" over an array in one browser's
   memory, so two people creating a record at the same moment could both get
   HW-042. next_id() below hands out ids under an UPDLOCK instead. */
IF OBJECT_ID('dbo.id_counters', 'U') IS NULL
CREATE TABLE dbo.id_counters (
    counter_key VARCHAR(20) NOT NULL CONSTRAINT PK_id_counters PRIMARY KEY,  -- 'HW', 'SRV', 'VLA', ...
    next_seq    INT         NOT NULL DEFAULT 0
);
GO

CREATE OR ALTER PROCEDURE dbo.sp_NextId
    @prefix  VARCHAR(20),
    @new_id  VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @seq INT;

    BEGIN TRANSACTION;
        UPDATE dbo.id_counters WITH (UPDLOCK, HOLDLOCK)
           SET @seq = next_seq = next_seq + 1
         WHERE counter_key = @prefix;

        IF @@ROWCOUNT = 0
        BEGIN
            INSERT INTO dbo.id_counters (counter_key, next_seq) VALUES (@prefix, 1);
            SET @seq = 1;
        END
    COMMIT TRANSACTION;

    SET @new_id = @prefix + '-' + RIGHT('000' + CAST(@seq AS VARCHAR(10)), 3);
END;
GO
