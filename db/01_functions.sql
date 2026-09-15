/* =============================================================================
   IS-Inventory v2 — 01: Scalar helper functions
   Target: SQL Server 2022+ (tested on 2025)

   IPv4 addresses are stored as BIGINT, never as text. Text sorts wrong
   (10.10.10.9 lands after 10.10.10.10), can't answer "what lives in
   10.10.120.0/24", and can't be range-checked against a DHCP pool. A BIGINT
   fixes all three and matches the ipToInt/intToIp helpers the front-end
   already uses in app.js, so both sides agree on the representation.

   Every function here is WITH SCHEMABINDING so SQL Server treats it as
   deterministic — that is what lets 04_network.sql use them inside PERSISTED
   computed columns and CHECK constraints.
   ============================================================================= */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* --- IPv4 dotted string -> BIGINT (0 .. 4294967295). NULL if not a valid IPv4. */
CREATE OR ALTER FUNCTION dbo.fn_IpToInt (@ip NVARCHAR(45))
RETURNS BIGINT
WITH SCHEMABINDING
AS
BEGIN
    IF @ip IS NULL OR @ip NOT LIKE '%.%.%.%' OR @ip LIKE '%.%.%.%.%'
        RETURN NULL;

    DECLARE @a BIGINT = TRY_CAST(PARSENAME(@ip, 4) AS BIGINT),
            @b BIGINT = TRY_CAST(PARSENAME(@ip, 3) AS BIGINT),
            @c BIGINT = TRY_CAST(PARSENAME(@ip, 2) AS BIGINT),
            @d BIGINT = TRY_CAST(PARSENAME(@ip, 1) AS BIGINT);

    IF @a IS NULL OR @b IS NULL OR @c IS NULL OR @d IS NULL
        RETURN NULL;
    IF @a NOT BETWEEN 0 AND 255 OR @b NOT BETWEEN 0 AND 255
    OR @c NOT BETWEEN 0 AND 255 OR @d NOT BETWEEN 0 AND 255
        RETURN NULL;

    RETURN (@a * 16777216) + (@b * 65536) + (@c * 256) + @d;
END;
GO

/* --- BIGINT -> IPv4 dotted string. NULL if outside the IPv4 range. */
CREATE OR ALTER FUNCTION dbo.fn_IntToIp (@n BIGINT)
RETURNS VARCHAR(15)
WITH SCHEMABINDING
AS
BEGIN
    IF @n IS NULL OR @n < 0 OR @n > 4294967295
        RETURN NULL;

    RETURN CAST((@n / 16777216) % 256 AS VARCHAR(3)) + '.'
         + CAST((@n / 65536)    % 256 AS VARCHAR(3)) + '.'
         + CAST((@n / 256)      % 256 AS VARCHAR(3)) + '.'
         + CAST( @n             % 256 AS VARCHAR(3));
END;
GO

/* --- Dotted subnet mask -> prefix length. 255.255.255.0 -> 24.
       Rejects non-contiguous masks (255.0.255.0), which BIT_COUNT alone
       would happily accept. */
CREATE OR ALTER FUNCTION dbo.fn_MaskToPrefix (@mask NVARCHAR(45))
RETURNS TINYINT
WITH SCHEMABINDING
AS
BEGIN
    DECLARE @m BIGINT = dbo.fn_IpToInt(@mask);
    IF @m IS NULL RETURN NULL;

    DECLARE @bits INT = BIT_COUNT(@m);
    /* a valid mask is @bits ones followed by zeros — rebuild it and compare */
    IF @m <> CAST(4294967295 AS BIGINT) - (LEFT_SHIFT(CAST(1 AS BIGINT), 32 - @bits) - 1)
        RETURN NULL;

    RETURN CAST(@bits AS TINYINT);
END;
GO

/* --- Prefix length -> dotted subnet mask. 24 -> 255.255.255.0 */
CREATE OR ALTER FUNCTION dbo.fn_PrefixToMask (@prefix TINYINT)
RETURNS VARCHAR(15)
WITH SCHEMABINDING
AS
BEGIN
    IF @prefix IS NULL OR @prefix > 32 RETURN NULL;
    RETURN dbo.fn_IntToIp(CAST(4294967295 AS BIGINT) - (LEFT_SHIFT(CAST(1 AS BIGINT), 32 - @prefix) - 1));
