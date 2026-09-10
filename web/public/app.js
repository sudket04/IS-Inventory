/**
 * Browser front end — plain JavaScript, no framework, no build step.
 *
 * Screens are rendered from the entity config the API hands over at
 * /api/meta, so the 12 entities share one list, one detail and one form
 * renderer. Routing is hash-based: #/server/hardware, #/server/hardware/HW-001.
 */

"use strict";

const state = {
  user: null, meta: null, route: null, counts: {},
};

/** One small line-icon per nav key — helps the eye find a menu item fast. */
const ICONS = {
  dashboard: "M3 12h5l2-6 4 12 2-6h5",
  hardware: "M3 5h18v5H3zM3 14h18v5H3zM7 7.5h.01M7 16.5h.01",
  clusters: "M4 7h6v4H4zM14 7h6v4h-6zM9 17h6v4H9zM7 11v3h10v-3",
  servers: "M5 4h14v6H5zM5 14h14v6H5zM8 7h.01M8 17h.01",
  network_devices: "M4 8h16v4H4zM12 12v4M6 20h12M7 10h.01M10 10h.01",
  vlans: "M4 6h16M4 12h16M4 18h16M8 6v12M16 6v12",
  software: "M4 5h16v12H4zM9 21h6M12 17v4",
  licenses: "M5 4h9l5 5v11H5zM14 4v5h5M8 14h8M8 17h5",
  permission: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z",
  permaccess: "M11 4a5 5 0 100 10 5 5 0 000-10zM14.5 12.5L21 19M17 17l2 2",
  ad_users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 8h5M19.5 5.5v5",
  server_permissions: "M3 7h6l2 2h10v10H3zM10 14h6M13 12v4",
  warranty: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4",
  history: "M4 12a8 8 0 108-8M4 12H2m2 0V9M12 7v5l3 2",
  recycle: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6",
  locations: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 8a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  users: "M8 11a4 4 0 100-8 4 4 0 000 8zM1 21c0-4 3-6 7-6s7 2 7 6M17 21c0-3-1-5-3-6a4 4 0 000-8",
};
const icon = (key) => `<svg class="nav-ico" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
  stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[key] || ICONS.dashboard}"/></svg>`;

/** Which entity count (if any) each nav key shows. */
const NAV_COUNT = {
  hardware: "hardware", clusters: "clusters", servers: "servers",
  network_devices: "network_devices", vlans: "vlans", software: "software",
  licenses: "licenses", ad_users: "ad_users",
  server_permissions: "server_permissions", locations: "locations",
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const root = () => document.getElementById("root");

const esc = (v) => String(v ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const dstr = (v) => {
  if (!v) return "";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};
const dtstr = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "");
const num = (v) => (v === null || v === undefined || v === "" ? "—"
  : Number(v).toLocaleString("en-US"));
const money = (v) => (v === null || v === undefined || v === "" ? "—"
  : Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }));

const daysTo = (d) => {
  if (!d) return null;
  const t = new Date(dstr(d) + "T00:00:00");
  if (isNaN(t)) return null;
  return Math.round((t - new Date(new Date().toDateString())) / 86400000);
};

function toast(msg, isErr = false) {
  const el = document.createElement("div");
  el.className = "toast" + (isErr ? " err" : "");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), isErr ? 6000 : 3200);
}

async function api(url, opts = {}) {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: opts.body && !(opts.body instanceof FormData)
      ? { "Content-Type": "application/json" } : undefined,
    ...opts,
  });
  if (res.status === 401) { state.user = null; renderLogin(); throw new Error("unauthorised"); }
  const data = res.headers.get("content-type")?.includes("json")
    ? await res.json() : {};
  if (!res.ok) { const e = new Error(data.error || "request failed"); e.data = data; throw e; }
  return data;
}

const go = (hash) => { location.hash = hash; };

// --------------------------------------------------------------------------
// Login
// --------------------------------------------------------------------------
function renderLogin(message = "") {
  root().innerHTML = `
    <div class="login-wrap"><form class="login-card" id="login">
      <div class="brand">
        <span class="brand-mark">SVR</span>
        <div><div class="brand-title" style="color:var(--text)">IT Inventory</div>
        <div class="brand-sub" style="color:var(--muted)">Infrastructure asset register</div></div>
      </div>
      ${message ? `<div class="alert err">${esc(message)}</div>` : ""}
      <label for="u">Username</label>
      <input id="u" name="username" autocomplete="username" autofocus required>
      <label for="p">Password</label>
      <input id="p" name="password" type="password" autocomplete="current-password" required>
      <button class="btn primary" type="submit">เข้าสู่ระบบ</button>
      <div class="login-hint">ครั้งแรกใช้ admin / admin123 แล้วเปลี่ยนรหัสผ่านทันที<br>
      viewer เข้าดูได้อย่างเดียว</div>
    </form></div>`;
  $("#login").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const { user } = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username: $("#u").value, password: $("#p").value }),
      });
      state.user = user;
      state.meta = await api("/api/meta");
      if (!location.hash || location.hash === "#/login") location.hash = "#/";
      route();
    } catch (err) { renderLogin(err.message); }
  });
}

// --------------------------------------------------------------------------
// Shell
// --------------------------------------------------------------------------
function shell(bodyHtml, { crumb = "", heading = "", sub = "", actions = "" } = {}) {
  const path = "/" + (location.hash.replace(/^#/, "").split("?")[0].replace(/^\//, ""));
  const active = (href) => path === href ||
    (href !== "/" && (path === href || path.startsWith(href + "/")));
  const nav = state.meta.nav.map(([group, items]) => {
    if (group === "Administration" && state.user.role !== "admin") return "";
    return `<div class="nav-section"><div class="nav-title">${esc(group)}</div>` +
      items.map(([label, href, key]) => {
        const c = state.counts[NAV_COUNT[key]];
        const attn = key === "licenses" ? state.counts.licenses_attn
          : key === "warranty" ? state.counts.warranty_attn : 0;
        const badge = attn ? `<span class="nav-count attn">${attn}</span>`
          : (c || c === 0) ? `<span class="nav-count">${c}</span>` : "";
        return `<a class="nav-item${active(href) ? " on" : ""}" href="#${href}"
          title="${esc(label)}">${icon(key)}<span>${esc(label)}</span>${badge}</a>`;
      }).join("") + "</div>";
  }).join("");

  root().innerHTML = `<div class="app">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">SVR</span>
        <div><div class="brand-title">IT Inventory</div>
        <div class="brand-sub">Infrastructure asset register</div></div></div>
      ${nav}
      <div class="who"><span class="avatar">${esc((state.user.display_name || "?")[0].toUpperCase())}</span>
        <div><div class="who-name">${esc(state.user.display_name)}</div>
        <div class="who-role">${state.user.role === "admin" ? "Admin — แก้ไขได้ทุกอย่าง" : "Viewer — อ่านอย่างเดียว"}</div></div>
      </div>
      <form><button class="ghost" type="button" id="logout">ออกจากระบบ</button></form>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="topbar-tools">
          <button class="sidebar-toggle" id="navtoggle" aria-label="เปิดเมนู">☰</button>
          <div class="gsearch">
            <span class="gs-ico" aria-hidden="true">⌕</span>
            <input id="gs" placeholder="ค้นหาทุกอย่าง — serial, IP, ชื่อเครื่อง, folder, licence…"
              autocomplete="off" spellcheck="false">
            <kbd>/</kbd>
            <div class="gs-results" id="gsr" style="display:none"></div>
          </div>
        </div>
        <div class="topbar-main">
          <div>
            ${crumb ? `<div class="crumb">${crumb}</div>` : ""}
            <h1>${esc(heading)}</h1>
            ${sub ? `<p class="sub">${esc(sub)}</p>` : ""}
          </div>
          ${actions ? `<div class="actions">${actions}</div>` : ""}
        </div>
      </header>
      <div id="page">${bodyHtml}</div>
    </main></div>`;

  $("#logout").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    state.user = null;
    location.hash = "";
    renderLogin();
  });
  $("#navtoggle").addEventListener("click", () =>
    document.body.classList.toggle("nav-open"));
  wireGlobalSearch();
}

// --------------------------------------------------------------------------
// Global search — one box that reaches every record
// --------------------------------------------------------------------------
function wireGlobalSearch() {
  const input = $("#gs"), box = $("#gsr");
  if (!input) return;
  let timer = null, hits = [], sel = -1;

  const close = () => { box.style.display = "none"; sel = -1; };
  const paint = () => {
    box.querySelectorAll(".gs-hit").forEach((el, i) =>
      el.classList.toggle("sel", i === sel));
  };

  const run = async () => {
    const q = input.value.trim();
    if (q.length < 2) return close();
    const { groups } = await api(`/api/search?q=${encodeURIComponent(q)}`);
    hits = [];
    box.innerHTML = groups.length ? groups.map(g => `
      <div class="gs-group">${esc(g.label)}</div>` +
      g.rows.map(r => {
        hits.push(`${g.route}/${r.id}`);
        return `<a class="gs-hit" href="#${g.route}/${r.id}">
          <span class="gs-id">${esc(r.id)}</span>
          <span>${esc(r.title || "—")}</span>
          ${r.subtitle ? `<span class="gs-sub">${esc(r.subtitle)}</span>` : ""}</a>`;
      }).join("")).join("")
      : `<div class="gs-empty">ไม่พบรายการที่ตรงกับ “${esc(q)}”</div>`;
    box.style.display = "";
    box.querySelectorAll(".gs-hit").forEach(el =>
      el.addEventListener("click", () => { close(); input.value = ""; }));
  };

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(run, 220);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); input.blur(); }
    if (!hits.length || box.style.display === "none") return;
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % hits.length; paint(); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + hits.length) % hits.length; paint(); }
    if (e.key === "Enter" && sel >= 0) {
      e.preventDefault();
      go(hits[sel]);
      input.value = "";
      close();
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".gsearch")) close();
  });
}

