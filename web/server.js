/**
 * HTTP layer — Express serves the static HTML/CSS/JS front end and a JSON API.
 *
 * Routes for the 12 entities are generated from entities.js, so a new entity
 * gets its list, detail, form and CSV export with no code here.
 *
 * Roles: admin writes, viewer reads. Every write route goes through
 * adminOnly(), which 403s and records a `denied` line in the audit log.
 */

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");

const db = require("./db");
const {
  ENTITIES, ENTITY_LIST, NAV, LOOKUPS, WARRANTY_ENTITIES,
  AD_IMPORT_MAP, PERM_IMPORT_MAP,
} = require("./entities");

const app = express();
const upload = multer({ storage: multer.memoryStorage(),
                        limits: { fileSize: 12 * 1024 * 1024 } });

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------------------------------------------
// Sessions — signed cookie, kept in memory
// --------------------------------------------------------------------------
const SESSIONS = new Map();
const SESSION_HOURS = 12;

function newSession(user) {
  const token = crypto.randomBytes(24).toString("hex");
  SESSIONS.set(token, {
    user: { user_id: user.user_id, username: user.username, role: user.role,
            display_name: user.display_name || user.username },
    expires: Date.now() + SESSION_HOURS * 3600 * 1000,
  });
  return token;
}

app.use((req, res, next) => {
  const s = SESSIONS.get(req.cookies.sid);
  if (s && s.expires > Date.now()) req.user = s.user;
  else if (s) SESSIONS.delete(req.cookies.sid);
  next();
});

const ip = (req) => (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
  .toString().split(",")[0].trim();

function loginRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not signed in" });
  next();
}

async function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not signed in" });
  if (req.user.role !== "admin") {
    await db.audit(req.user, "denied", "", "", `${req.method} ${req.path}`, ip(req));
    return res.status(403).json({ error: "อ่านได้อย่างเดียว — ต้องเป็น admin จึงจะแก้ไขได้" });
  }
  next();
}

const wrap = (fn) => (req, res) => fn(req, res).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message || "server error" });
});

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------
app.post("/api/login", wrap(async (req, res) => {
  const { username = "", password = "" } = req.body || {};
  const user = await db.findUser(String(username).trim());
  let ok = false;
  try {
    ok = user && user.status === "Active" &&
         db.verifyPassword(password, user.password_salt, user.password_hash);
  } catch { ok = false; }
  if (!ok) {
    await db.audit({ username, role: "-" }, "login_failed", "", "", "", ip(req));
    return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }
  await db.execute("UPDATE dbo.users SET last_login = @p0 WHERE user_id = @p1",
                   [db.now(), user.user_id]);
  const token = newSession(user);
  res.cookie("sid", token, { httpOnly: true, sameSite: "lax",
                             secure: process.env.INVENTORY_HTTPS === "1",
                             maxAge: SESSION_HOURS * 3600 * 1000 });
  await db.audit(user, "login", "", "", "", ip(req));
  res.json({ user: SESSIONS.get(token).user });
}));

app.post("/api/logout", wrap(async (req, res) => {
  if (req.user) await db.audit(req.user, "logout", "", "", "", ip(req));
  SESSIONS.delete(req.cookies.sid);
  res.clearCookie("sid");
  res.json({ ok: true });
}));

app.get("/api/me", (req, res) => res.json({ user: req.user || null }));

// --------------------------------------------------------------------------
// Metadata — the whole entity config the browser renders from
// --------------------------------------------------------------------------
app.get("/api/meta", loginRequired, (req, res) => {
  res.json({
    entities: Object.fromEntries(ENTITY_LIST.map(e => [e.key, {
      key: e.key, label: e.label, plural: e.plural, idField: e.idField,
      route: e.route, desc: e.desc || "", discriminator: e.discriminator || null,
      titleField: e.titleField || "", parent: e.parent || null,
      parentKey: e.parentKey || null, hiddenInNav: !!e.hiddenInNav,
      noAdd: !!e.noAdd,
      fields: e.fields.map(f => ({
        name: f.name, label: f.label, type: f.type, group: f.group,
        required: f.required, options: f.options, ref: f.ref,
        onlyFor: f.onlyFor, placeholder: f.placeholder, help: f.help,
      })),
      columns: e.columns,
      chips: (e.chips || []).map(c => ({ key: c.key, label: c.label, counts: c.counts })),
    }])),
    nav: NAV, lookups: LOOKUPS, warrantyEntities: WARRANTY_ENTITIES,
    filterSep: db.FILTER_SEP,
  });
});