END;
GO

/* --- Subnet arithmetic ---------------------------------------------------
   A /31 and /32 have no broadcast or gateway, so "usable" means the whole
   block there; everywhere else it excludes the network and broadcast
   addresses. These four functions are the single definition of that rule —
   04_network.sql builds the vlans computed columns from them.          */

CREATE OR ALTER FUNCTION dbo.fn_Broadcast (@network_num BIGINT, @prefix TINYINT)
RETURNS BIGINT
WITH SCHEMABINDING
AS
BEGIN
    IF @network_num IS NULL OR @prefix IS NULL OR @prefix > 32 RETURN NULL;
    RETURN @network_num + LEFT_SHIFT(CAST(1 AS BIGINT), 32 - @prefix) - 1;
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_FirstUsable (@network_num BIGINT, @prefix TINYINT)
RETURNS BIGINT
WITH SCHEMABINDING
AS
BEGIN
    IF @network_num IS NULL OR @prefix IS NULL OR @prefix > 32 RETURN NULL;
    RETURN CASE WHEN @prefix >= 31 THEN @network_num ELSE @network_num + 1 END;
END;
GO

CREATE OR ALTER FUNCTION dbo.fn_LastUsable (@network_num BIGINT, @prefix TINYINT)
RETURNS BIGINT
WITH SCHEMABINDING
AS
BEGIN
    IF @network_num IS NULL OR @prefix IS NULL OR @prefix > 32 RETURN NULL;
    DECLARE @bcast BIGINT = @network_num + LEFT_SHIFT(CAST(1 AS BIGINT), 32 - @prefix) - 1;
    RETURN CASE WHEN @prefix >= 31 THEN @bcast ELSE @bcast - 1 END;
END;
GO

/* --- Where the DHCP pool starts.

   This is the same rule wireVlanDhcpCascade() applies in app.js, moved into
   the database so the two can never disagree: begin at the first usable
   address, step past the gateway if it sits there, and step past the whole
   static block if one was reserved. Returns NULL when the subnet has no room
   left, which is what the "no room for a DHCP range" validation reports. */
CREATE OR ALTER FUNCTION dbo.fn_DhcpStart (
    @network_num      BIGINT,
    @prefix           TINYINT,
    @gateway_num      BIGINT,
    @static_start_num BIGINT,
    @static_end_num   BIGINT
)
RETURNS BIGINT
WITH SCHEMABINDING
AS
BEGIN
    IF @network_num IS NULL OR @prefix IS NULL OR @prefix > 32 RETURN NULL;

    DECLARE @start BIGINT = CASE WHEN @prefix >= 31 THEN @network_num ELSE @network_num + 1 END;
    DECLARE @bcast BIGINT = @network_num + LEFT_SHIFT(CAST(1 AS BIGINT), 32 - @prefix) - 1;
    DECLARE @last  BIGINT = CASE WHEN @prefix >= 31 THEN @bcast ELSE @bcast - 1 END;

    IF @gateway_num IS NOT NULL AND @gateway_num = @start
        SET @start = @start + 1;

    IF @static_start_num IS NOT NULL AND @static_end_num IS NOT NULL AND @static_end_num >= @start
        SET @start = @static_end_num + 1;

    RETURN CASE WHEN @start > @last THEN NULL ELSE @start END;
END;
GO

/* --- Warranty expiry = commission date + N years.
       Mirrors computeWarrantyExpiry() in app.js so the UI's preview and the
       stored value can never disagree. */
CREATE OR ALTER FUNCTION dbo.fn_WarrantyExpiry (@commission DATE, @years TINYINT)
RETURNS DATE
WITH SCHEMABINDING
AS
BEGIN
    IF @commission IS NULL OR @years IS NULL OR @years = 0 RETURN NULL;
    RETURN DATEADD(YEAR, @years, @commission);
END;
GO