/** "/" anywhere focuses the global search. */
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
  const t = e.target.tagName;
  if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
  const box = document.getElementById("gs");
  if (box) { e.preventDefault(); box.focus(); }
});

const loading = (cols = 5) => `<div class="card">
  ${Array.from({ length: 8 }, () => `<div class="sk-row">${
    Array.from({ length: cols }, () => `<div class="skeleton"></div>`).join("")}</div>`).join("")}
</div>`;
const isAdmin = () => state.user?.role === "admin";

// --------------------------------------------------------------------------
// Cell rendering
// --------------------------------------------------------------------------
const BADGE = {
  "In Use": "ok", Active: "ok", Use: "ok", Enabled: "ok", Yes: "ok",
  "In Stock": "info", Standby: "info", Evaluation: "info", UAT: "info",
  Maintenance: "warn", Expiring: "warn", Suspended: "warn",
  Decommissioned: "mute", Retired: "mute", Disabled: "mute", Inactive: "mute", No: "mute",
  Expired: "bad", Terminated: "bad",
};

function warrantyCell(v) {
  const d = daysTo(v);
  if (d === null) return `<span class="badge bad">ไม่ระบุ</span>`;
  const cls = d < 0 ? "bad" : d <= 90 ? "warn" : "ok";
  const note = d < 0 ? `หมดแล้ว ${Math.abs(d)} วัน` : `เหลือ ${d} วัน`;
  return `<span class="badge ${cls}">${dstr(v)}</span>
          <div style="font-size:11.5px;color:var(--muted)">${note}</div>`;
}

function cell(ent, col, row) {
  const v = row[col.name];
  switch (col.kind) {
    case "mono": return `<span class="mono">${esc(v ?? "")}</span>`;
    case "type": return `<span class="badge">${esc(v ?? "")}</span>`;
    case "badge": return `<span class="badge ${BADGE[v] || ""}">${esc(v ?? "—")}</span>`;
    case "warranty": return warrantyCell(v);
    case "expiry": {
      if (!v) return `<span style="color:var(--muted)">ไม่มีวันหมดอายุ</span>`;
      const d = daysTo(v);
      const cls = d < 0 ? "bad" : d <= 90 ? "warn" : "ok";
      return `<span class="badge ${cls}">${dstr(v)}</span>
              <div style="font-size:11.5px;color:var(--muted)">${d < 0 ? `หมดแล้ว ${Math.abs(d)} วัน` : `เหลือ ${d} วัน`}</div>`;
    }
    case "seats": {
      const q = row.license_quantity || 0, u = row.used_quantity || 0;
      const pct = q ? Math.min(100, Math.round((u / q) * 100)) : 0;
      const over = u > q;
      return `<div class="mono">${num(u)} / ${num(q)}</div>
        <div style="height:6px;border-radius:99px;background:#E8E8E2;margin-top:4px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${over ? "var(--danger)" : "var(--accent)"}"></div>
        </div>
        ${over ? `<div style="font-size:11.5px;color:var(--danger)">เกินสิทธิ์ ${u - q}</div>` : ""}`;
    }
    case "ref": {
      const label = row[col.name.replace(/_id$/, "") + "_label"] ||
                    row.location_label || row.server_label || row.hardware_label || v;
      const extra = col.name === "location_id" && row.u_label
        ? `<div style="font-size:11.5px;color:var(--muted)">${esc(row.u_label)}</div>` : "";
      return `${esc(label ?? "—")}${extra}`;
    }
    case "folder":
      return `<div class="folder-cell"><span class="folder-name">${esc(row.folder_name ?? "")}</span>
        ${row.folder_path ? `<span class="folder-path mono">${esc(row.folder_path)}</span>` : ""}</div>`;
    case "groups":
      return `<div class="grp-cell">
        ${row.rw_group ? `<span class="ad-chip rw">RW · ${esc(row.rw_group)}</span>` : ""}
        ${row.ro_group ? `<span class="ad-chip ro">RO · ${esc(row.ro_group)}</span>` : ""}
        ${!row.rw_group && !row.ro_group ? `<span class="badge bad">ไม่มีกลุ่ม</span>` : ""}</div>`;
    case "dept":
      return `${esc(row.department ?? "—")}${row.job_title
        ? `<div style="font-size:11.5px;color:var(--muted)">${esc(row.job_title)}</div>` : ""}`;
    case "gb": return v ? `<span class="mono">${num(v)} GB</span>`
                        : `<span style="color:var(--muted)">—</span>`;
    default:
      if (v instanceof Date || /^\d{4}-\d{2}-\d{2}T/.test(String(v))) return dstr(v);
      return esc(v ?? "—");
  }
}

// --------------------------------------------------------------------------
// Entity list
// --------------------------------------------------------------------------
function parseQuery() {
  const raw = location.hash.split("?")[1] || "";
  return Object.fromEntries(new URLSearchParams(raw));
}

function withQuery(base, changes) {
  const q = { ...parseQuery(), ...changes };
  Object.keys(q).forEach(k => { if (!q[k] || q[k] === "all") delete q[k]; });
  const s = new URLSearchParams(q).toString();
  return "#" + base + (s ? "?" + s : "");
}