// --------------------------------------------------------------------------
// Generic entity API
// --------------------------------------------------------------------------
function entOf(req, res) {
  const ent = ENTITIES[req.params.key];
  if (!ent) { res.status(404).json({ error: "unknown entity" }); return null; }
  return ent;
}

app.get("/api/e/:key", loginRequired, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  const filters = {};
  Object.entries(req.query).forEach(([k, v]) => {
    if (k.startsWith("f_") && v) filters[k.slice(2)] = v;
  });
  const out = await db.listRecords(ent, {
    q: req.query.q || "", chip: req.query.chip || "all",
    page: parseInt(req.query.page || "1", 10),
    perPage: Math.min(200, parseInt(req.query.per_page || "25", 10)),
    sort: req.query.sort || "", dir: req.query.dir || "asc",
    filters, parentId: req.query.parent || null,
  });
  out.rows = await db.decorate(ent, out.rows);
  res.json(out);
}));

app.get("/api/e/:key/options/:column", loginRequired, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  res.json({ values: await db.distinctValues(ent, req.params.column) });
}));

app.get("/api/refs/:key", loginRequired, wrap(async (req, res) => {
  res.json({ options: await db.refOptions(req.params.key, req.query.filter || "") });
}));

app.get("/api/e/:key/:id", loginRequired, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  const row = await db.getRecord(ent, req.params.id, true);
  if (!row) return res.status(404).json({ error: "not found" });
  await db.decorate(ent, [row]);

  const refs = {};
  for (const f of ent.fields.filter(f => f.type === "ref")) {
    if (!row[f.name]) continue;
    const target = ENTITIES[f.ref];
    const r = target ? await db.getRecord(target, row[f.name], true) : null;
    refs[f.name] = r ? { id: row[f.name], label: db.refLabel(target, r),
                         route: target.route } : null;
  }

  const children = [];
  for (const child of ENTITY_LIST.filter(e => e.parent === ent.key ||
      (e.fields.some(f => f.ref === ent.key) && e.key !== ent.key))) {
    const fk = child.parentKey ||
               child.fields.find(f => f.ref === ent.key)?.name;
    if (!fk) continue;
    const rows = await db.decorate(child, await db.query(
      `SELECT TOP 50 * FROM ${child.table} WHERE is_deleted = 0 AND [${fk}] = @p0`,
      [req.params.id]));
    if (rows.length || child.parent === ent.key)
      children.push({ key: child.key, label: child.plural, fk, rows,
                      columns: child.columns });
  }

  res.json({
    row, refs, children,
    history: await db.historyFor(ent.key, req.params.id),
    title: db.refLabel(ent, row),
  });
}));

app.post("/api/e/:key", adminOnly, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  const errors = await db.validate(ent, req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const id = await db.insertRecord(ent, req.body, req.user);
  res.json({ id });
}));

app.put("/api/e/:key/:id", adminOnly, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  const errors = await db.validate(ent, req.body || {}, req.params.id);
  if (Object.keys(errors).length) return res.status(400).json({ errors });
  const keys = await db.updateRecord(ent, req.params.id, req.body, req.user);
  if (keys === null) return res.status(404).json({ error: "not found" });
  res.json({ changed: keys });
}));

app.delete("/api/e/:key/:id", adminOnly, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  const ok = await db.softDelete(ent, req.params.id, req.user);
  res.json({ ok });
}));

app.post("/api/e/:key/:id/restore", adminOnly, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  res.json({ ok: await db.restore(ent, req.params.id, req.user) });
}));

// CSV export — any entity
app.get("/api/e/:key/export/csv", loginRequired, wrap(async (req, res) => {
  const ent = entOf(req, res); if (!ent) return;
  const rows = await db.decorate(ent, await db.query(
    `SELECT * FROM ${ent.table} WHERE is_deleted = 0 ORDER BY ${ent.idField}`));
  const cols = [ent.idField, ...ent.fields.map(f => f.name)];
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + [cols.join(","),
    ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\r\n");
  await db.audit(req.user, "export", ent.key, "", `${rows.length} row(s) to CSV`, ip(req));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition",
    `attachment; filename="${ent.key}_${db.today()}.csv"`);
  res.send(csv);
}));

