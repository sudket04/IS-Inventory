/* =============================================================================
   IS-Inventory v2 — 07: System-versioned history

   v1 kept change history by hand: every save wrote the entire record as a
   JSON snapshot into dbo.record_versions. Three problems with that —
   changing one field stored the whole row, the history only existed if the
   application remembered to write it, and a direct UPDATE in SSMS left no
   trace at all.

   SQL Server keeps this itself. Each table below gets a hidden period and a
   companion <table>_history that the engine writes on every UPDATE and
   DELETE, whoever issues it. Querying it:

       SELECT * FROM dbo.hardware FOR SYSTEM_TIME AS OF '2026-06-01'
        WHERE hardware_id = 'HW-042';

       SELECT * FROM dbo.servers FOR SYSTEM_TIME BETWEEN '2026-01-01' AND '2026-06-30'
        WHERE server_id = 'SRV-042' ORDER BY valid_from;

   dbo.audit_log (06_access.sql) stays: it answers "who did what, when" in one
   cheap chronological feed. The temporal tables answer "what exactly changed".
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* Adds the period columns and switches versioning on for one table.
   Idempotent — running the script twice is a no-op on tables already done. */
CREATE OR ALTER PROCEDURE dbo.sp_EnableSystemVersioning
    @table_name SYSNAME
AS
BEGIN
    SET NOCOUNT ON;

    IF OBJECT_ID('dbo.' + @table_name, 'U') IS NULL
    BEGIN
        RAISERROR('Table dbo.%s does not exist — skipped.', 10, 1, @table_name) WITH NOWAIT;
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM sys.tables
                WHERE object_id = OBJECT_ID('dbo.' + @table_name)
                  AND temporal_type = 2)          -- 2 = system-versioned
    BEGIN
        RAISERROR('dbo.%s is already system-versioned — skipped.', 10, 1, @table_name) WITH NOWAIT;
        RETURN;
    END

    DECLARE @sql NVARCHAR(MAX);

    /* HIDDEN keeps the two period columns out of SELECT * so existing
       queries and the API's column introspection are unaffected. */
    SET @sql = N'
        ALTER TABLE dbo.' + QUOTENAME(@table_name) + N' ADD
            valid_from DATETIME2(0) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
                       CONSTRAINT DF_' + @table_name + N'_valid_from DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2(0) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
                       CONSTRAINT DF_' + @table_name + N'_valid_to   DEFAULT ''9999-12-31 23:59:59'',
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);';
    EXEC sp_executesql @sql;

    SET @sql = N'
        ALTER TABLE dbo.' + QUOTENAME(@table_name) + N'
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.' + QUOTENAME(@table_name + '_history')
          + N', DATA_CONSISTENCY_CHECK = ON));';
    EXEC sp_executesql @sql;

    RAISERROR('dbo.%s is now system-versioned.', 10, 1, @table_name) WITH NOWAIT;
END;
GO

/* The tables whose history anyone will ever ask about. Junction tables
   (role_permissions, hardware_usage, ad_memberships) and the append-only
   audit_log are deliberately left out — their rows are created and dropped,
   not edited, so a history table would only duplicate them. */
EXEC dbo.sp_EnableSystemVersioning 'hardware';
EXEC dbo.sp_EnableSystemVersioning 'clusters';
EXEC dbo.sp_EnableSystemVersioning 'servers';
EXEC dbo.sp_EnableSystemVersioning 'vlans';
EXEC dbo.sp_EnableSystemVersioning 'network_devices';
EXEC dbo.sp_EnableSystemVersioning 'ip_allocations';
EXEC dbo.sp_EnableSystemVersioning 'software_catalogue';
EXEC dbo.sp_EnableSystemVersioning 'software_licenses';
EXEC dbo.sp_EnableSystemVersioning 'software_allocations';
EXEC dbo.sp_EnableSystemVersioning 'server_permissions';
EXEC dbo.sp_EnableSystemVersioning 'ad_users';
EXEC dbo.sp_EnableSystemVersioning 'locations';
EXEC dbo.sp_EnableSystemVersioning 'app_users';
GO

/* ---------------------------------------------------------------------------
   Retention: keep three years of history, then let SQL Server age it out.
   Without this the history tables grow forever.
   --------------------------------------------------------------------------- */
DECLARE @t SYSNAME, @sql NVARCHAR(MAX);
DECLARE c CURSOR LOCAL FAST_FORWARD FOR
    SELECT t.name FROM sys.tables t WHERE t.temporal_type = 2;
OPEN c;
FETCH NEXT FROM c INTO @t;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@t)
             + N' SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.' + QUOTENAME(@t + '_history')
             + N', HISTORY_RETENTION_PERIOD = 3 YEARS));';
    EXEC sp_executesql @sql;
    FETCH NEXT FROM c INTO @t;
END
CLOSE c; DEALLOCATE c;
GO

/* Retention only runs when the database-level cleanup is on. */
DECLARE @db SYSNAME = DB_NAME();
EXEC ('ALTER DATABASE ' + @db + ' SET TEMPORAL_HISTORY_RETENTION ON');
GO
