/* =============================================================================
   IS-Inventory v2 — behaviour tests for the IP/subnet layer.

   Run after 01-04. Every row prints PASS or FAIL; nothing here writes data
   that survives the run.
   ============================================================================= */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

PRINT '--- fn_IpToInt / fn_IntToIp ---';
SELECT test, expected, actual,
       result = CASE WHEN ISNULL(CAST(actual AS NVARCHAR(50)), '<NULL>')
                        = ISNULL(CAST(expected AS NVARCHAR(50)), '<NULL>')
                     THEN 'PASS' ELSE 'FAIL' END
FROM (VALUES
    ('0.0.0.0',            CAST(0          AS BIGINT), dbo.fn_IpToInt('0.0.0.0')),
    ('10.10.120.42',       CAST(168458282  AS BIGINT), dbo.fn_IpToInt('10.10.120.42')),
    ('192.168.1.100',      CAST(3232235876 AS BIGINT), dbo.fn_IpToInt('192.168.1.100')),
    ('255.255.255.255',    CAST(4294967295 AS BIGINT), dbo.fn_IpToInt('255.255.255.255')),
    ('reject 256.1.1.1',   NULL,                       dbo.fn_IpToInt('256.1.1.1')),
    ('reject 1.2.3',       NULL,                       dbo.fn_IpToInt('1.2.3')),
    ('reject 1.2.3.4.5',   NULL,                       dbo.fn_IpToInt('1.2.3.4.5')),
    ('reject abc',         NULL,                       dbo.fn_IpToInt('abc')),
    ('reject 10.10.10.a',  NULL,                       dbo.fn_IpToInt('10.10.10.a'))
) t(test, expected, actual);

/* Text ordering is the bug BIGINT storage exists to kill: as strings,
   '10.10.10.9' sorts after '10.10.10.10'. As numbers it does not. */
PRINT '--- numeric ordering beats text ordering ---';
SELECT test = 'ipToInt(10.10.10.9) < ipToInt(10.10.10.10)',
       result = CASE WHEN dbo.fn_IpToInt('10.10.10.9') < dbo.fn_IpToInt('10.10.10.10')
                     THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'text comparison is wrong (proves the point)',
       CASE WHEN '10.10.10.9' > '10.10.10.10' THEN 'PASS' ELSE 'FAIL' END;

PRINT '--- round trip ---';
SELECT test = 'IntToIp(IpToInt(x)) = x',
       result = CASE WHEN dbo.fn_IntToIp(dbo.fn_IpToInt('172.16.254.1')) = '172.16.254.1'
                     THEN 'PASS' ELSE 'FAIL' END;

PRINT '--- fn_MaskToPrefix / fn_PrefixToMask ---';
SELECT test, expected, actual,
       result = CASE WHEN ISNULL(CAST(actual AS NVARCHAR(50)), '<NULL>')
                        = ISNULL(CAST(expected AS NVARCHAR(50)), '<NULL>')
                     THEN 'PASS' ELSE 'FAIL' END
FROM (VALUES
    ('mask /24',              CAST(24 AS NVARCHAR(50)), CAST(dbo.fn_MaskToPrefix('255.255.255.0')   AS NVARCHAR(50))),
    ('mask /16',              CAST(16 AS NVARCHAR(50)), CAST(dbo.fn_MaskToPrefix('255.255.0.0')     AS NVARCHAR(50))),
    ('mask /30',              CAST(30 AS NVARCHAR(50)), CAST(dbo.fn_MaskToPrefix('255.255.255.252') AS NVARCHAR(50))),
    ('reject 255.0.255.0',    NULL,                     CAST(dbo.fn_MaskToPrefix('255.0.255.0')     AS NVARCHAR(50))),
    ('prefix 24 -> mask',     N'255.255.255.0',         CAST(dbo.fn_PrefixToMask(24)                AS NVARCHAR(50))),
    ('prefix 22 -> mask',     N'255.255.252.0',         CAST(dbo.fn_PrefixToMask(22)                AS NVARCHAR(50)))
) t(test, expected, actual);

/* ---------------------------------------------------------------------------
   The DHCP pool. These are the same cases the front-end was checked against
   in the browser, now asserted against the database's own arithmetic.
   --------------------------------------------------------------------------- */
PRINT '--- DHCP pool: no static block, gateway at .1 ---';
INSERT INTO dbo.vlans (vlan_id_pk, vlan_id, vlan_name, network_num, prefix_len, gateway_num, dhcp_enabled, dhcp_server_num)
VALUES ('VLA-T01', 3001, N'TEST-no-static', dbo.fn_IpToInt('10.10.10.0'), 24,
        dbo.fn_IpToInt('10.10.10.1'), 1, dbo.fn_IpToInt('10.10.10.1'));

SELECT test = 'usable = 10.10.10.1 - 10.10.10.254 (254 addresses)',
       usable_count,
       first_usable = dbo.fn_IntToIp(first_usable_num),
       last_usable  = dbo.fn_IntToIp(last_usable_num),
       result = CASE WHEN usable_count = 254
                      AND dbo.fn_IntToIp(first_usable_num) = '10.10.10.1'
                      AND dbo.fn_IntToIp(last_usable_num)  = '10.10.10.254'
                     THEN 'PASS' ELSE 'FAIL' END