/** Global search — one box that reaches every entity. */
app.get("/api/search", loginRequired, wrap(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ groups: [] });
  const groups = [];
  for (const ent of ENTITY_LIST) {
    if (!ent.search.length) continue;
    const ors = ent.search.map((c, i) => `[${c}] LIKE @p${i}`).join(" OR ");
    const rows = await db.decorate(ent, await db.query(
      `SELECT TOP 5 * FROM ${ent.table} WHERE is_deleted = 0 AND (${ors}` +
      ` OR ${ent.idField} LIKE @p${ent.search.length})` +
      ` ORDER BY ${ent.idField}`,
      [...ent.search.map(() => "%" + q + "%"), "%" + q + "%"]));
    if (!rows.length) continue;
    groups.push({
      key: ent.key, label: ent.plural, route: ent.route,
      rows: rows.map(r => ({
        id: r[ent.idField], title: db.refLabel(ent, r),
        subtitle: [r.model, r.ip_address, r.department, r.folder_path,
                   r.publisher, r.vendor].filter(Boolean)[0] || "",
      })),
    });
  }
  res.json({ groups });
}));

/** Row counts per entity, for the sidebar. */
app.get("/api/counts", loginRequired, wrap(async (req, res) => {
  const counts = {};
  for (const ent of ENTITY_LIST)
    counts[ent.key] = await db.scalar(
      `SELECT COUNT(*) FROM ${ent.table} WHERE is_deleted = 0`);
  counts.licenses_attn = await db.scalar(
    "SELECT COUNT(*) FROM dbo.licenses WHERE is_deleted = 0 AND (" +
    " (expiry_date IS NOT NULL AND expiry_date <= DATEADD(day, 90, CAST(GETDATE() AS date)))" +
    " OR ISNULL(used_quantity,0) > ISNULL(license_quantity,0))");
  counts.warranty_attn = await db.scalar(
    "SELECT COUNT(*) FROM dbo.hardware WHERE is_deleted = 0" +
    " AND warranty_expiry IS NOT NULL" +
    " AND warranty_expiry <= DATEADD(day, 90, CAST(GETDATE() AS date))") +
    await db.scalar(
    "SELECT COUNT(*) FROM dbo.network_devices WHERE is_deleted = 0" +
    " AND warranty_expiry IS NOT NULL" +
    " AND warranty_expiry <= DATEADD(day, 90, CAST(GETDATE() AS date))");
  res.json({ counts });
}));

// --------------------------------------------------------------------------
// Dashboard & governance
// --------------------------------------------------------------------------
app.get("/api/dashboard", loginRequired, wrap(async (req, res) =>
  res.json(await db.dashboard())));

app.get("/api/governance/history", loginRequired, wrap(async (req, res) =>
  res.json({ rows: await db.changeHistory(req.query.entity || "", 150) })));

app.get("/api/governance/audit", loginRequired, wrap(async (req, res) =>
  res.json({ rows: await db.auditTrail(200) })));

app.get("/api/governance/recycle-bin", loginRequired, wrap(async (req, res) =>
  res.json({ rows: await db.recycleBin() })));

app.get("/api/governance/warranty", loginRequired, wrap(async (req, res) =>
  res.json({ rows: await db.warrantyRegister() })));

// --------------------------------------------------------------------------
// Permission control
// --------------------------------------------------------------------------
app.get("/api/permission", loginRequired, wrap(async (req, res) =>
  res.json(await db.permissionDashboard())));

app.get("/api/permission/access", loginRequired, wrap(async (req, res) => {
  const mode = req.query.mode === "folder" ? "folder" : "user";
  const q = (req.query.q || "").trim();
  const users = await db.query(
    "SELECT TOP 8 user_logon FROM dbo.ad_users WHERE is_deleted = 0 ORDER BY user_logon");
  const folders = await db.permissionFolders();
  const samples = {
    users: users.map(u => u.user_logon),
    folders: [...new Set(folders.map(f => f.folder_name).filter(Boolean))].sort().slice(0, 8),
  };
  if (!q) return res.json({ mode, q, samples, result: null });
  const result = mode === "user" ? await db.accessByUser(q) : await db.accessByFolder(q);
  res.json({ mode, q, samples, result });
}));

/** Splits a CSV/TSV upload into objects keyed by the mapped header names. */
function parseDelimited(text, headerMap) {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!clean) return [];
  const lines = clean.split("\n").filter(l => l.trim());
  const delim = (lines[0].match(/\t/g) || []).length >
                (lines[0].match(/,/g) || []).length ? "\t" : ",";
  const splitRow = (line) => {
    const out = []; let cur = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delim) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
  };
  const headers = splitRow(lines[0]).map(h =>
    headerMap[h.toLowerCase().replace(/[^a-z0-9]/g, "")] || null);
  return lines.slice(1).map(line => {
    const cells = splitRow(line), row = {};
    headers.forEach((h, i) => { if (h) row[h] = cells[i] ?? ""; });
    return row;
  });
}

