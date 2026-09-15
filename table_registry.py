"""Allowlist of flat tables the generic relational CRUD API (routers/records.py)
is allowed to touch, plus the minimal metadata it needs per table.

This is intentionally small and hand-maintained — it only ever supplies the
SQL table name, id column, and id prefix; the actual writable *columns* are
looked up live from the database (db.list_columns), never hand-copied here,
so this file can't silently drift out of sync with schema.sql.

Deliberately NOT included yet: tables with nested child data that the
front-end currently stores as JSON sub-documents (clusters.nodes ->
dbo.cluster_nodes, hardware.ma_renewal_history -> dbo.hardware_ma_renewals,
ad_users.groups -> dbo.ad_memberships) and the append-only audit tables
(audit_log, record_versions, recycle_bin). Those need their own endpoints
that understand the parent/child relationship — add them when the DB
integration work actually starts, not as a one-size-fits-all row.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class TableSpec:
    table: str          # actual dbo.<table> name in schema.sql
    id_column: str
    id_prefix: str
    hash_password: bool = False  # "password" field gets bcrypt-hashed server-side, never stored raw


TABLE_REGISTRY = {
    "hardware": TableSpec(table="hardware", id_column="hardware_id", id_prefix="HW"),
    "clusters": TableSpec(table="clusters", id_column="cluster_id", id_prefix="CLU"),
    "servers": TableSpec(table="servers", id_column="server_id", id_prefix="SRV"),
    "locations": TableSpec(table="locations", id_column="location_id", id_prefix="LOC"),
    "vlans": TableSpec(table="vlans", id_column="vlan_id_pk", id_prefix="VLA"),
    "network_devices": TableSpec(table="network_devices", id_column="device_id", id_prefix="NET"),
    "users": TableSpec(table="app_users", id_column="user_id", id_prefix="USR", hash_password=True),
    "server_permissions": TableSpec(table="server_permissions", id_column="permission_id", id_prefix="PRM"),
    "ad_users": TableSpec(table="ad_users", id_column="ad_user_id", id_prefix="AD"),
    "software_catalogue": TableSpec(table="software_catalogue", id_column="software_id", id_prefix="SWC"),
    "software_licenses": TableSpec(table="software_licenses", id_column="license_id", id_prefix="LIC"),
    "software_allocations": TableSpec(table="software_allocations", id_column="allocation_id", id_prefix="ALC"),
}