FROM dbo.vlans WHERE vlan_id_pk = 'VLA-T01';

SELECT test = 'DHCP starts after the gateway -> 10.10.10.2 .. 10.10.10.254',
       dhcp_start = dbo.fn_IntToIp(dhcp_start_num),
       dhcp_end   = dbo.fn_IntToIp(dhcp_end_num),
       result = CASE WHEN dbo.fn_IntToIp(dhcp_start_num) = '10.10.10.2'
                      AND dbo.fn_IntToIp(dhcp_end_num)   = '10.10.10.254'
                     THEN 'PASS' ELSE 'FAIL' END
FROM dbo.vlans WHERE vlan_id_pk = 'VLA-T01';

PRINT '--- DHCP pool shrinks when a static block is reserved ---';
UPDATE dbo.vlans
   SET static_start_num = dbo.fn_IpToInt('10.10.10.2'),
       static_end_num   = dbo.fn_IpToInt('10.10.10.99')
 WHERE vlan_id_pk = 'VLA-T01';

SELECT test = 'static 10.10.10.2-99 -> DHCP 10.10.10.100 .. 10.10.10.254',
       dhcp_start = dbo.fn_IntToIp(dhcp_start_num),
       dhcp_end   = dbo.fn_IntToIp(dhcp_end_num),
       result = CASE WHEN dbo.fn_IntToIp(dhcp_start_num) = '10.10.10.100'
                      AND dbo.fn_IntToIp(dhcp_end_num)   = '10.10.10.254'
                     THEN 'PASS' ELSE 'FAIL' END
FROM dbo.vlans WHERE vlan_id_pk = 'VLA-T01';

PRINT '--- DHCP off -> pool columns are NULL ---';
UPDATE dbo.vlans SET dhcp_enabled = 0, dhcp_server_num = NULL WHERE vlan_id_pk = 'VLA-T01';
SELECT test = 'dhcp_enabled = 0 clears the computed pool',
       result = CASE WHEN dhcp_start_num IS NULL AND dhcp_end_num IS NULL
                     THEN 'PASS' ELSE 'FAIL' END
FROM dbo.vlans WHERE vlan_id_pk = 'VLA-T01';

PRINT '--- a /30 leaves exactly 2 usable addresses ---';
INSERT INTO dbo.vlans (vlan_id_pk, vlan_id, vlan_name, network_num, prefix_len, gateway_num, dhcp_enabled)
VALUES ('VLA-T02', 3002, N'TEST-p2p', dbo.fn_IpToInt('10.99.99.0'), 30, dbo.fn_IpToInt('10.99.99.1'), 0);
SELECT test = '/30 -> 10.99.99.1 .. 10.99.99.2',
       usable_count,
       result = CASE WHEN usable_count = 2
                      AND dbo.fn_IntToIp(first_usable_num) = '10.99.99.1'
                      AND dbo.fn_IntToIp(last_usable_num)  = '10.99.99.2'
                     THEN 'PASS' ELSE 'FAIL' END
FROM dbo.vlans WHERE vlan_id_pk = 'VLA-T02';

PRINT '--- subnet with no room left for DHCP reports NULL, not a wrong range ---';
INSERT INTO dbo.vlans (vlan_id_pk, vlan_id, vlan_name, network_num, prefix_len, gateway_num,
                       static_start_num, static_end_num, dhcp_enabled, dhcp_server_num)
VALUES ('VLA-T03', 3003, N'TEST-full', dbo.fn_IpToInt('10.98.98.0'), 24,
        dbo.fn_IpToInt('10.98.98.1'),
        dbo.fn_IpToInt('10.98.98.2'), dbo.fn_IpToInt('10.98.98.254'), 1,
        dbo.fn_IpToInt('10.98.98.1'));
SELECT test = 'static block consumes the subnet -> dhcp_start_num IS NULL',
       result = CASE WHEN dhcp_start_num IS NULL THEN 'PASS' ELSE 'FAIL' END
FROM dbo.vlans WHERE vlan_id_pk = 'VLA-T03';

/* ---------------------------------------------------------------------------
   Constraints that should reject bad input
   --------------------------------------------------------------------------- */
PRINT '--- constraint: network_num must be a real network address ---';
BEGIN TRY
    INSERT INTO dbo.vlans (vlan_id_pk, vlan_id, vlan_name, network_num, prefix_len, dhcp_enabled)
    VALUES ('VLA-T04', 3004, N'TEST-bad-net', dbo.fn_IpToInt('10.10.10.5'), 24, 0);
    SELECT test = 'reject 10.10.10.5/24', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'reject 10.10.10.5/24', result = 'PASS';
END CATCH;