app.post("/api/permission/import", adminOnly,
  upload.fields([{ name: "ad_file" }, { name: "perm_file" }]),
  wrap(async (req, res) => {
    const report = { ad: null, perm: null, unknown_servers: [] };
    const files = req.files || {};

    if (files.ad_file?.[0]) {
      const name = files.ad_file[0].originalname;
      const rows = parseDelimited(files.ad_file[0].buffer.toString("utf8"), AD_IMPORT_MAP);
      const ent = ENTITIES.ad_users, mem = ENTITIES.ad_memberships;
      let created = 0, updated = 0, groups = 0, skipped = 0;
      const seenMem = new Set((await db.query(
        "SELECT user_logon, group_name FROM dbo.ad_memberships WHERE is_deleted = 0"
      )).map(r => r.user_logon + "||" + r.group_name));

      for (const r of rows) {
        const logon = (r.user_logon || "").trim();
        if (!logon) { skipped++; continue; }
        if (r.status) r.status = /^(true|enabled|active|1)$/i.test(r.status)
          ? "Enabled" : (/^(false|disabled|0)$/i.test(r.status) ? "Disabled" : r.status);
        const existing = (await db.query(
          "SELECT * FROM dbo.ad_users WHERE user_logon = @p0 AND is_deleted = 0", [logon]))[0];
        const payload = {
          user_logon: logon, display_name: r.display_name || "", first_name: r.first_name || "",
          surname: r.surname || "", status: r.status || "Enabled", job_title: r.job_title || "",
          department: r.department || "", email: r.email || "",
          source_file: name, imported_at: db.now(),
        };
        if (existing) { await db.updateRecord(ent, existing.ad_user_id, payload, req.user); updated++; }
        else { await db.insertRecord(ent, payload, req.user); created++; }

        const gname = (r.group_name || "").trim();
        if (gname && !seenMem.has(logon + "||" + gname)) {
          await db.insertRecord(mem, { user_logon: logon, group_name: gname,
                                       source_file: name }, req.user);
          seenMem.add(logon + "||" + gname);
          groups++;
        }
      }
      report.ad = { file: name, rows: rows.length, created, updated, groups, skipped };
      await db.audit(req.user, "import", "ad_users", "",
        `${name}: +${created} new, ${updated} updated, +${groups} membership(s)`, ip(req));
    }

    if (files.perm_file?.[0]) {
      const name = files.perm_file[0].originalname;
      const rows = parseDelimited(files.perm_file[0].buffer.toString("utf8"), PERM_IMPORT_MAP);
      const ent = ENTITIES.server_permissions;
      const servers = await db.fileServers();
      const byName = Object.fromEntries(servers.map(s =>
        [s.system_name.toLowerCase(), s.server_id]));
      let created = 0, updated = 0, skipped = 0;
      const unknown = new Set();

      for (const r of rows) {
        const folder = (r.folder_name || "").trim();
        const sname = (r.server_name || "").trim();
        const sid = byName[sname.toLowerCase()];
        if (!folder) { skipped++; continue; }
        if (!sid) { unknown.add(sname || "(blank)"); skipped++; continue; }
        const existing = (await db.query(
          "SELECT * FROM dbo.server_permissions WHERE is_deleted = 0" +
          " AND server_id = @p0 AND folder_name = @p1", [sid, folder]))[0];
        const payload = {
          server_id: sid, folder_name: folder, folder_path: r.folder_path || "",
          level: r.level || "", department: r.department || "",
          rw_group: r.rw_group || "", ro_group: r.ro_group || "",
          quota_gb: r.quota_gb || null, owner: r.owner || "", source_file: name,
        };
        if (existing) { await db.updateRecord(ent, existing.permission_id, payload, req.user); updated++; }
        else { await db.insertRecord(ent, payload, req.user); created++; }
      }
      report.perm = { file: name, rows: rows.length, created, updated, skipped };
      report.unknown_servers = [...unknown];
      await db.audit(req.user, "import", "server_permissions", "",
        `${name}: +${created} new, ${updated} updated`, ip(req));
    }

    res.json({ report });
  }));

// --------------------------------------------------------------------------
// Administration — application users
// --------------------------------------------------------------------------
app.get("/api/admin/users", adminOnly, wrap(async (req, res) => {
  res.json({ rows: await db.query(
    "SELECT user_id, username, display_name, email, role, status, last_login," +
    " created_at FROM dbo.users WHERE is_deleted = 0 ORDER BY username") });
}));

