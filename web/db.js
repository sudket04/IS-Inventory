/**
 * Data layer — Microsoft SQL Server via the pure-JavaScript `mssql` driver
 * (tedious). No ODBC install needed.
 *
 * Everything is generated from entities.js: the DDL, the CRUD, the search,
 * the filter chips and the history diff. Deletes are soft; every write lands
 * in dbo.record_history (snapshot) and dbo.audit_log (who/what/when).
 */

try { require("dotenv").config(); } catch { /* .env is optional */ }

const crypto = require("crypto");
const sql = require("mssql");
const { ENTITIES, ENTITY_LIST } = require("./entities");

const CONFIG = {
  server: process.env.MSSQL_SERVER || "localhost",
  port: parseInt(process.env.MSSQL_PORT || "1433", 10),
  database: process.env.MSSQL_DATABASE || "IS_Inventory",
  user: process.env.MSSQL_USER || undefined,
  password: process.env.MSSQL_PASSWORD || undefined,
  options: {
    encrypt: (process.env.MSSQL_ENCRYPT || "true") !== "false",
    trustServerCertificate: (process.env.MSSQL_TRUST_CERT || "true") !== "false",
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  requestTimeout: 30000,
};
if (process.env.MSSQL_TRUSTED === "1") {
  CONFIG.authentication = { type: "ntlm", options: {
    domain: process.env.MSSQL_DOMAIN || "",
    userName: process.env.MSSQL_USER || "",
    password: process.env.MSSQL_PASSWORD || "",
  } };
  delete CONFIG.user;
  delete CONFIG.password;
}

let poolPromise = null;
function pool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(CONFIG).connect().catch(err => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/** query('SELECT ... WHERE x = @p0', [value]) -> rows */
async function query(text, params = []) {
  const p = await pool();
  const req = p.request();
  params.forEach((v, i) => req.input("p" + i, v === undefined ? null : v));
  const res = await req.query(text);
  return res.recordset || [];
}

async function execute(text, params = []) {
  const p = await pool();
  const req = p.request();
  params.forEach((v, i) => req.input("p" + i, v === undefined ? null : v));
  const res = await req.query(text);
  return res.rowsAffected[0] || 0;
}

async function scalar(text, params = []) {
  const rows = await query(text, params);
  if (!rows.length) return null;
  return Object.values(rows[0])[0];
}

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const today = () => new Date().toISOString().slice(0, 10);

/** Joins several picked values into one f_<col> query value (Excel-style
 * column filter -- a column can match any of several checked values). Uses
 * the ASCII unit separator so it never collides with real field data. */
const FILTER_SEP = String.fromCharCode(31);

// --------------------------------------------------------------------------
// Schema
// --------------------------------------------------------------------------
const SYSTEM_TABLES = [
  `IF OBJECT_ID(N'dbo.users', N'U') IS NULL
   CREATE TABLE dbo.users (
     user_id NVARCHAR(32) NOT NULL PRIMARY KEY,
     username NVARCHAR(64) NOT NULL,
     display_name NVARCHAR(120) NOT NULL DEFAULT '',
     email NVARCHAR(160) NOT NULL DEFAULT '',
     role NVARCHAR(16) NOT NULL CHECK (role IN ('admin','viewer')),
     status NVARCHAR(16) NOT NULL DEFAULT 'Active',
     password_hash NVARCHAR(256) NOT NULL,
     password_salt NVARCHAR(64) NOT NULL,
     last_login DATETIME2 NULL,
     is_deleted BIT NOT NULL DEFAULT 0,
     created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
     created_by NVARCHAR(64) NOT NULL DEFAULT 'system',
     updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
     updated_by NVARCHAR(64) NOT NULL DEFAULT 'system'
   );`,
  `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_users_username')
   CREATE UNIQUE INDEX UX_users_username ON dbo.users (username);`,
  `IF OBJECT_ID(N'dbo.record_history', N'U') IS NULL
   CREATE TABLE dbo.record_history (
     history_id BIGINT IDENTITY(1,1) PRIMARY KEY,
     entity NVARCHAR(64) NOT NULL, record_id NVARCHAR(32) NOT NULL,
     version_no INT NOT NULL, action NVARCHAR(16) NOT NULL,
     changed_at DATETIME2 NOT NULL, changed_by NVARCHAR(64) NOT NULL,
     changed_keys NVARCHAR(MAX) NOT NULL, snapshot NVARCHAR(MAX) NOT NULL
   );`,
  `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_hist_lookup')
   CREATE INDEX IX_hist_lookup ON dbo.record_history (entity, record_id, version_no DESC);`,
  `IF OBJECT_ID(N'dbo.audit_log', N'U') IS NULL
   CREATE TABLE dbo.audit_log (
     audit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
     ts DATETIME2 NOT NULL, username NVARCHAR(64) NOT NULL,
     role NVARCHAR(16) NOT NULL, action NVARCHAR(32) NOT NULL,
     entity NVARCHAR(64) NOT NULL DEFAULT '',
     record_id NVARCHAR(32) NOT NULL DEFAULT '',
     summary NVARCHAR(400) NOT NULL DEFAULT '',
     ip NVARCHAR(64) NOT NULL DEFAULT ''
   );`,
  `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_audit_ts')
   CREATE INDEX IX_audit_ts ON dbo.audit_log (ts DESC);`,
  `IF OBJECT_ID(N'dbo.settings', N'U') IS NULL
   CREATE TABLE dbo.settings ([key] NVARCHAR(64) PRIMARY KEY, [value] NVARCHAR(MAX) NOT NULL);`,
];

function entityDdl(ent) {
  const cols = [`${ent.idField} NVARCHAR(32) NOT NULL PRIMARY KEY`];
  for (const f of ent.fields) cols.push(`[${f.name}] ${f.sqlType} NULL`);
  cols.push(
    "is_deleted BIT NOT NULL DEFAULT 0",
    "deleted_at DATETIME2 NULL",
    "created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()",
    "created_by NVARCHAR(64) NOT NULL DEFAULT 'system'",
    "updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()",
    "updated_by NVARCHAR(64) NOT NULL DEFAULT 'system'",
  );
  return `IF OBJECT_ID(N'${ent.table}', N'U') IS NULL\nCREATE TABLE ${ent.table} (\n  ${cols.join(",\n  ")}\n);`;
}

/** Adds columns that entities.js grew since the table was created. */
async function addMissingColumns(ent) {
  const bare = ent.table.replace("dbo.", "");
  const have = new Set((await query(
    "SELECT name FROM sys.columns WHERE object_id = OBJECT_ID(@p0)", [ent.table]
  )).map(r => r.name.toLowerCase()));
  for (const f of ent.fields) {
    if (!have.has(f.name.toLowerCase())) {
      await execute(`ALTER TABLE ${ent.table} ADD [${f.name}] ${f.sqlType} NULL`);
      console.log(`[init] ${bare}: added column ${f.name}`);
    }
  }
}

async function initDb() {
  for (const stmt of SYSTEM_TABLES) await execute(stmt);
  for (const ent of ENTITY_LIST) {
    await execute(entityDdl(ent));
    await addMissingColumns(ent);
  }
  const n = await scalar("SELECT COUNT(*) FROM dbo.users WHERE is_deleted = 0");
  if (!n) {
    const { salt, hash } = hashPassword("admin123");
    await execute(
      "INSERT INTO dbo.users (user_id, username, display_name, role, status," +
      " password_hash, password_salt, created_at, updated_at)" +
      " VALUES (@p0,@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8)",
      ["USR-001", "admin", "Administrator", "admin", "Active", hash, salt, now(), now()]);
    console.log("[init] default admin created -> admin / admin123 (change it in Users)");
  }
  console.log(`[init] schema ready — ${ENTITY_LIST.length} entity tables + 4 system tables`);
}

// --------------------------------------------------------------------------
// Passwords & sessions
// --------------------------------------------------------------------------
function hashPassword(plain, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(plain, salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPassword(plain, salt, expected) {
  const { hash } = hashPassword(plain, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
}

const findUser = (username) => query(
  "SELECT * FROM dbo.users WHERE username = @p0 AND is_deleted = 0", [username]
).then(r => r[0] || null);

async function nextUserId() {
  const last = await scalar("SELECT MAX(user_id) FROM dbo.users");
  const n = last ? parseInt(String(last).split("-")[1], 10) + 1 : 1;
  return "USR-" + String(n).padStart(3, "0");
}

// --------------------------------------------------------------------------
// Ids, audit, history
// --------------------------------------------------------------------------
async function nextId(ent) {
  const last = await scalar(
    `SELECT MAX(${ent.idField}) FROM ${ent.table} WHERE ${ent.idField} LIKE @p0`,
    [ent.idPrefix + "-%"]);
  const n = last ? parseInt(String(last).split("-")[1], 10) + 1 : 1;
  return `${ent.idPrefix}-${String(n).padStart(ent.idWidth, "0")}`;
}

async function audit(actor, action, entity = "", recordId = "", summary = "", ip = "") {
  await execute(
    "INSERT INTO dbo.audit_log (ts, username, role, action, entity, record_id, summary, ip)" +
    " VALUES (@p0,@p1,@p2,@p3,@p4,@p5,@p6,@p7)",
    [now(), actor?.username || "anonymous", actor?.role || "-", action,
     entity, recordId, String(summary).slice(0, 400), ip]);
}

const IGNORED_DIFF = new Set(["created_at", "created_by", "updated_at", "updated_by",
                              "password_hash", "password_salt", "password"]);

function diffKeys(before, after) {
  const keys = [];
  for (const k of Object.keys(after || {})) {
    if (IGNORED_DIFF.has(k)) continue;
    const a = before ? before[k] : null;
    if (String(a ?? "") !== String(after[k] ?? "")) keys.push(k);
  }
  return keys;
}

async function writeHistory(ent, recordId, action, actor, snapshot, keys) {
  const v = (await scalar(
    "SELECT MAX(version_no) FROM dbo.record_history WHERE entity = @p0 AND record_id = @p1",
    [ent.key, recordId])) || 0;
  await execute(
    "INSERT INTO dbo.record_history (entity, record_id, version_no, action," +
    " changed_at, changed_by, changed_keys, snapshot) VALUES (@p0,@p1,@p2,@p3,@p4,@p5,@p6,@p7)",
    [ent.key, recordId, v + 1, action, now(), actor?.username || "system",
     JSON.stringify(keys), JSON.stringify(snapshot, dateSafe)]);
}

const dateSafe = (k, v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

// --------------------------------------------------------------------------
// CRUD
// --------------------------------------------------------------------------
function coerce(field, raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (field.type === "int") { const n = parseInt(raw, 10); return isNaN(n) ? null : n; }
  if (field.type === "money") { const n = parseFloat(raw); return isNaN(n) ? null : n; }
  if (field.type === "bool") return raw === true || raw === "1" || raw === "on" ? 1 : 0;
  if (field.type === "date") return String(raw).slice(0, 10);
  return String(raw);
}

/** Rejects blanks in required fields and duplicates in unique ones. */
async function validate(ent, data, id = null) {
  const errors = {};
  const disc = ent.discriminator ? data[ent.discriminator] : null;
  for (const f of ent.fields) {
    if (f.onlyFor && f.onlyFor !== disc) continue;
    const v = data[f.name];
    if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
      errors[f.name] = `${f.label} is required`;
      continue;
    }
    if (f.unique && v) {
      const clash = await scalar(
        `SELECT TOP 1 ${ent.idField} FROM ${ent.table}` +
        ` WHERE [${f.name}] = @p0 AND is_deleted = 0` +
        (id ? ` AND ${ent.idField} <> @p1` : ""),
        id ? [v, id] : [v]);
      if (clash) errors[f.name] = `${f.label} “${v}” is already used by ${clash}`;
    }
    if (f.type === "ip" && v && !/^(\d{1,3}\.){3}\d{1,3}$/.test(String(v).trim()))
      errors[f.name] = `${f.label} must look like 10.10.20.1`;
    if (f.type === "mac" && v &&
        !/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(String(v).trim()))
      errors[f.name] = `${f.label} must look like aa:bb:cc:dd:ee:01`;
  }
  return errors;
}

async function getRecord(ent, id, includeDeleted = false) {
  const rows = await query(
    `SELECT * FROM ${ent.table} WHERE ${ent.idField} = @p0` +
    (includeDeleted ? "" : " AND is_deleted = 0"), [id]);
  return rows[0] || null;
}

async function insertRecord(ent, data, actor) {
  const id = await nextId(ent);
  const cols = [ent.idField], vals = [id];
  for (const f of ent.fields) {
    cols.push(`[${f.name}]`);
    vals.push(coerce(f, data[f.name]));
  }
  cols.push("created_at", "created_by", "updated_at", "updated_by");
  vals.push(now(), actor?.username || "system", now(), actor?.username || "system");
  const holes = vals.map((_, i) => "@p" + i).join(",");
  await execute(`INSERT INTO ${ent.table} (${cols.join(",")}) VALUES (${holes})`, vals);
  const row = await getRecord(ent, id);
  await writeHistory(ent, id, "create", actor, row, Object.keys(data));
  await audit(actor, "create", ent.key, id, `${ent.label} created`);
  return id;
}

async function updateRecord(ent, id, data, actor) {
  const before = await getRecord(ent, id);
  if (!before) return null;
  const sets = [], vals = [];
  for (const f of ent.fields) {
    if (!(f.name in data)) continue;
    sets.push(`[${f.name}] = @p${vals.length}`);
    vals.push(coerce(f, data[f.name]));
  }
  sets.push(`updated_at = @p${vals.length}`); vals.push(now());
  sets.push(`updated_by = @p${vals.length}`); vals.push(actor?.username || "system");
  vals.push(id);
  await execute(
    `UPDATE ${ent.table} SET ${sets.join(", ")} WHERE ${ent.idField} = @p${vals.length - 1}`,
    vals);
  const after = await getRecord(ent, id);
  const keys = diffKeys(before, after);
  if (keys.length) {
    await writeHistory(ent, id, "update", actor, after, keys);
    await audit(actor, "update", ent.key, id, `changed ${keys.join(", ")}`);
  }
  return keys;
}

async function softDelete(ent, id, actor) {
  const row = await getRecord(ent, id);
  if (!row) return false;
  await execute(
    `UPDATE ${ent.table} SET is_deleted = 1, deleted_at = @p0, updated_at = @p0,` +
    ` updated_by = @p1 WHERE ${ent.idField} = @p2`,
    [now(), actor?.username || "system", id]);
  await writeHistory(ent, id, "delete", actor, row, ["is_deleted"]);
  await audit(actor, "delete", ent.key, id, `${ent.label} moved to recycle bin`);
  return true;
}

async function restore(ent, id, actor) {
  await execute(
    `UPDATE ${ent.table} SET is_deleted = 0, deleted_at = NULL, updated_at = @p0,` +
    ` updated_by = @p1 WHERE ${ent.idField} = @p2`,
    [now(), actor?.username || "system", id]);
  const row = await getRecord(ent, id);
  await writeHistory(ent, id, "restore", actor, row, ["is_deleted"]);
  await audit(actor, "restore", ent.key, id, `${ent.label} restored`);
  return true;
}

// --------------------------------------------------------------------------
// Lists — search, chips, per-column filters, sorting, paging
// --------------------------------------------------------------------------
async function listRecords(ent, opts = {}) {
  const { q = "", chip = "all", page = 1, perPage = 25, sort = "", dir = "asc",
          filters = {}, parentId = null } = opts;
  const where = ["is_deleted = 0"], params = [];
  const hole = () => "@p" + params.length;

  if (parentId && ent.parentKey) {
    where.push(`[${ent.parentKey}] = ${hole()}`);
    params.push(parentId);
  }
  if (q && ent.search.length) {
    const ors = ent.search.map(c => {
      const h = hole(); params.push("%" + q + "%");
      return `[${c}] LIKE ${h}`;
    });
    where.push("(" + ors.join(" OR ") + ")");
  }
  const chipDef = (ent.chips || []).find(c => c.key === chip);
  if (chipDef && chipDef.where) {
    let frag = chipDef.where;
    chipDef.params.forEach(v => {
      frag = frag.replace(/@p\d+/, hole());
      params.push(v);
    });
    where.push("(" + frag + ")");
  }
  for (const [col, val] of Object.entries(filters)) {
    if (!val) continue;
    const field = ent.fields.find(f => f.name === col);
    const target = field ? col : (ent.columns.find(c => c.name === col)?.filterOn || col);
    if (!ent.fields.some(f => f.name === target)) continue;
    const picked = String(val).split(FILTER_SEP).filter(v => v !== "");
    if (!picked.length) continue;
    if (picked.length === 1) {
      where.push(`[${target}] = ${hole()}`);
      params.push(picked[0]);
    } else {
      const holes = picked.map(v => { const h = hole(); params.push(v); return h; });
      where.push(`[${target}] IN (${holes.join(",")})`);
    }
  }
  const clause = "WHERE " + where.join(" AND ");
  const total = await scalar(`SELECT COUNT(*) FROM ${ent.table} ${clause}`, params);

  const sortable = new Set([ent.idField, ...ent.fields.map(f => f.name),
                            "created_at", "updated_at"]);
  const orderCol = sortable.has(sort) ? sort : ent.idField;
  const orderDir = dir === "desc" ? "DESC" : "ASC";
  const offset = (Math.max(1, page) - 1) * perPage;
  const rows = await query(
    `SELECT * FROM ${ent.table} ${clause} ORDER BY [${orderCol}] ${orderDir}` +
    ` OFFSET ${offset} ROWS FETCH NEXT ${perPage} ROWS ONLY`, params);

  const counts = {};
  for (const c of ent.chips || []) {
    if (!c.counts || !c.where) continue;
    let frag = c.where; const cp = [];
    c.params.forEach(v => { frag = frag.replace(/@p\d+/, "@p" + cp.length); cp.push(v); });
    counts[c.key] = await scalar(
      `SELECT COUNT(*) FROM ${ent.table} WHERE is_deleted = 0 AND (${frag})`, cp);
  }
  return { rows, total, counts, page, perPage };
}

/** Distinct values + row counts for a column, for the Excel-style
 * checkbox filter dropdown on that column's header. */
async function distinctValues(ent, column) {
  const field = ent.fields.find(f => f.name === column);
  const target = field ? column : (ent.columns.find(c => c.name === column)?.filterOn);
  if (!target || !ent.fields.some(f => f.name === target)) return [];
  const rows = await query(
    `SELECT [${target}] AS v, COUNT(*) AS n FROM ${ent.table}` +
    ` WHERE is_deleted = 0 AND [${target}] IS NOT NULL AND [${target}] <> ''` +
    ` GROUP BY [${target}] ORDER BY [${target}]`);
  return rows.map(r => ({
    value: r.v instanceof Date ? r.v.toISOString().slice(0, 10) : r.v,
    count: r.n,
  }));
}

/** Options for a ref field: [{id, label}]. `whereEq` is a plain equality
 * filter ({column: value}) — column names are checked against the entity's
 * own fields first, so this never takes raw SQL from the caller. */
async function refOptions(entKey, whereEq = {}) {
  const ent = ENTITIES[entKey];
  if (!ent) return [];
  const allowedCols = new Set(ent.fields.map(f => f.name));
  const where = ["is_deleted = 0"], params = [];
  for (const [col, val] of Object.entries(whereEq)) {
    if (!allowedCols.has(col) || val === undefined || val === null || val === "") continue;
    where.push(`[${col}] = @p${params.length}`);
    params.push(val);
  }
  const rows = await query(
    `SELECT * FROM ${ent.table} WHERE ${where.join(" AND ")} ORDER BY ${ent.idField}`, params);
  if (entKey === "locations") {
    // path-walking needs every ancestor, not just the (possibly filtered) rows
    const all = params.length
      ? await query("SELECT * FROM dbo.locations WHERE is_deleted = 0") : rows;
    const byId = Object.fromEntries(all.map(r => [r.location_id, r]));
    const path = (r) => {
      const out = []; let cur = r, guard = 0;
      while (cur && guard++ < 8) { out.unshift(cur.name); cur = byId[cur.parent_id]; }
      return out.join(" › ");
    };
    return rows.map(r => ({ id: r.location_id, label: path(r), level: r.level }));
  }
  return rows.map(r => ({ id: r[ent.idField], label: refLabel(ent, r) }));
}

function refLabel(ent, row) {
  if (!row) return "";
  const t = ent.titleField && row[ent.titleField];
  return t || row[ent.idField];
}

/** Fills the computed columns the list view shows. */
async function decorate(ent, rows) {
  if (!rows.length) return rows;
  const need = new Set(ent.columns.map(c => c.name));
  const locs = need.has("location_id") || need.has("path") || need.has("occupancy")
    ? await refOptions("locations") : [];
  const locMap = Object.fromEntries(locs.map(l => [l.id, l.label]));

  if (ent.key === "hardware") {
    rows.forEach(r => {
      r.identity = r.asset_type === "Storage"
        ? `${r.storage_name || ""}${r.model ? " · " + r.model : ""}`
        : `${r.manufacturer || ""} ${r.model || ""}`.trim();
      r.location_label = locMap[r.location_id] || "";
      r.u_label = r.u_start ? `U${r.u_start}${r.u_height > 1 ? "–" + (r.u_start + r.u_height - 1) : ""}` : "";
    });
  }
  if (ent.key === "network_devices") {
    rows.forEach(r => {
      r.location_label = locMap[r.location_id] || "";
      r.u_label = r.u_start ? `U${r.u_start}` : "";
    });
  }
  if (ent.key === "locations") {
    const all = await query("SELECT * FROM dbo.locations WHERE is_deleted = 0");
    const byId = Object.fromEntries(all.map(r => [r.location_id, r]));
    const counts = await query(
      "SELECT location_id, COUNT(*) AS n FROM dbo.hardware WHERE is_deleted = 0" +
      " AND location_id IS NOT NULL GROUP BY location_id");
    const netCounts = await query(
      "SELECT location_id, COUNT(*) AS n FROM dbo.network_devices WHERE is_deleted = 0" +
      " AND location_id IS NOT NULL GROUP BY location_id");
    const used = {};
    [...counts, ...netCounts].forEach(c => {
      used[c.location_id] = (used[c.location_id] || 0) + c.n;
    });
    rows.forEach(r => {
      const parts = []; let cur = r, guard = 0;
      while (cur && guard++ < 8) { parts.unshift(cur.name); cur = byId[cur.parent_id]; }
      r.path = parts.join(" › ");
      r.occupancy = r.level === "Area"
        ? `${used[r.location_id] || 0} device(s)${r.rack_units ? " / " + r.rack_units + "U" : ""}`
        : "—";
    });
  }
  if (ent.key === "clusters") {
    const counts = await query(
      "SELECT cluster_id, COUNT(*) AS n FROM dbo.cluster_nodes WHERE is_deleted = 0" +
      " GROUP BY cluster_id");
    const map = Object.fromEntries(counts.map(c => [c.cluster_id, c.n]));
    rows.forEach(r => { r.node_count = map[r.cluster_id] || 0; });
  }
  if (ent.key === "cluster_nodes") {
    const hw = await query("SELECT hardware_id, serial_number, model FROM dbo.hardware");
    const map = Object.fromEntries(hw.map(h => [h.hardware_id,
      `${h.serial_number}${h.model ? " · " + h.model : ""}`]));
    rows.forEach(r => { r.hardware_label = map[r.hardware_id] || r.hardware_id || ""; });
  }
  if (ent.key === "servers") {
    const nodes = await query("SELECT node_id, host_name, cluster_id FROM dbo.cluster_nodes");
    const clusters = await query("SELECT cluster_id, cluster_name FROM dbo.clusters");
    const hw = await query("SELECT hardware_id, serial_number FROM dbo.hardware");
    const cn = Object.fromEntries(clusters.map(c => [c.cluster_id, c.cluster_name]));
    const nn = Object.fromEntries(nodes.map(n => [n.node_id,
      `${n.host_name} · ${cn[n.cluster_id] || ""}`]));
    const hh = Object.fromEntries(hw.map(h => [h.hardware_id, h.serial_number]));
    rows.forEach(r => {
      r.context = r.hosting_type === "Virtual"
        ? (nn[r.node_id] || "—") : (hh[r.hardware_id] || "—");
    });
  }
  if (ent.key === "vlans") {
    rows.forEach(r => { r.subnet = `${r.network_address || ""} / ${r.subnet_mask || ""}`; });
  }
  if (ent.key === "software") {
    const counts = await query(
      "SELECT software_id, COUNT(*) AS n FROM dbo.licenses WHERE is_deleted = 0" +
      " GROUP BY software_id");
    const map = Object.fromEntries(counts.map(c => [c.software_id, c.n]));
    rows.forEach(r => { r.license_count = map[r.software_id] || 0; });
  }
  if (ent.key === "licenses") {
    const sw = await query("SELECT software_id, software_name, publisher FROM dbo.software");
    const map = Object.fromEntries(sw.map(s => [s.software_id,
      `${s.software_name}${s.publisher ? " · " + s.publisher : ""}`]));
    rows.forEach(r => {
      r.software_label = map[r.software_id] || r.software_id || "";
      r.available = (r.license_quantity || 0) - (r.used_quantity || 0);
    });
  }
  if (ent.key === "ad_users") {
    const counts = await query(
      "SELECT user_logon, COUNT(*) AS n FROM dbo.ad_memberships WHERE is_deleted = 0" +
      " GROUP BY user_logon");
    const map = Object.fromEntries(counts.map(c => [c.user_logon, c.n]));
    rows.forEach(r => { r.group_count = map[r.user_logon] || 0; });
  }
  if (ent.key === "server_permissions") {
    const srv = await query("SELECT server_id, system_name FROM dbo.servers");
    const map = Object.fromEntries(srv.map(s => [s.server_id, s.system_name]));
    rows.forEach(r => { r.server_label = map[r.server_id] || r.server_id || ""; });
  }
  return rows;
}

// --------------------------------------------------------------------------
// Dashboard, governance
// --------------------------------------------------------------------------
async function dashboard() {
  const out = { warranty: [], counts: {}, missing: [], licenses: {}, recent: [] };
  for (const key of ["hardware", "network_devices"]) {
    const ent = ENTITIES[key];
    out.counts[key] = await scalar(
      `SELECT COUNT(*) FROM ${ent.table} WHERE is_deleted = 0`);
    out.warranty.push({
      key, label: ent.plural,
      expired: await scalar(`SELECT COUNT(*) FROM ${ent.table} WHERE is_deleted = 0` +
        " AND warranty_expiry IS NOT NULL AND warranty_expiry < CAST(GETDATE() AS date)"),
      soon: await scalar(`SELECT COUNT(*) FROM ${ent.table} WHERE is_deleted = 0` +
        " AND warranty_expiry >= CAST(GETDATE() AS date)" +
        " AND warranty_expiry <= DATEADD(day, 90, CAST(GETDATE() AS date))"),
      missing: await scalar(`SELECT COUNT(*) FROM ${ent.table} WHERE is_deleted = 0` +
        " AND (fixed_asset IS NULL OR fixed_asset = '' OR warranty_expiry IS NULL)"),
      value: await scalar(`SELECT ISNULL(SUM(purchase_price), 0) FROM ${ent.table}` +
        " WHERE is_deleted = 0"),
    });
  }
  for (const key of ["servers", "clusters", "vlans", "software", "licenses",
                     "ad_users", "server_permissions"]) {
    out.counts[key] = await scalar(
      `SELECT COUNT(*) FROM ${ENTITIES[key].table} WHERE is_deleted = 0`);
  }
  out.licenses = {
    expiring: await scalar("SELECT COUNT(*) FROM dbo.licenses WHERE is_deleted = 0" +
      " AND expiry_date >= CAST(GETDATE() AS date)" +
      " AND expiry_date <= DATEADD(day, 90, CAST(GETDATE() AS date))"),
    expired: await scalar("SELECT COUNT(*) FROM dbo.licenses WHERE is_deleted = 0" +
      " AND expiry_date IS NOT NULL AND expiry_date < CAST(GETDATE() AS date)"),
    overused: await scalar("SELECT COUNT(*) FROM dbo.licenses WHERE is_deleted = 0" +
      " AND ISNULL(used_quantity,0) > ISNULL(license_quantity,0)"),
    spend: await scalar("SELECT ISNULL(SUM(cost),0) FROM dbo.licenses WHERE is_deleted = 0"),
  };
  out.soonest = await query(
    "SELECT TOP 8 hardware_id AS id, serial_number AS name, model AS detail," +
    " warranty_expiry AS expiry, 'hardware' AS entity FROM dbo.hardware" +
    " WHERE is_deleted = 0 AND warranty_expiry IS NOT NULL" +
    " UNION ALL SELECT TOP 8 device_id, device_name, model, warranty_expiry," +
    " 'network_devices' FROM dbo.network_devices" +
    " WHERE is_deleted = 0 AND warranty_expiry IS NOT NULL" +
    " ORDER BY expiry ASC");
  out.recent = await auditTrail(8);
  return out;
}

const auditTrail = (limit = 20, entity = null) => query(
  `SELECT TOP ${parseInt(limit, 10)} * FROM dbo.audit_log` +
  (entity ? " WHERE entity = @p0" : "") + " ORDER BY ts DESC",
  entity ? [entity] : []);

const historyFor = (entityKey, recordId) => query(
  "SELECT * FROM dbo.record_history WHERE entity = @p0 AND record_id = @p1" +
  " ORDER BY version_no DESC", [entityKey, recordId]);

async function changeHistory(entityKey = "", limit = 100) {
  return query(
    `SELECT TOP ${parseInt(limit, 10)} * FROM dbo.record_history` +
    (entityKey ? " WHERE entity = @p0" : "") + " ORDER BY changed_at DESC",
    entityKey ? [entityKey] : []);
}

async function recycleBin() {
  const out = [];
  for (const ent of ENTITY_LIST) {
    const rows = await query(
      `SELECT TOP 50 * FROM ${ent.table} WHERE is_deleted = 1 ORDER BY deleted_at DESC`);
    rows.forEach(r => out.push({
      entity: ent.key, entityLabel: ent.label, id: r[ent.idField],
      title: refLabel(ent, r), deleted_at: r.deleted_at, deleted_by: r.updated_by,
    }));
  }
  return out.sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at)));
}

async function warrantyRegister() {
  const rows = [];
  for (const key of ["hardware", "network_devices"]) {
    const ent = ENTITIES[key];
    const r = await query(
      `SELECT * FROM ${ent.table} WHERE is_deleted = 0 ORDER BY warranty_expiry ASC`);
    r.forEach(x => rows.push({
      entity: key, id: x[ent.idField], name: refLabel(ent, x),
      model: x.model, fixed_asset: x.fixed_asset, price: x.purchase_price,
      warranty_expiry: x.warranty_expiry, eol_date: x.eol_date, status: x.status,
    }));
  }
  return rows;
}

// --------------------------------------------------------------------------
// Permission control
// --------------------------------------------------------------------------
const fileServers = () => query(
  "SELECT * FROM dbo.servers WHERE is_deleted = 0 AND server_role = 'File Server'" +
  " ORDER BY system_name");

async function permissionFolders() {
  return query(
    "SELECT p.*, s.system_name AS server_name FROM dbo.server_permissions p" +
    " LEFT JOIN dbo.servers s ON s.server_id = p.server_id" +
    " WHERE p.is_deleted = 0 ORDER BY p.folder_name");
}

async function permissionSummary() {
  const folders = await permissionFolders();
  const groups = new Set((await query(
    "SELECT DISTINCT group_name FROM dbo.ad_memberships WHERE is_deleted = 0"
  )).map(r => r.group_name));
  const referenced = new Set();
  folders.forEach(f => {
    if (f.rw_group) referenced.add(f.rw_group);
    if (f.ro_group) referenced.add(f.ro_group);
  });
  return {
    users: await scalar("SELECT COUNT(*) FROM dbo.ad_users WHERE is_deleted = 0"),
    disabled: await scalar(
      "SELECT COUNT(*) FROM dbo.ad_users WHERE is_deleted = 0 AND status = 'Disabled'"),
    memberships: await scalar(
      "SELECT COUNT(*) FROM dbo.ad_memberships WHERE is_deleted = 0"),
    ad_groups: groups.size,
    no_group: await scalar(
      "SELECT COUNT(*) FROM dbo.ad_users u WHERE u.is_deleted = 0 AND NOT EXISTS" +
      " (SELECT 1 FROM dbo.ad_memberships m WHERE m.user_logon = u.user_logon)"),
    folders: folders.length,
    file_servers: (await fileServers()).length,
    folders_no_group: folders.filter(f => !f.rw_group && !f.ro_group).length,
    orphan_groups: [...referenced].filter(g => !groups.has(g)).sort(),
  };
}

async function accessByUser(logon) {
  const user = (await query(
    "SELECT * FROM dbo.ad_users WHERE is_deleted = 0 AND user_logon = @p0", [logon]))[0];
  const groups = (await query(
    "SELECT group_name FROM dbo.ad_memberships WHERE is_deleted = 0 AND user_logon = @p0" +
    " ORDER BY group_name", [logon])).map(r => r.group_name);
  const gs = new Set(groups);
  const folders = (await permissionFolders()).flatMap(f => {
    if (f.rw_group && gs.has(f.rw_group))
      return [{ ...f, access: "Read/Write", via: f.rw_group }];
    if (f.ro_group && gs.has(f.ro_group))
      return [{ ...f, access: "Read only", via: f.ro_group }];
    return [];
  });
  return { logon, user: user || null, groups, folders };
}

async function accessByFolder(q) {
  const all = await permissionFolders();
  const needle = q.toLowerCase();
  const hits = all.filter(f =>
    (f.folder_name || "").toLowerCase().includes(needle) ||
    (f.folder_path || "").toLowerCase().includes(needle));
  const members = await query(
    "SELECT m.group_name, m.user_logon, u.display_name, u.department, u.status" +
    " FROM dbo.ad_memberships m LEFT JOIN dbo.ad_users u ON u.user_logon = m.user_logon" +
    " WHERE m.is_deleted = 0");
  const byGroup = {};
  members.forEach(m => (byGroup[m.group_name] ||= []).push(m));
  const folders = hits.map(f => {
    const people = [];
    (byGroup[f.rw_group] || []).forEach(m => people.push({
      logon: m.user_logon, display_name: m.display_name || m.user_logon,
      department: m.department, status: m.status || "Enabled",
      access: "Read/Write", via: f.rw_group,
    }));
    (byGroup[f.ro_group] || []).forEach(m => {
      if (people.some(p => p.logon === m.user_logon)) return;
      people.push({
        logon: m.user_logon, display_name: m.display_name || m.user_logon,
        department: m.department, status: m.status || "Enabled",
        access: "Read only", via: f.ro_group,
      });
    });
    people.sort((a, b) => a.display_name.localeCompare(b.display_name));
    return { ...f, people };
  });
  return { query: q, folders };
}

async function permissionDashboard() {
  const folders = await permissionFolders();
  const byDept = {}, byServer = {};
  folders.forEach(f => {
    const d = (f.department || "").trim() || "— unassigned —";
    const b = (byDept[d] ||= { department: d, folders: 0, quota: 0, no_group: 0 });
    b.folders++; b.quota += f.quota_gb || 0;
    if (!f.rw_group && !f.ro_group) b.no_group++;
    const s = f.server_name || "—";
    byServer[s] = (byServer[s] || 0) + 1;
  });
  return {
    summary: await permissionSummary(),
    departments: Object.values(byDept)
      .sort((a, b) => b.folders - a.folders || a.department.localeCompare(b.department))
      .slice(0, 8),
    topServers: Object.entries(byServer)
      .map(([server_name, n]) => ({ server_name, folders: n }))
      .sort((a, b) => b.folders - a.folders).slice(0, 6),
    recent: [...await auditTrail(6, "ad_users"), ...await auditTrail(6, "server_permissions")]
      .sort((a, b) => String(b.ts).localeCompare(String(a.ts))).slice(0, 6),
  };
}

module.exports = {
  sql, pool, query, execute, scalar, now, today, FILTER_SEP,
  initDb, entityDdl, SYSTEM_TABLES,
  hashPassword, verifyPassword, findUser, nextUserId,
  nextId, audit, auditTrail, writeHistory, historyFor, changeHistory,
  getRecord, insertRecord, updateRecord, softDelete, restore, validate, coerce,
  listRecords, distinctValues, refOptions, refLabel, decorate,
  dashboard, recycleBin, warrantyRegister,
  fileServers, permissionFolders, permissionSummary, permissionDashboard,
  accessByUser, accessByFolder,
};