PRINT '--- constraint: DHCP on requires a DHCP server ---';
BEGIN TRY
    INSERT INTO dbo.vlans (vlan_id_pk, vlan_id, vlan_name, network_num, prefix_len, dhcp_enabled)
    VALUES ('VLA-T05', 3005, N'TEST-no-dhcp-srv', dbo.fn_IpToInt('10.97.97.0'), 24, 1);
    SELECT test = 'reject dhcp_enabled=1 with no dhcp_server', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'reject dhcp_enabled=1 with no dhcp_server', result = 'PASS';
END CATCH;

/* ---------------------------------------------------------------------------
   ip_allocations — the estate-wide uniqueness v1 could not enforce
   --------------------------------------------------------------------------- */
PRINT '--- ip_allocations: same address cannot be used twice ---';
UPDATE dbo.vlans SET dhcp_enabled = 0 WHERE vlan_id_pk = 'VLA-T01';
INSERT INTO dbo.ip_allocations (ip_num, vlan_id_pk, assign_type, purpose, hostname)
VALUES (dbo.fn_IpToInt('10.10.10.50'), 'VLA-T01', 'Static', 'service', N'first-owner');

BEGIN TRY
    INSERT INTO dbo.ip_allocations (ip_num, vlan_id_pk, assign_type, purpose, hostname)
    VALUES (dbo.fn_IpToInt('10.10.10.50'), 'VLA-T01', 'Static', 'management', N'second-owner');
    SELECT test = 'reject duplicate 10.10.10.50 estate-wide', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'reject duplicate 10.10.10.50 estate-wide', result = 'PASS';
END CATCH;

PRINT '--- ip_allocations: address must sit inside its VLAN ---';
BEGIN TRY
    INSERT INTO dbo.ip_allocations (ip_num, vlan_id_pk, assign_type, purpose, hostname)
    VALUES (dbo.fn_IpToInt('192.168.77.5'), 'VLA-T01', 'Static', 'service', N'wrong-subnet');
    SELECT test = 'reject 192.168.77.5 in a 10.10.10.0/24 VLAN', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'reject 192.168.77.5 in a 10.10.10.0/24 VLAN', result = 'PASS';
END CATCH;

PRINT '--- ip_allocations: a row may not have two owners ---';
BEGIN TRY
    INSERT INTO dbo.ip_allocations (ip_num, vlan_id_pk, server_id, device_id)
    VALUES (dbo.fn_IpToInt('10.10.10.51'), 'VLA-T01', 'SRV-001', 'NET-001');
    SELECT test = 'reject server_id and device_id on one row', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'reject server_id and device_id on one row', result = 'PASS';
END CATCH;

PRINT '--- range query: what lives in 10.10.10.0/24 ---';
SELECT test = 'range scan returns the one allocation we made',
       found = COUNT(*),
       result = CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END
  FROM dbo.ip_allocations a
  JOIN dbo.vlans v ON v.vlan_id_pk = 'VLA-T01'
 WHERE a.ip_num BETWEEN v.network_num AND v.broadcast_num;

/* ---------------------------------------------------------------------------
   Warranty expiry is derived, not typed
   --------------------------------------------------------------------------- */
PRINT '--- warranty expiry = commission date + N years ---';
INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name,
                                 serial_number, commission_date, warranty_years)
VALUES ('NET-T01', 'Use', N'Switch', N'Access', N'TEST-SW-01', N'SN-TEST-01', '2026-01-01', 3);

SELECT test = '2026-01-01 + 3 years = 2029-01-01',
       warranty_expiry,
       result = CASE WHEN warranty_expiry = '2029-01-01' THEN 'PASS' ELSE 'FAIL' END
FROM dbo.network_devices WHERE device_id = 'NET-T01';

PRINT '--- MAC address is optional, but validated when given ---';
BEGIN TRY
    INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name, serial_number, mac_address)
    VALUES ('NET-T02', 'Use', N'Switch', N'Access', N'TEST-SW-02', N'SN-TEST-02', N'ZZ:ZZ:ZZ:ZZ:ZZ:ZZ');
    SELECT test = 'reject malformed MAC', result = 'FAIL (it was accepted)';
END TRY
BEGIN CATCH
    SELECT test = 'reject malformed MAC', result = 'PASS';
END CATCH;

INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name, serial_number, mac_address)
VALUES ('NET-T03', 'Use', N'Switch', N'Access', N'TEST-SW-03', N'SN-TEST-03', N'00:1A:2B:3C:4D:5E');
SELECT test = 'accept a well-formed MAC', result = 'PASS';

INSERT INTO dbo.network_devices (device_id, status, category, subcategory, device_name, serial_number)
VALUES ('NET-T04', 'Use', N'Switch', N'Access', N'TEST-SW-04', N'SN-TEST-04');
SELECT test = 'accept a device with no MAC at all', result = 'PASS';

/* --- clean up --------------------------------------------------------------- */
DELETE FROM dbo.ip_allocations WHERE vlan_id_pk LIKE 'VLA-T%';
DELETE FROM dbo.network_devices WHERE device_id LIKE 'NET-T%';
DELETE FROM dbo.vlans WHERE vlan_id_pk LIKE 'VLA-T%';
GO