app.post("/api/admin/users", adminOnly, wrap(async (req, res) => {
  const { username, display_name = "", email = "", role = "viewer",
          password = "" } = req.body || {};
  if (!username || password.length < 6)
    return res.status(400).json({ error: "ต้องมี username และรหัสผ่านอย่างน้อย 6 ตัวอักษร" });
  if (await db.findUser(username))
    return res.status(400).json({ error: "username นี้มีอยู่แล้ว" });
  const { salt, hash } = db.hashPassword(password);
  const id = await db.nextUserId();
  await db.execute(
    "INSERT INTO dbo.users (user_id, username, display_name, email, role, status," +
    " password_hash, password_salt, created_at, created_by, updated_at, updated_by)" +
    " VALUES (@p0,@p1,@p2,@p3,@p4,'Active',@p5,@p6,@p7,@p8,@p7,@p8)",
    [id, username, display_name, email, role === "admin" ? "admin" : "viewer",
     hash, salt, db.now(), req.user.username]);
  await db.audit(req.user, "create", "users", id, `user ${username} (${role})`, ip(req));
  res.json({ id });
}));

app.put("/api/admin/users/:id", adminOnly, wrap(async (req, res) => {
  const { display_name, email, role, status, password } = req.body || {};
  const sets = [], vals = [];
  const put = (col, v) => { sets.push(`${col} = @p${vals.length}`); vals.push(v); };
  if (display_name !== undefined) put("display_name", display_name);
  if (email !== undefined) put("email", email);
  if (role) put("role", role === "admin" ? "admin" : "viewer");
  if (status) put("status", status);
  if (password) {
    if (password.length < 6)
      return res.status(400).json({ error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" });
    const { salt, hash } = db.hashPassword(password);
    put("password_hash", hash); put("password_salt", salt);
  }
  if (!sets.length) return res.json({ ok: true });
  put("updated_at", db.now()); put("updated_by", req.user.username);
  vals.push(req.params.id);
  await db.execute(
    `UPDATE dbo.users SET ${sets.join(", ")} WHERE user_id = @p${vals.length - 1}`, vals);
  await db.audit(req.user, "update", "users", req.params.id,
    password ? "password reset" : "profile updated", ip(req));
  res.json({ ok: true });
}));

app.delete("/api/admin/users/:id", adminOnly, wrap(async (req, res) => {
  if (req.params.id === req.user.user_id)
    return res.status(400).json({ error: "ลบบัญชีตัวเองไม่ได้" });
  await db.execute(
    "UPDATE dbo.users SET is_deleted = 1, updated_at = @p0, updated_by = @p1" +
    " WHERE user_id = @p2", [db.now(), req.user.username, req.params.id]);
  await db.audit(req.user, "delete", "users", req.params.id, "user removed", ip(req));
  res.json({ ok: true });
}));

app.post("/api/account/password", loginRequired, wrap(async (req, res) => {
  const { current = "", next = "" } = req.body || {};
  const user = await db.findUser(req.user.username);
  if (!user || !db.verifyPassword(current, user.password_salt, user.password_hash))
    return res.status(400).json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" });
  if (next.length < 6)
    return res.status(400).json({ error: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร" });
  const { salt, hash } = db.hashPassword(next);
  await db.execute(
    "UPDATE dbo.users SET password_hash = @p0, password_salt = @p1, updated_at = @p2," +
    " updated_by = @p3 WHERE user_id = @p4",
    [hash, salt, db.now(), req.user.username, req.user.user_id]);
  await db.audit(req.user, "password_change", "users", req.user.user_id, "", ip(req));
  res.json({ ok: true });
}));

// SPA fallback — every non-API path serves the shell
app.get(/^(?!\/api\/).*/, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")));

// --------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || "8000", 10);
if (require.main === module) {
  db.initDb()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`[db] SQL Server: ${process.env.MSSQL_SERVER || "localhost"}` +
                    ` / ${process.env.MSSQL_DATABASE || "ITInventory"}`);
        console.log(`IT Inventory running on http://127.0.0.1:${PORT}` +
                    "  (sign in: admin / admin123)");
        console.log("Empty database? load demo data with:  npm run seed");
      });
    })
    .catch(err => {
      console.error("\n[db] ต่อ SQL Server ไม่ได้:", err.message);
      console.error("ตรวจ MSSQL_SERVER / MSSQL_DATABASE / MSSQL_USER / MSSQL_PASSWORD" +
                    " แล้วลองใหม่ (ดูหัวข้อ 2 ใน README.md)\n");
      process.exit(1);
    });
}

module.exports = app;