async function renderList(ent) {
  const q = parseQuery();
  const params = new URLSearchParams(q);
  shell(loading(ent.columns.length), {
    heading: ent.plural, sub: ent.desc,
    actions: [
      isAdmin() && !ent.noAdd
        ? `<a class="btn primary" href="#${ent.route}/new">+ เพิ่ม${esc(ent.label)}</a>` : "",
      isAdmin() && ent.key === "ad_users"
        ? `<a class="btn primary" href="#/permission/import">Import AD</a>` : "",
      `<a class="btn" href="/api/e/${ent.key}/export/csv">⤓ Export CSV</a>`,
    ].filter(Boolean).join(""),
  });

  const data = await api(`/api/e/${ent.key}?${params}`);
  const active = Object.entries(q).filter(([k, v]) => k.startsWith("f_") && v);
  const pages = Math.max(1, Math.ceil(data.total / data.perPage));
  const page = data.page;
  const sortCol = q.sort || "", sortDir = q.dir === "desc" ? "desc" : "asc";

  const chips = ent.chips.map(c => {
    const on = (q.chip || "all") === c.key;
    const n = data.counts[c.key];
    return `<a class="chip${on ? " on" : ""}${!on && n ? " warn" : ""}"
      href="${withQuery(ent.route, { chip: c.key, page: "" })}">${esc(c.label)}${
      n ? ` <span class="n">${n}</span>` : ""}</a>`;
  }).join("");

  const head = ent.columns.map(c => {
    const sortable = ent.fields.some(f => f.name === c.name);
    const filterable = sortable || c.filterOn;
    const on = q["f_" + c.name];
    const isSorted = sortCol === c.name;
    const label = sortable
      ? `<button class="th-sort${isSorted ? " on" : ""}" data-sort="${c.name}"
           title="เรียงตาม${esc(c.label)}">${esc(c.label)}
           <span class="caret">${isSorted && sortDir === "desc" ? "▼" : "▲"}</span></button>`
      : esc(c.label);
    return `<th${c.width ? ` style="width:${c.width}"` : ""}>
      <span class="th-inner">${label}
      ${filterable ? `<button class="th-filter${on ? " on active" : ""}" data-col="${c.name}"
        title="กรองคอลัมน์นี้">▾</button>` : ""}</span></th>`;
  }).join("");

  const emptyMsg = q.q || active.length
    ? `<div class="empty-title">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</div>
       <a href="#${ent.route}">ล้างตัวกรองทั้งหมด</a>`
    : ent.key === "ad_users"
      ? `<div class="empty-title">ยังไม่มีข้อมูล AD</div>${isAdmin()
          ? `<a href="#/permission/import">import ไฟล์ AD_AllGroups</a>`
          : "ให้ผู้ดูแลระบบ import ก่อน"}`
      : `<div class="empty-title">ยังไม่มี${esc(ent.plural)}</div>${isAdmin()
          ? `<a href="#${ent.route}/new">เพิ่มรายการแรก</a>` : ""}`;

  const body = data.rows.length ? data.rows.map(r =>
    `<tr class="clickable" data-id="${esc(r[ent.idField])}" tabindex="0">` +
    ent.columns.map(c => `<td>${cell(ent, c, r)}</td>`).join("") + "</tr>").join("")
    : `<tr><td colspan="${ent.columns.length}"><div class="empty">${emptyMsg}</div></td></tr>`;

  $("#page").innerHTML = `<section class="card">
    <div class="list-tools">
      <div class="search"><span aria-hidden="true">⌕</span>
        <input id="q" placeholder="ค้นใน ${esc(ent.plural)}…" value="${esc(q.q || "")}"></div>
      ${q.q ? `<a class="btn small" href="${withQuery(ent.route, { q: "", page: "" })}">ล้างคำค้น</a>` : ""}
      <span class="list-count">พบ <b>${num(data.total)}</b> รายการ</span>
      <select class="perpage" id="perpage">
        ${[25, 50, 100, 200].map(n =>
          `<option value="${n}"${data.perPage === n ? " selected" : ""}>${n} แถว/หน้า</option>`).join("")}
      </select>
    </div>
    <div class="chips">${chips}</div>
    ${active.length ? `<div class="filter-bar">
      <span class="filter-bar-label">กรองอยู่</span>
      ${active.map(([k, v]) => `<span class="filter-pill"><b>${esc(
        ent.columns.find(c => "f_" + c.name === k)?.label || k.slice(2))}</b> ${esc(v)}
        <a href="${withQuery(ent.route, { [k]: "" })}" title="ลบตัวกรอง">✕</a></span>`).join("")}
      <a class="filter-clear" href="${withQuery(ent.route,
        Object.fromEntries(active.map(([k]) => [k, ""])))}">ล้างทั้งหมด</a></div>` : ""}
    <div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <div class="tfoot">
      <span>หน้า ${page} จาก ${pages} · คลิกที่แถวเพื่อดูรายละเอียด</span>
      <span class="right">
        ${page > 1 ? `<a class="btn small" href="${withQuery(ent.route, { page: page - 1 })}">‹ ก่อนหน้า</a>` : ""}
        ${page < pages ? `<a class="btn small" href="${withQuery(ent.route, { page: page + 1 })}">ถัดไป ›</a>` : ""}
      </span></div>
  </section>`;

  const search = $("#q");
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go(withQuery(ent.route, { q: search.value, page: "" }));
  });
  $("#perpage").addEventListener("change", (e) =>
    go(withQuery(ent.route, { per_page: e.target.value, page: "" })));
  $("#page").querySelectorAll("tr.clickable").forEach(tr => {
    const open = () => go(`${ent.route}/${tr.dataset.id}`);
    tr.addEventListener("click", open);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
  });
  $("#page").querySelectorAll(".th-sort").forEach(btn =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const col = btn.dataset.sort;
      const dir = sortCol === col && sortDir === "asc" ? "desc" : "asc";
      go(withQuery(ent.route, { sort: col, dir, page: "" }));
    }));
  $("#page").querySelectorAll(".th-filter").forEach(btn =>
    btn.addEventListener("click", (e) => { e.stopPropagation(); openFilter(ent, btn); }));
}

async function openFilter(ent, btn) {
  document.querySelector(".filter-pop")?.remove();
  const col = btn.dataset.col;
  const { values } = await api(`/api/e/${ent.key}/options/${col}`);
  const cur = parseQuery()["f_" + col] || "";
  const rect = btn.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = "filter-pop";
  pop.style.left = Math.max(12, Math.min(rect.left - 8,
    window.innerWidth - 372)) + "px";
  pop.style.top = (rect.bottom + 6) + "px";
  pop.innerHTML = `
    <div class="filter-head">กรอง ${esc(ent.columns.find(c => c.name === col)?.label || col)}</div>
    <input class="filter-search" placeholder="พิมพ์เพื่อค้นหา…">
    <div class="filter-list">${values.length ? values.map(v =>
      `<label class="filter-opt"><input type="radio" name="fv" value="${esc(v)}"${
        String(v) === cur ? " checked" : ""}><span class="filter-opt-label">${esc(v)}</span></label>`
      ).join("") : `<div class="filter-empty">ไม่มีค่าให้เลือก</div>`}</div>
    <div class="filter-actions">
      <button class="btn small" data-act="clear">ล้าง</button>
      <button class="btn small primary" data-act="apply">ใช้ตัวกรอง</button></div>`;
  document.body.appendChild(pop);
  const search = pop.querySelector(".filter-search");
  search.focus();
  search.addEventListener("input", () => {
    const needle = search.value.toLowerCase();
    pop.querySelectorAll(".filter-opt").forEach(o =>
      o.style.display = o.textContent.toLowerCase().includes(needle) ? "" : "none");
  });
  pop.querySelector('[data-act="apply"]').addEventListener("click", () => {
    const picked = pop.querySelector('input[name="fv"]:checked')?.value || "";
    pop.remove();
    go(withQuery(ent.route, { ["f_" + col]: picked, page: "" }));
  });
  pop.querySelector('[data-act="clear"]').addEventListener("click", () => {
    pop.remove();
    go(withQuery(ent.route, { ["f_" + col]: "", page: "" }));
  });
  setTimeout(() => document.addEventListener("click", function once(e) {
    if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener("click", once); }
  }), 0);
}

// --------------------------------------------------------------------------
// Entity detail
// --------------------------------------------------------------------------
async function renderDetail(ent, id) {
  shell(loading(), { heading: id, crumb: `<a href="#${ent.route}">${esc(ent.plural)}</a> / ${esc(id)}` });
  const data = await api(`/api/e/${ent.key}/${id}`);
  const row = data.row;
  const disc = ent.discriminator ? row[ent.discriminator] : null;

  const groups = [];
  ent.fields.forEach(f => {
    if (f.onlyFor && f.onlyFor !== disc) return;
    let g = groups.find(x => x.name === f.group);
    if (!g) groups.push(g = { name: f.group, fields: [] });
    g.fields.push(f);
  });

  const valueOf = (f) => {
    const v = row[f.name];
    if (v === null || v === undefined || v === "") return `<span style="color:var(--muted)">—</span>`;
    if (f.type === "ref") {
      const r = data.refs[f.name];
      return r ? `<a href="#${r.route}/${r.id}">${esc(r.label)}</a>` : esc(v);
    }
    if (f.type === "date") return dstr(v);
    if (f.type === "money") return `<span class="mono">${money(v)}</span>`;
    if (f.type === "int") return `<span class="mono">${num(v)}</span>`;
    if (["ip", "mac"].includes(f.type)) return `<span class="mono">${esc(v)}</span>`;
    if (f.name === "status") return `<span class="badge ${BADGE[v] || ""}">${esc(v)}</span>`;
    if (f.name.includes("warranty_expiry")) return warrantyCell(v);
    return esc(v);
  };

  const sections = groups.map((g, i) => `<section class="card" id="sec-${i}">
    <div class="card-head"><h2>${esc(g.name)}</h2></div>
    <div class="card-body"><div class="detail-grid">
      ${g.fields.map(f => `<div class="kv"><span class="kv-key">${esc(f.label)}</span>
        <span class="kv-val">${valueOf(f)}</span></div>`).join("")}
    </div></div></section>`).join("");

  // Summary strip — the four or five facts you look for first
  const heroPicks = [];
  const push = (key, val) => { if (val) heroPicks.push({ key, val }); };
  if (row.status) push("สถานะ", `<span class="badge ${BADGE[row.status] || ""}">${esc(row.status)}</span>`);
  if ("warranty_expiry" in row) push("หมดประกัน", warrantyCell(row.warranty_expiry));
  if ("expiry_date" in row && row.expiry_date) push("หมดอายุ", warrantyCell(row.expiry_date));
  if (row.fixed_asset !== undefined)
    push("เลขครุภัณฑ์", row.fixed_asset
      ? `<span class="mono">${esc(row.fixed_asset)}</span>`
      : `<span class="badge bad">ไม่ระบุ</span>`);
  if (row.ip_address) push("IP", `<span class="mono">${esc(row.ip_address)}</span>`);
  if (row.ip_management && !row.ip_address)
    push("IP management", `<span class="mono">${esc(row.ip_management)}</span>`);
  if (row.location_label) push("ตำแหน่ง", esc(row.location_label));
  if (ent.key === "licenses")
    push("ใช้ / ซื้อ", `<span class="mono">${num(row.used_quantity)} / ${num(row.license_quantity)}</span>`);
  if (ent.key === "server_permissions")
    push("AD groups", `${row.rw_group ? `<span class="ad-chip rw">RW</span> ` : ""}${
      row.ro_group ? `<span class="ad-chip ro">RO</span>` : ""}${
      !row.rw_group && !row.ro_group ? `<span class="badge bad">ไม่มีกลุ่ม</span>` : ""}`);
  if (ent.key === "ad_users") push("AD groups", num(row.group_count));
  push("รหัส", `<span class="mono">${esc(id)}</span>`);

  const hero = `<div class="hero">${heroPicks.slice(0, 5).map(h =>
    `<div class="hero-cell"><div class="hero-key">${h.key}</div>
      <div class="hero-val">${h.val}</div></div>`).join("")}</div>`;

  const jump = groups.length > 2 ? `<div class="jump">${groups.map((g, i) =>
    `<a href="#sec-${i}" data-jump="sec-${i}">${esc(g.name)}</a>`).join("")}
    <a href="#hist" data-jump="hist">ประวัติการแก้ไข</a></div>` : "";

  const children = data.children.map(ch => {
    const childEnt = state.meta.entities[ch.key];
    return `<section class="card">
      <div class="card-head"><h2>${esc(ch.label)}</h2>
        <div class="right">
          <span style="color:var(--muted);font-size:12.5px;align-self:center">${ch.rows.length} รายการ</span>
          ${isAdmin() && !childEnt.noAdd ? `<a class="btn small primary"
            href="#${childEnt.route}/new?${ch.fk}=${encodeURIComponent(id)}">+ Add ${esc(childEnt.label.toLowerCase())}</a>` : ""}
        </div></div>
      <div class="table-wrap"><table>
        <thead><tr>${ch.columns.map(c => `<th>${esc(c.label)}</th>`).join("")}</tr></thead>
        <tbody>${ch.rows.length ? ch.rows.map(r =>
          `<tr class="clickable" data-go="${childEnt.route}/${r[childEnt.idField]}">${
            ch.columns.map(c => `<td>${cell(childEnt, c, r)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${ch.columns.length}"><div class="empty">ยังไม่มีรายการ</div></td></tr>`}
        </tbody></table></div></section>`;
  }).join("");

  const history = `<section class="card" id="hist">
    <div class="card-head"><h2>ประวัติการแก้ไข</h2>
      <div class="right"><span style="color:var(--muted);font-size:12.5px;align-self:center">
        ${data.history.length} เวอร์ชัน</span></div></div>
    <div class="timeline">${data.history.length ? data.history.map(h => {
      let keys = [];
      try { keys = JSON.parse(h.changed_keys); } catch { keys = []; }
      return `<div class="timeline-row">
        <span class="timeline-when">v${h.version_no} · ${dtstr(h.changed_at)}</span>
        <div><b>${esc(h.changed_by)}</b> ${esc(h.action)}
          ${keys.length ? `<div style="color:var(--muted);font-size:12.5px">${
            esc(keys.join(", "))}</div>` : ""}</div></div>`;
    }).join("") : `<div class="empty">ยังไม่มีประวัติ</div>`}</div></section>`;

  shell(`${row.is_deleted ? `<div class="alert err" style="margin-bottom:18px">
      รายการนี้อยู่ใน Recycle bin — ลบเมื่อ ${dtstr(row.deleted_at)}</div>` : ""}
    ${hero}${jump}${sections}${children}${history}`, {
    crumb: `<a href="#${ent.route}">${esc(ent.plural)}</a> / ${esc(id)}`,
    heading: data.title || id,
    sub: `${esc(ent.label)} · ${esc(id)} · แก้ไขล่าสุด ${dtstr(row.updated_at)} โดย ${esc(row.updated_by)}`,
    actions: [
      `<a class="btn" href="#${ent.route}">‹ กลับรายการ</a>`,
      isAdmin() ? (row.is_deleted
        ? `<button class="btn primary" id="restore">กู้คืน</button>`
        : `<a class="btn primary" href="#${ent.route}/${id}/edit">✎ แก้ไข</a>
           <button class="btn danger" id="del">ลบ</button>`) : "",
    ].join(""),
  });

  $("#page").querySelectorAll("[data-jump]").forEach(a =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.jump)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));

  $("#page").querySelectorAll("tr[data-go]").forEach(tr =>
    tr.addEventListener("click", () => go(tr.dataset.go)));
  $("#del")?.addEventListener("click", async () => {
    if (!confirm(`ย้าย ${data.title || id} ไปที่ Recycle bin?`)) return;
    await api(`/api/e/${ent.key}/${id}`, { method: "DELETE" });
    toast("ย้ายไป Recycle bin แล้ว — กู้คืนได้จาก Governance");
    go(ent.route);
  });
  $("#restore")?.addEventListener("click", async () => {
    await api(`/api/e/${ent.key}/${id}/restore`, { method: "POST" });
    toast("กู้คืนแล้ว");
    route();
  });
}

// --------------------------------------------------------------------------
// Entity form
// --------------------------------------------------------------------------
async function renderForm(ent, id = null) {
  const mode = id ? "edit" : "new";
  shell(loading(), { heading: mode === "new" ? `New ${ent.label}` : `Edit ${id}` });

  const row = id ? (await api(`/api/e/${ent.key}/${id}`)).row : {};
  const preset = parseQuery();
  Object.entries(preset).forEach(([k, v]) => {
    if (ent.fields.some(f => f.name === k) && !row[k]) row[k] = v;
  });

  const refCache = {};
  for (const f of ent.fields.filter(f => f.type === "ref")) {
    const { options } = await api(`/api/refs/${f.ref}`);
    refCache[f.name] = options;
  }

  const groups = [];
  ent.fields.forEach(f => {
    let g = groups.find(x => x.name === f.group);
    if (!g) groups.push(g = { name: f.group, fields: [] });
    g.fields.push(f);
  });

  const control = (f) => {
    const v = row[f.name] ?? "";
    const common = `id="f_${f.name}" name="${f.name}"${f.required ? " required" : ""}`;
    if (f.type === "textarea")
      return `<textarea ${common} placeholder="${esc(f.placeholder)}">${esc(v)}</textarea>`;
    if (f.type === "select")
      return `<select ${common}><option value="">— เลือก —</option>${
        (f.options || []).map(o =>
          `<option${String(v) === String(o) ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    if (f.type === "ref")
      return `<select ${common}><option value="">— เลือก —</option>${
        (refCache[f.name] || []).map(o =>
          `<option value="${esc(o.id)}"${String(v) === String(o.id) ? " selected" : ""}
            >${esc(o.label)} · ${esc(o.id)}</option>`).join("")}</select>`;
    const type = f.type === "date" ? "date"
      : ["int", "money"].includes(f.type) ? "number" : "text";
    const step = f.type === "money" ? ' step="0.01"' : "";
    return `<input ${common} type="${type}"${step} value="${esc(f.type === "date" ? dstr(v) : v)}"
      placeholder="${esc(f.placeholder)}">`;
  };

  const fieldsets = groups.map((g, gi) => `<fieldset data-group="${esc(g.name)}" id="fs-${gi}">
    <h3 class="group-title">${esc(g.name)}</h3>
    <div class="form-grid">${g.fields.map(f => `
      <div class="field${f.type === "textarea" ? " full" : ""}" data-field="${f.name}"
           ${f.onlyFor ? `data-only-for="${esc(f.onlyFor)}"` : ""}>
        <label for="f_${f.name}">${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ""}</label>
        ${control(f)}
        ${f.help ? `<span class="hint">${esc(f.help)}</span>` : ""}
        <span class="hint err-msg" data-err="${f.name}" style="color:var(--danger);display:none"></span>
      </div>`).join("")}</div></fieldset>`).join("");

  shell(`${groups.length > 2 ? `<div class="jump">${groups.map((g, i) =>
      `<a href="#fs-${i}" data-jump="fs-${i}">${esc(g.name)}</a>`).join("")}</div>` : ""}
    <form id="entity-form" class="card"><div class="card-body">
      <div class="alert err" id="form-error" style="display:none;margin-bottom:16px"></div>
      ${fieldsets}
      <div class="form-actions">
        <span style="margin-right:auto;font-size:12.5px;color:var(--muted)">
          ช่องที่มี <span class="req">*</span> จำเป็นต้องกรอก</span>
        <a class="btn" href="#${id ? `${ent.route}/${id}` : ent.route}">ยกเลิก</a>
        <button class="btn primary" type="submit">${mode === "new" ? "บันทึก" : "บันทึกการแก้ไข"}</button>
      </div></div></form>`, {
    crumb: `<a href="#${ent.route}">${esc(ent.plural)}</a> / ${mode === "new" ? "new" : esc(id)}`,
    heading: mode === "new" ? `New ${ent.label}` : `Edit ${ent.label}`,
    sub: mode === "new" ? ent.desc : `แก้ไข ${id}`,
  });

  const form = $("#entity-form");
  $("#page").querySelectorAll("[data-jump]").forEach(a =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.jump)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));

  // discriminator — hide the fields that do not apply to the chosen type
  const applyDisc = () => {
    if (!ent.discriminator) return;
    const cur = form.elements[ent.discriminator]?.value || "";
    form.querySelectorAll("[data-only-for]").forEach(el => {
      const show = el.dataset.onlyFor === cur;
      el.style.display = show ? "" : "none";
      el.querySelectorAll("input,select,textarea").forEach(i => { i.disabled = !show; });
    });
    form.querySelectorAll("fieldset").forEach(fs => {
      const any = [...fs.querySelectorAll(".field")].some(f => f.style.display !== "none");
      fs.style.display = any ? "" : "none";
    });
  };
  if (ent.discriminator)
    form.elements[ent.discriminator]?.addEventListener("change", applyDisc);
  applyDisc();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.querySelectorAll(".err-msg").forEach(el => { el.style.display = "none"; });
    form.querySelectorAll(".field.bad").forEach(el => el.classList.remove("bad"));
    $("#form-error").style.display = "none";
    const payload = {};
    ent.fields.forEach(f => {
      const el = form.elements[f.name];
      if (!el || el.disabled) return;
      payload[f.name] = el.value;
    });
    try {
      if (mode === "new") {
        const { id: newId } = await api(`/api/e/${ent.key}`, {
          method: "POST", body: JSON.stringify(payload) });
        toast(`สร้าง ${newId} แล้ว`);
        go(`${ent.route}/${newId}`);
      } else {
        await api(`/api/e/${ent.key}/${id}`, {
          method: "PUT", body: JSON.stringify(payload) });
        toast("บันทึกแล้ว");
        go(`${ent.route}/${id}`);
      }
    } catch (err) {
      const errors = err.data?.errors;
      if (errors) {
        let first = null;
        Object.entries(errors).forEach(([k, msg]) => {
          const el = form.querySelector(`[data-err="${k}"]`);
          const box = form.querySelector(`[data-field="${k}"]`);
          box?.classList.add("bad");
          if (!first) first = box;
          if (el) { el.textContent = msg; el.style.display = ""; }
        });
        $("#form-error").textContent =
          `กรอกไม่ครบ ${Object.keys(errors).length} ช่อง — ดูช่องที่ขึ้นสีแดงด้านล่าง`;
        $("#form-error").style.display = "";
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        $("#form-error").textContent = err.message;
        $("#form-error").style.display = "";
      }
    }
  });
}

// --------------------------------------------------------------------------
// Dashboard
// --------------------------------------------------------------------------
async function renderDashboard() {
  shell(loading(), { heading: "Dashboard", sub: "สถานะทรัพย์สิน IT ทั้งหมดในหน้าเดียว" });
  const d = await api("/api/dashboard");
  const E = state.meta.entities;
  const totalValue = d.warranty.reduce((s, w) => s + Number(w.value || 0), 0);
  const expired = d.warranty.reduce((s, w) => s + w.expired, 0);
  const soon = d.warranty.reduce((s, w) => s + w.soon, 0);
  const missing = d.warranty.reduce((s, w) => s + w.missing, 0);

  $("#page").innerHTML = `
    <div class="stat-grid">
      <a class="stat ${expired ? "alert" : ""}" href="#/governance/warranty">
        <div class="stat-label">ประกันหมดอายุแล้ว</div><div class="stat-value">${expired}</div>
        <div class="stat-note">server + network hardware →</div></a>
      <a class="stat ${soon ? "warn" : ""}" href="#/governance/warranty">
        <div class="stat-label">ประกันหมดใน 90 วัน</div><div class="stat-value">${soon}</div>
        <div class="stat-note">ควรตั้งเรื่องต่อสัญญา →</div></a>
      <a class="stat ${missing ? "warn" : ""}" href="#${E.hardware.route}?chip=nodata">
        <div class="stat-label">ข้อมูลทรัพย์สินไม่ครบ</div><div class="stat-value">${missing}</div>
        <div class="stat-note">ไม่มีเลขครุภัณฑ์ หรือวันหมดประกัน →</div></a>
      <a class="stat" href="#${E.hardware.route}">
        <div class="stat-label">มูลค่าทรัพย์สินรวม</div>
        <div class="stat-value" style="font-size:24px">฿${money(totalValue)}</div>
        <div class="stat-note">${num(d.counts.hardware)} hardware · ${num(d.counts.network_devices)} network →</div></a>
    </div>

    <div class="stat-grid" style="margin-top:14px">
      <a class="stat" href="#${E.servers.route}"><div class="stat-label">Servers</div>
        <div class="stat-value">${num(d.counts.servers)}</div>
        <div class="stat-note">${num(d.counts.clusters)} cluster →</div></a>
      <a class="stat ${d.licenses.expired ? "alert" : ""}" href="#${E.licenses.route}?chip=expired">
        <div class="stat-label">Licence หมดอายุ</div><div class="stat-value">${d.licenses.expired}</div>
        <div class="stat-note">${d.licenses.expiring} ใบหมดใน 90 วัน →</div></a>
      <a class="stat ${d.licenses.overused ? "alert" : ""}" href="#${E.licenses.route}?chip=overused">
        <div class="stat-label">Licence ใช้เกินสิทธิ์</div><div class="stat-value">${d.licenses.overused}</div>
        <div class="stat-note">฿${money(d.licenses.spend)} ค่าลิขสิทธิ์รวม →</div></a>
      <a class="stat" href="#/permission"><div class="stat-label">Shared folders</div>
        <div class="stat-value">${num(d.counts.server_permissions)}</div>
        <div class="stat-note">${num(d.counts.ad_users)} AD user →</div></a>
    </div>

    <div class="two-col" style="margin-top:18px">
      <section class="card">
        <div class="card-head"><h2>ประกันหมดเร็วที่สุด</h2>
          <div class="right"><a class="btn small" href="#/governance/warranty">ทั้งหมด</a></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>อุปกรณ์</th><th>รุ่น</th><th style="width:170px">หมดประกัน</th></tr></thead>
          <tbody>${d.soonest.length ? d.soonest.map(r => `<tr class="clickable"
            data-go="${E[r.entity].route}/${r.id}">
            <td class="mono">${esc(r.name)}</td><td>${esc(r.detail || "—")}</td>
            <td>${warrantyCell(r.expiry)}</td></tr>`).join("")
            : `<tr><td colspan="3"><div class="empty">ยังไม่มีข้อมูลประกัน</div></td></tr>`}</tbody>
        </table></div></section>

      <section class="card">
        <div class="card-head"><h2>กิจกรรมล่าสุด</h2>
          <div class="right"><a class="btn small" href="#/governance/history">Change history</a></div></div>
        <div class="timeline">${d.recent.length ? d.recent.map(a => `<div class="timeline-row">
          <span class="timeline-when">${dtstr(a.ts)}</span>
          <div><b>${esc(a.username)}</b> ${esc(a.action)} ${esc(a.entity || "")}
            ${a.summary ? `<div style="color:var(--muted);font-size:12.5px">${esc(a.summary)}</div>` : ""}
          </div></div>`).join("") : `<div class="empty">ยังไม่มีกิจกรรม</div>`}</div></section>
    </div>`;
  $("#page").querySelectorAll("tr[data-go]").forEach(tr =>
    tr.addEventListener("click", () => go(tr.dataset.go)));
}

// --------------------------------------------------------------------------
// Permission control
// --------------------------------------------------------------------------
async function renderPermissionDashboard() {
  shell(loading(), { heading: "Permission dashboard" });
  const d = await api("/api/permission");
  const s = d.summary, E = state.meta.entities;

  shell(`
    <div class="stat-grid">
      <a class="stat" href="#${E.ad_users.route}"><div class="stat-label">AD users</div>
        <div class="stat-value">${num(s.users)}</div>
        <div class="stat-note">${num(s.ad_groups)} AD group · ${num(s.memberships)} membership</div></a>
      <a class="stat ${s.disabled ? "warn" : ""}" href="#${E.ad_users.route}?chip=disabled">
        <div class="stat-label">บัญชีถูก disable</div><div class="stat-value">${num(s.disabled)}</div>
        <div class="stat-note">${num(s.no_group)} บัญชีไม่มี AD group →</div></a>
      <a class="stat" href="#${E.server_permissions.route}"><div class="stat-label">Shared folders</div>
        <div class="stat-value">${num(s.folders)}</div>
        <div class="stat-note">บน ${num(s.file_servers)} File Server →</div></a>
      <a class="stat ${s.folders_no_group ? "alert" : ""}"
         href="#${E.server_permissions.route}?chip=nogroup">
        <div class="stat-label">Folder ที่ไม่มีกลุ่ม</div>
        <div class="stat-value">${num(s.folders_no_group)}</div>
        <div class="stat-note">ยังให้สิทธิ์ใครไม่ได้ →</div></a>
    </div>

    ${s.orphan_groups.length ? `<div class="alert err" style="margin-top:18px">
      <b>${s.orphan_groups.length} AD group ที่ folder อ้างถึงแต่ไม่มีในข้อมูล AD:</b>
      <span class="mono">${esc(s.orphan_groups.slice(0, 8).join(" · "))}${
        s.orphan_groups.length > 8 ? " …" : ""}</span>
      — อาจเป็น group เก่า หรือไฟล์ AD export ยังไม่ครบ</div>` : ""}

    <section class="card" style="margin-top:18px">
      <div class="card-head"><h2>Access check</h2>
        <div class="right" style="color:var(--muted);font-size:12.5px;align-self:center">
          คำนวณสดจาก AD membership × folder group</div></div>
      <div class="card-body">
        <form class="access-form" id="quick-access">
          <div class="access-mode">
            <a class="chip on" href="#/permission/access-check?mode=user">By user</a>
            <a class="chip" href="#/permission/access-check?mode=folder">By folder</a>
          </div>
          <div class="search" style="flex:1;min-width:240px"><span aria-hidden="true">⌕</span>
            <input id="qa" placeholder="User logon — เช่น somchai.p"></div>
          <button class="btn primary" type="submit">ตรวจสิทธิ์</button>
        </form>
      </div>
    </section>

    <div class="two-col" style="margin-top:18px">
      <section class="card">
        <div class="card-head"><h2>Folder แยกตามแผนก</h2>
          <div class="right"><a class="btn small" href="#${E.server_permissions.route}">ทั้งหมด</a></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>แผนก</th><th style="width:90px">Folders</th>
            <th style="width:110px">Quota</th><th style="width:120px">ไม่มีกลุ่ม</th></tr></thead>
          <tbody>${d.departments.length ? d.departments.map(x => `<tr>
            <td>${esc(x.department)}</td><td class="mono">${x.folders}</td>
            <td class="mono">${x.quota ? num(x.quota) + " GB" : "—"}</td>
            <td>${x.no_group ? `<span class="badge bad">${x.no_group}</span>`
              : `<span style="color:var(--muted)">—</span>`}</td></tr>`).join("")
            : `<tr><td colspan="4"><div class="empty">ยังไม่มี shared folder</div></td></tr>`}</tbody>
        </table></div></section>

      <section class="card">
        <div class="card-head"><h2>Folder ต่อ File Server</h2>
          <div class="right"><a class="btn small" href="#${E.servers.route}?chip=fileserver">File Servers</a></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Server</th><th style="width:90px">Folders</th></tr></thead>
          <tbody>${d.topServers.length ? d.topServers.map(x =>
            `<tr><td class="mono">${esc(x.server_name)}</td><td class="mono">${x.folders}</td></tr>`).join("")
            : `<tr><td colspan="2"><div class="empty">ยังไม่มี File Server ที่ผูก folder</div></td></tr>`}</tbody>
        </table></div></section>
    </div>

    <section class="card" style="margin-top:18px">
      <div class="card-head"><h2>กิจกรรม Permission ล่าสุด</h2>
        <div class="right"><a class="btn small" href="#/governance/history?entity=server_permissions">Change history</a></div></div>
      <div class="timeline">${d.recent.length ? d.recent.map(a => `<div class="timeline-row">
        <span class="timeline-when">${dtstr(a.ts)}</span>
        <div><b>${esc(a.username)}</b> ${esc(a.action)} ${esc(a.entity)}
          ${a.summary ? `<div style="color:var(--muted);font-size:12.5px">${esc(a.summary)}</div>` : ""}
        </div></div>`).join("") : `<div class="empty">ยังไม่มีการ import หรือแก้ไขสิทธิ์</div>`}</div>
    </section>`, {
    heading: "Permission dashboard",
    sub: "ภาพรวมสิทธิ์ shared folder — AD จาก directory, folder จาก File Server ใน Server list",
  });

  $("#quick-access").addEventListener("submit", (e) => {
    e.preventDefault();
    go(`/permission/access-check?mode=user&q=${encodeURIComponent($("#qa").value)}`);
  });
}

async function renderAccessCheck() {
  const q = parseQuery();
  shell(loading(), { heading: "Access check" });
  const d = await api(`/api/permission/access?mode=${q.mode || "user"}&q=${
    encodeURIComponent(q.q || "")}`);
  const E = state.meta.entities;
  const samples = d.mode === "user" ? d.samples.users : d.samples.folders;
  const r = d.result;

  let results = "";
  if (r && d.mode === "user") {
    results = `<div class="card-body" style="border-top:1px solid var(--border)">
      ${r.user ? `<div class="detail-grid" style="margin-bottom:16px">
        <div class="kv"><span class="kv-key">User</span><span class="kv-val">${
          esc(r.user.display_name || r.logon)} <span class="mono">(${esc(r.logon)})</span></span></div>
        <div class="kv"><span class="kv-key">แผนก / ตำแหน่ง</span><span class="kv-val">${
          esc(r.user.department || "—")}${r.user.job_title ? " · " + esc(r.user.job_title) : ""}</span></div>
        <div class="kv"><span class="kv-key">สถานะ</span><span class="kv-val"><span class="badge ${
          r.user.status === "Disabled" ? "mute" : "ok"}">${esc(r.user.status || "Enabled")}</span></span></div>
        <div class="kv"><span class="kv-key">AD groups</span><span class="kv-val">${r.groups.length}</span></div>
      </div>` : `<div class="alert err"><b>ไม่พบ “${esc(r.logon)}” ในข้อมูล AD</b>
        — ตรวจ logon อีกครั้ง หรือ import ไฟล์ AD_AllGroups ใหม่</div>`}
      ${r.groups.length ? `<div class="group-chips">${
        r.groups.map(g => `<span class="ad-chip">${esc(g)}</span>`).join("")}</div>` : ""}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Folder / path</th><th style="width:170px">Server</th>
        <th style="width:130px">สิทธิ์</th><th>ได้จากกลุ่ม</th><th style="width:100px">Quota</th></tr></thead>
      <tbody>${r.folders.length ? r.folders.map(f => `<tr>
        <td><a href="#${E.server_permissions.route}/${f.permission_id}">${esc(f.folder_name)}</a>
          ${f.folder_path ? `<div class="mono" style="color:var(--muted)">${esc(f.folder_path)}</div>` : ""}</td>
        <td class="mono">${esc(f.server_name || "—")}</td>
        <td class="nowrap"><span class="badge ${f.access === "Read/Write" ? "ok" : "info"}">${esc(f.access)}</span></td>
        <td class="mono" style="font-size:12px">${esc(f.via)}</td>
        <td class="mono">${f.quota_gb ? num(f.quota_gb) + " GB" : "—"}</td></tr>`).join("")
        : `<tr><td colspan="5"><div class="empty">บัญชีนี้ไม่มีสิทธิ์เข้า shared folder ใดผ่าน AD group</div></td></tr>`}
      </tbody></table></div>`;
  }
  if (r && d.mode === "folder") {
    results = r.folders.length ? r.folders.map(f => `
      <div class="card-body" style="border-top:1px solid var(--border)">
        <h3 class="group-title">${esc(f.folder_name)}</h3>
        <div class="detail-grid" style="margin-bottom:12px">
          <div class="kv"><span class="kv-key">Server</span><span class="kv-val mono">${esc(f.server_name || "—")}</span></div>
          <div class="kv"><span class="kv-key">Path</span><span class="kv-val mono">${esc(f.folder_path || "—")}</span></div>
          <div class="kv"><span class="kv-key">Read/Write group</span><span class="kv-val mono">${esc(f.rw_group || "—")}</span></div>
          <div class="kv"><span class="kv-key">Read only group</span><span class="kv-val mono">${esc(f.ro_group || "—")}</span></div>
          <div class="kv"><span class="kv-key">คนที่เข้าถึงได้</span><span class="kv-val">${f.people.length}</span></div>
        </div>
        <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--radius)"><table>
          <thead><tr><th>ผู้ใช้</th><th>แผนก</th><th style="width:130px">สิทธิ์</th>
            <th>ผ่านกลุ่ม</th><th style="width:110px">สถานะ</th></tr></thead>
          <tbody>${f.people.length ? f.people.map(p => `<tr>
            <td><a href="#/permission/access-check?mode=user&q=${encodeURIComponent(p.logon)}">${
              esc(p.display_name)}</a><div class="mono" style="color:var(--muted)">${esc(p.logon)}</div></td>
            <td>${esc(p.department || "—")}</td>
            <td class="nowrap"><span class="badge ${p.access === "Read/Write" ? "ok" : "info"}">${esc(p.access)}</span></td>
            <td class="mono" style="font-size:12px">${esc(p.via)}</td>
            <td class="nowrap"><span class="badge ${p.status === "Disabled" ? "mute" : "ok"}">${esc(p.status)}</span></td>
          </tr>`).join("") : `<tr><td colspan="5"><div class="empty">ไม่มีผู้ใช้ AD คนใดอยู่ในกลุ่มของ folder นี้</div></td></tr>`}
          </tbody></table></div></div>`).join("")
      : `<div class="empty">ไม่พบ folder ที่ตรงกับ “${esc(r.query)}”</div>`;
  }

  shell(`<section class="card">
    <div class="card-body">
      <form class="access-form" id="acc">
        <div class="access-mode">
          <a class="chip ${d.mode === "user" ? "on" : ""}"
             href="#/permission/access-check?mode=user${q.q ? "&q=" + encodeURIComponent(q.q) : ""}">By user</a>
          <a class="chip ${d.mode === "folder" ? "on" : ""}"
             href="#/permission/access-check?mode=folder${q.q ? "&q=" + encodeURIComponent(q.q) : ""}">By folder</a>
        </div>
        <div class="search" style="flex:1;min-width:240px"><span aria-hidden="true">⌕</span>
          <input id="accq" list="acc-list" value="${esc(d.q)}" autofocus
            placeholder="${d.mode === "user" ? "User logon — เช่น somchai.p" : "ชื่อ folder หรือ path"}"></div>
        <datalist id="acc-list">${samples.map(s => `<option value="${esc(s)}"></option>`).join("")}</datalist>
        <button class="btn primary" type="submit">ตรวจสิทธิ์</button>
      </form>
      <div class="access-samples"><span>ลอง:</span>
        ${samples.length ? samples.slice(0, 6).map(s =>
          `<a class="chip" href="#/permission/access-check?mode=${d.mode}&q=${
            encodeURIComponent(s)}">${esc(s)}</a>`).join("")
          : `<span style="color:var(--muted)">ยังไม่มีข้อมูล — ${isAdmin()
            ? `<a href="#/permission/import">import ไฟล์ AD และ folder</a>`
            : "ให้ผู้ดูแลระบบ import ก่อน"}</span>`}
      </div>
    </div>
    ${results}
  </section>`, {
    crumb: `<a href="#/permission">Permission dashboard</a> / access check`,
    heading: "Access check",
    sub: "ใครเข้าถึง shared folder ไหนได้บ้าง — คำนวณสดจาก AD membership × folder group",
    actions: `<a class="btn" href="#${state.meta.entities.ad_users.route}">AD Users</a>
      <a class="btn" href="#${state.meta.entities.server_permissions.route}">Server Permission</a>`,
  });

  $("#acc").addEventListener("submit", (e) => {
    e.preventDefault();
    go(`/permission/access-check?mode=${d.mode}&q=${encodeURIComponent($("#accq").value)}`);
  });
}

function renderImport(report = null) {
  if (!isAdmin()) { go("/permission"); return; }
  const rep = report ? `<section class="card" style="margin-bottom:18px">
    <div class="card-head"><h2>ผลการ import</h2></div>
    <div class="card-body">
      ${report.ad ? `<div class="alert" style="margin-bottom:10px">
        <b>AD — ${esc(report.ad.file)}</b>: อ่าน ${report.ad.rows} แถว ·
        เพิ่มใหม่ ${report.ad.created} · อัปเดต ${report.ad.updated} ·
        membership ใหม่ ${report.ad.groups} · ข้าม ${report.ad.skipped}</div>` : ""}
      ${report.perm ? `<div class="alert" style="margin-bottom:10px">
        <b>Folder — ${esc(report.perm.file)}</b>: อ่าน ${report.perm.rows} แถว ·
        เพิ่มใหม่ ${report.perm.created} · อัปเดต ${report.perm.updated} ·
        ข้าม ${report.perm.skipped}</div>` : ""}
      ${report.unknown_servers?.length ? `<div class="alert err">
        <b>ไม่พบ server เหล่านี้ใน Server list:</b>
        <span class="mono">${esc(report.unknown_servers.join(" · "))}</span> —
        เพิ่ม server (server role = File Server) ก่อนแล้ว import ใหม่</div>` : ""}
    </div></section>` : "";

  shell(`${rep}<form class="card" id="imp"><div class="card-body">
      <fieldset><h3 class="group-title">AD export (users + groups)</h3>
        <div class="form-grid"><div class="field full">
          <label for="ad_file">ไฟล์ AD_AllGroups (CSV / TSV)</label>
          <input type="file" id="ad_file" name="ad_file" accept=".csv,.tsv,.txt">
          <span class="hint">รับหัวคอลัมน์ทั้ง SamAccountName / UserLogon / DisplayName /
            Department / GroupName — หนึ่งแถวต่อ user × group</span>
        </div></div></fieldset>
      <fieldset><h3 class="group-title">Folder export (shared folders)</h3>
        <div class="form-grid"><div class="field full">
          <label for="perm_file">ไฟล์ Master_server (CSV / TSV)</label>
          <input type="file" id="perm_file" name="perm_file" accept=".csv,.tsv,.txt">
          <span class="hint">ต้องมีคอลัมน์ ServerName และ FolderName — ชื่อ server ต้องตรงกับ
            System name ใน Server list ที่ตั้ง Server role = File Server</span>
        </div></div></fieldset>
      <div class="form-actions">
        <a class="btn" href="#${state.meta.entities.ad_users.route}">ยกเลิก</a>
        <button class="btn primary" type="submit">เริ่ม import</button>
      </div></div></form>`, {
    crumb: `<a href="#/permission">Permission dashboard</a> /
      <a href="#${state.meta.entities.ad_users.route}">AD Users</a> / import`,
    heading: "Import AD / folders",
    sub: "อัปโหลดไฟล์ที่ AD และ File Server export ออกมาได้เลย — ระบบ map หัวคอลัมน์ให้เอง",
  });

  $("#imp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData();
    const ad = $("#ad_file").files[0], perm = $("#perm_file").files[0];
    if (!ad && !perm) return toast("เลือกไฟล์อย่างน้อยหนึ่งไฟล์", true);
    if (ad) fd.append("ad_file", ad);
    if (perm) fd.append("perm_file", perm);
    e.submitter.disabled = true;
    e.submitter.textContent = "กำลัง import…";
    try {
      const { report } = await api("/api/permission/import", { method: "POST", body: fd });
      toast("import เสร็จแล้ว");
      renderImport(report);
    } catch (err) {
      toast(err.message, true);
      e.submitter.disabled = false;
      e.submitter.textContent = "เริ่ม import";
    }
  });
}

// --------------------------------------------------------------------------
// Governance
// --------------------------------------------------------------------------
async function renderWarranty() {
  shell(loading(), { heading: "Warranty & assets" });
  const { rows } = await api("/api/governance/warranty");
  const E = state.meta.entities;
  const total = rows.reduce((s, r) => s + Number(r.price || 0), 0);
  shell(`<section class="card">
    <div class="card-head"><h2>ทะเบียนทรัพย์สินและประกัน</h2>
      <div class="right" style="align-self:center;color:var(--muted);font-size:12.5px">
        ${num(rows.length)} รายการ · มูลค่ารวม ฿${money(total)}</div></div>
    <div class="table-wrap"><table>
      <thead><tr><th>อุปกรณ์</th><th style="width:120px">เลขครุภัณฑ์</th><th>รุ่น</th>
        <th style="width:130px">มูลค่า</th><th style="width:170px">หมดประกัน</th>
        <th style="width:110px">EOL</th><th style="width:120px">สถานะ</th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr class="clickable" data-go="${E[r.entity].route}/${r.id}">
        <td class="mono">${esc(r.name)}</td>
        <td class="mono">${r.fixed_asset ? esc(r.fixed_asset) : `<span class="badge bad">ไม่ระบุ</span>`}</td>
        <td>${esc(r.model || "—")}</td>
        <td class="mono">${r.price ? "฿" + money(r.price) : "—"}</td>
        <td>${warrantyCell(r.warranty_expiry)}</td>
        <td class="mono">${dstr(r.eol_date) || "—"}</td>
        <td><span class="badge ${BADGE[r.status] || ""}">${esc(r.status || "—")}</span></td></tr>`).join("")
        : `<tr><td colspan="7"><div class="empty">ยังไม่มีข้อมูลทรัพย์สิน</div></td></tr>`}</tbody>
    </table></div></section>`, {
    heading: "Warranty & assets",
    sub: "ทุกอุปกรณ์ที่มีเลขครุภัณฑ์และวันหมดประกัน เรียงตามวันหมดประกัน",
  });
  $("#page").querySelectorAll("tr[data-go]").forEach(tr =>
    tr.addEventListener("click", () => go(tr.dataset.go)));
}

async function renderHistory() {
  const q = parseQuery();
  shell(loading(), { heading: "Change history" });
  const { rows } = await api(`/api/governance/history?entity=${q.entity || ""}`);
  const E = state.meta.entities;
  const options = Object.values(E).map(e =>
    `<option value="${e.key}"${q.entity === e.key ? " selected" : ""}>${esc(e.plural)}</option>`).join("");
  shell(`<section class="card">
    <div class="card-head"><h2>ทุกการเปลี่ยนแปลง</h2>
      <div class="right"><select id="entfilter" style="padding:6px 10px;border:1px solid var(--border);border-radius:6px">
        <option value="">ทุก entity</option>${options}</select></div></div>
    <div class="table-wrap"><table>
      <thead><tr><th style="width:150px">เวลา</th><th style="width:120px">ผู้แก้ไข</th>
        <th style="width:120px">การกระทำ</th><th style="width:150px">Entity</th>
        <th style="width:120px">Record</th><th>ฟิลด์ที่เปลี่ยน</th></tr></thead>
      <tbody>${rows.length ? rows.map(h => {
        let keys = []; try { keys = JSON.parse(h.changed_keys); } catch {}
        const ent = E[h.entity];
        return `<tr><td class="mono">${dtstr(h.changed_at)}</td><td>${esc(h.changed_by)}</td>
          <td><span class="badge ${h.action === "delete" ? "bad"
            : h.action === "create" ? "ok" : "info"}">${esc(h.action)}</span></td>
          <td>${esc(ent?.plural || h.entity)}</td>
          <td class="mono">${ent ? `<a href="#${ent.route}/${h.record_id}">${esc(h.record_id)}</a>`
            : esc(h.record_id)}</td>
          <td style="font-size:12.5px;color:var(--muted)">${esc(keys.join(", ")) || "—"}</td></tr>`;
      }).join("") : `<tr><td colspan="6"><div class="empty">ยังไม่มีประวัติ</div></td></tr>`}</tbody>
    </table></div></section>`, {
    heading: "Change history",
    sub: "ทุกการสร้าง แก้ไข ลบ และกู้คืน พร้อม snapshot ของข้อมูล ณ เวลานั้น",
  });
  $("#entfilter").addEventListener("change", (e) =>
    go("/governance/history" + (e.target.value ? "?entity=" + e.target.value : "")));
}

async function renderRecycle() {
  shell(loading(), { heading: "Recycle bin" });
  const { rows } = await api("/api/governance/recycle-bin");
  const E = state.meta.entities;
  shell(`<section class="card">
    <div class="card-head"><h2>รายการที่ถูกลบ</h2>
      <div class="right" style="align-self:center;color:var(--muted);font-size:12.5px">
        ${rows.length} รายการ — การลบเป็น soft delete เสมอ</div></div>
    <div class="table-wrap"><table>
      <thead><tr><th style="width:150px">ประเภท</th><th style="width:120px">ID</th><th>ชื่อ</th>
        <th style="width:150px">ลบเมื่อ</th><th style="width:120px">ลบโดย</th>
        <th style="width:110px"></th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr class="deleted">
        <td>${esc(r.entityLabel)}</td>
        <td class="mono"><a href="#${E[r.entity].route}/${r.id}">${esc(r.id)}</a></td>
        <td>${esc(r.title || "—")}</td>
        <td class="mono">${dtstr(r.deleted_at)}</td><td>${esc(r.deleted_by || "—")}</td>
        <td>${isAdmin() ? `<button class="btn small primary" data-restore="${r.entity}|${r.id}">กู้คืน</button>` : ""}</td>
      </tr>`).join("") : `<tr><td colspan="6"><div class="empty">ถังขยะว่าง</div></td></tr>`}</tbody>
    </table></div></section>`, {
    heading: "Recycle bin",
    sub: "ทุกอย่างที่ถูกลบยังอยู่ในฐานข้อมูล กู้คืนได้ตลอด",
  });
  $("#page").querySelectorAll("[data-restore]").forEach(btn =>
    btn.addEventListener("click", async () => {
      const [key, id] = btn.dataset.restore.split("|");
      await api(`/api/e/${key}/${id}/restore`, { method: "POST" });
      toast(`กู้คืน ${id} แล้ว`);
      route();
    }));
}

// --------------------------------------------------------------------------
// Administration
// --------------------------------------------------------------------------
async function renderUsers() {
  if (!isAdmin()) { go("/"); return; }
  shell(loading(), { heading: "Users" });
  const { rows } = await api("/api/admin/users");
  shell(`<section class="card">
    <div class="card-head"><h2>บัญชีผู้ใช้ระบบ</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th style="width:150px">Username</th><th>ชื่อ</th><th>Email</th>
        <th style="width:110px">สิทธิ์</th><th style="width:110px">สถานะ</th>
        <th style="width:150px">เข้าใช้ล่าสุด</th><th style="width:180px"></th></tr></thead>
      <tbody>${rows.map(u => `<tr>
        <td class="mono">${esc(u.username)}</td><td>${esc(u.display_name || "—")}</td>
        <td>${esc(u.email || "—")}</td>
        <td><span class="badge ${u.role === "admin" ? "ok" : "info"}">${esc(u.role)}</span></td>
        <td><span class="badge ${u.status === "Active" ? "ok" : "mute"}">${esc(u.status)}</span></td>
        <td class="mono">${dtstr(u.last_login) || "—"}</td>
        <td style="display:flex;gap:6px">
          <button class="btn small" data-pw="${u.user_id}">รีเซ็ตรหัส</button>
          <button class="btn small" data-role="${u.user_id}|${u.role}">สลับสิทธิ์</button>
          ${u.user_id !== state.user.user_id
            ? `<button class="btn small danger" data-del="${u.user_id}">ลบ</button>` : ""}
        </td></tr>`).join("")}</tbody>
    </table></div></section>

    <form class="card" id="newuser" style="margin-top:18px"><div class="card-body">
      <h3 class="group-title">เพิ่มผู้ใช้ใหม่</h3>
      <div class="form-grid">
        <div class="field"><label for="nu">Username <span class="req">*</span></label>
          <input id="nu" required placeholder="เช่น somchai.p"></div>
        <div class="field"><label for="nd">ชื่อที่แสดง</label><input id="nd"></div>
        <div class="field"><label for="ne">Email</label><input id="ne" type="email"></div>
        <div class="field"><label for="nr">สิทธิ์</label>
          <select id="nr"><option value="viewer">viewer — อ่านอย่างเดียว</option>
            <option value="admin">admin — แก้ไขได้ทุกอย่าง</option></select></div>
        <div class="field"><label for="np">รหัสผ่าน <span class="req">*</span></label>
          <input id="np" type="password" required minlength="6" placeholder="อย่างน้อย 6 ตัวอักษร"></div>
      </div>
      <div class="form-actions"><button class="btn primary" type="submit">สร้างผู้ใช้</button></div>
    </div></form>`, {
    heading: "Users", sub: "ผู้ใช้ระบบและสิทธิ์ — admin แก้ไข/import ได้ · viewer อ่านอย่างเดียว",
  });

  $("#newuser").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api("/api/admin/users", { method: "POST", body: JSON.stringify({
        username: $("#nu").value, display_name: $("#nd").value, email: $("#ne").value,
        role: $("#nr").value, password: $("#np").value }) });
      toast("สร้างผู้ใช้แล้ว");
      route();
    } catch (err) { toast(err.message, true); }
  });
  $("#page").querySelectorAll("[data-pw]").forEach(b => b.addEventListener("click", async () => {
    const pw = prompt("รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)");
    if (!pw) return;
    try {
      await api(`/api/admin/users/${b.dataset.pw}`, {
        method: "PUT", body: JSON.stringify({ password: pw }) });
      toast("รีเซ็ตรหัสผ่านแล้ว");
    } catch (err) { toast(err.message, true); }
  }));
  $("#page").querySelectorAll("[data-role]").forEach(b => b.addEventListener("click", async () => {
    const [id, cur] = b.dataset.role.split("|");
    await api(`/api/admin/users/${id}`, { method: "PUT",
      body: JSON.stringify({ role: cur === "admin" ? "viewer" : "admin" }) });
    toast("เปลี่ยนสิทธิ์แล้ว");
    route();
  }));
  $("#page").querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("ลบผู้ใช้นี้?")) return;
    await api(`/api/admin/users/${b.dataset.del}`, { method: "DELETE" });
    toast("ลบผู้ใช้แล้ว");
    route();
  }));
}

// --------------------------------------------------------------------------
// Router
// --------------------------------------------------------------------------
function route() {
  if (!state.user) return renderLogin();
  const raw = location.hash.replace(/^#/, "").split("?")[0] || "/";
  const path = raw.startsWith("/") ? raw : "/" + raw;

  const run = (p) => p.catch(err => {
    if (err.message === "unauthorised") return;
    console.error(err);
    shell(`<div class="card"><div class="empty">โหลดข้อมูลไม่สำเร็จ — ${esc(err.message)}</div></div>`,
      { heading: "เกิดข้อผิดพลาด" });
  });

  if (path === "/" || path === "/dashboard") return run(renderDashboard());
  if (path === "/permission") return run(renderPermissionDashboard());
  if (path === "/permission/access-check") return run(renderAccessCheck());
  if (path === "/permission/import") return renderImport();
  if (path === "/governance/warranty") return run(renderWarranty());
  if (path === "/governance/history") return run(renderHistory());
  if (path === "/governance/recycle-bin") return run(renderRecycle());
  if (path === "/admin/users") return run(renderUsers());

  const entities = Object.values(state.meta.entities)
    .sort((a, b) => b.route.length - a.route.length);
  for (const ent of entities) {
    if (path === ent.route) return run(renderList(ent));
    if (path === ent.route + "/new") return run(renderForm(ent));
    if (path.startsWith(ent.route + "/")) {
      const rest = path.slice(ent.route.length + 1);
      if (rest.endsWith("/edit")) return run(renderForm(ent, rest.slice(0, -5)));
      return run(renderDetail(ent, rest));
    }
  }
  shell(`<div class="card"><div class="empty">ไม่พบหน้านี้ — <a href="#/">กลับหน้าแรก</a></div></div>`,
    { heading: "404" });
}

window.addEventListener("hashchange", route);

(async function boot() {
  try {
    const { user } = await api("/api/me");
    if (!user) return renderLogin();
    state.user = user;
    state.meta = await api("/api/meta");
    try { state.counts = (await api("/api/counts")).counts; } catch { state.counts = {}; }
    route();
  } catch { renderLogin(); }
})();
