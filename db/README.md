# IS-Inventory v2 — database

A rebuild of `schema.sql`, split into ordered scripts so each part can be
reviewed on its own. Targets **SQL Server 2022+**; verified end to end on
**SQL Server 2025 (RTM-CU9)**.

## Running it

Scripts are numbered and must run in order. Each one is idempotent, so
re-running the set is safe and is how you pick up a new module's permissions
after an upgrade.

```bash
sqlcmd -S <server> -U <user> -P <password> -Q "CREATE DATABASE ISInventory"

for f in db/0*.sql db/10_seed.sql; do
  sqlcmd -S <server> -U <user> -P <password> -d ISInventory -b -I -i "$f" || break
done
```

`-I` matters: the filtered indexes and persisted computed columns require
`QUOTED_IDENTIFIER ON`. Each script sets it itself, but `-I` keeps sqlcmd from
fighting them.

| File | What it creates |
|---|---|
| `01_functions.sql` | IPv4 ⇄ BIGINT, mask ⇄ prefix, subnet arithmetic, warranty expiry |
| `02_core.sql` | roles, permissions, role_permissions, app_users, user_site_scope, locations, lookups, `sp_NextId` |
| `03_assets.sql` | hardware, MA renewals, clusters, cluster_nodes, servers, server_disks, hardware_usage |
| `04_network.sql` | vlans, network_devices, **ip_allocations** |
| `05_software.sql` | software_catalogue, software_licenses, software_allocations |
| `06_access.sql` | ad_users, ad_memberships, server_permissions, audit_log |
| `07_temporal.sql` | Turns on system versioning + 3-year retention |
| `08_indexes.sql` | Every FK index and the list/dashboard covering indexes |
| `09_views.sql` | `v_asset_360`, `v_vlan_utilization`, `v_license_compliance`, `v_warranty_watch`, `v_user_permissions`, … |
| `10_seed.sql` | 75 permissions, 4 built-in roles, the first admin, location master, lookups |

## Tests

```bash
sqlcmd -S <server> -U <user> -P <password> -d ISInventory -I -i db/tests/test_network.sql
sqlcmd -S <server> -U <user> -P <password> -d ISInventory -I -i db/tests/test_rbac_views.sql
```

Every row prints `PASS` or `FAIL`; both files clean up after themselves. They
cover the parts most likely to rot quietly: subnet maths, the DHCP pool,
estate-wide IP uniqueness, role grants, site scoping, the views, system
versioning, and soft delete.

## What changed from v1, and why

**Permissions are data, not a CHECK constraint.** `app_users.role` was
`CHECK (role IN ('Admin','User','Viewer'))`, so adding a role meant an
`ALTER TABLE`, and nothing recorded what a role could do in which module. A
role, a permission and the grant between them are rows now, and
`user_site_scope` limits a user to the sites they actually cover.

**IP addresses are numbers in one registry.** They were `NVARCHAR(45)`
spread across four tables; two of the columns were unique, each only within
its own table, so one address could legitimately belong to a server and a
switch at the same time. They are BIGINT rows in `dbo.ip_allocations` with
one estate-wide `UNIQUE`, which also makes "everything in 10.10.120.0/24" a
range scan and sorts `.9` before `.10`.

**Foreign keys are foreign keys.** `servers.host_ref` packed two of them into
one string (`"CLU-001::NODE-005"`), `hardware.used_with` was a JSON array of
`"cluster:X"`, and `software_allocations` pointed at its target by *name* —
so renaming a server silently corrupted the licence count with nothing
looking broken. All three are real constrained columns now.

**Locations are consistent.** `network_devices` had a `location_id` FK while
`hardware` kept four loose strings, which made every per-site report and any
per-site permission unreliable. Both point at `dbo.locations`.

**Derived values are computed, not typed.** `warranty_expiry` is
`commission_date + warranty_years`; the DHCP pool is computed from the subnet
minus the gateway minus the static block — the same rule `app.js` applies in
the form, so the two cannot drift.

**History is the engine's job.** `record_versions` stored a full JSON
snapshot per save, only when the application remembered to write one. The
main tables are system-versioned, so a direct `UPDATE` in SSMS is captured
too:

```sql
SELECT * FROM dbo.servers FOR SYSTEM_TIME AS OF '2026-06-01' WHERE server_id = 'SRV-042';
```

**Deletes are reversible.** `recycle_bin` held a JSON blob, so restoring
re-inserted a record with its relationships gone. Rows carry
`is_deleted`/`deleted_at`/`deleted_by`, and business keys are enforced by
*filtered* unique indexes so a deleted serial number can be reused while two
live records still cannot share one.

**There are indexes.** v1 had none beyond PK and UNIQUE — foreign keys are
not indexed automatically, so every join and cascade check scanned.

## Notes

- `10_seed.sql` inserts the first admin with a real bcrypt hash (cost 12) of
  `ChangeMe$2026` and `must_change_password = 1`. That plaintext is in version
  control by definition — re-hash before any production run.
- The MAC-address format check uses `REGEXP_LIKE`, which needs SQL Server
  2025. `04_network.sql` carries the `LIKE`-pattern equivalent for 2022 in a
  comment next to it.
- `app_kv` and `record_versions` are gone. Migrating the existing
  localStorage/KV data into these tables is a separate script, not part of
  this set.
