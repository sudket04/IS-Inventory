/* ---------------- Sidebar icons + nav config ---------------- */
function icon(inner) {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const ICONS = {
  dashboard: icon(`<path d="M3 12h4l2 7 4-14 2 7h6"/>`),
  serverHardware: icon(`<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><circle cx="7" cy="7" r="0.6" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r="0.6" fill="currentColor" stroke="none"/>`),
  clusters: icon(`<path d="M12 3 21 8 12 13 3 8Z"/><path d="M3 13l9 5 9-5"/>`),
  serverList: icon(`<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/>`),
  networkHardware: icon(`<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v5M12 12l-6 5M12 12l6 5"/>`),
  vlans: icon(`<path d="M4 9h16M4 15h16M9 4 7 20M17 4l-2 16"/>`),
  software: icon(`<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>`),
  license: icon(`<path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 13l2 2 4-4"/>`),
  permissionDashboard: icon(`<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z"/><path d="M9 12l2 2 4-4"/>`),
  accessCheck: icon(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.35-4.35"/>`),
  adUsers: icon(`<circle cx="9" cy="7" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M18.5 8v5M16 10.5h5"/>`),
  serverPermission: icon(`<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>`),
  warranty: icon(`<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z"/>`),
  history: icon(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2"/>`),
  recycleBin: icon(`<path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>`),
  locations: icon(`<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/>`),
  users: icon(`<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"/>`),
  databaseSetup: icon(`<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>`),
};
/* Sidebar structure — a section with an `id` is hidden/shown by applyPermissions() */
const NAV_SECTIONS = [
  { title: "Overview", items: [
    { table: "dashboard", icon: "dashboard", label: "Dashboard" },
  ] },
  { title: "Server", items: [
    { table: "hardware", icon: "serverHardware", label: "Server hardware" },
    { table: "clusters", icon: "clusters", label: "Clusters" },
    { table: "servers", icon: "serverList", label: "Server list" },
  ] },
  { title: "Network", items: [
    { table: "network_devices", icon: "networkHardware", label: "Network hardware" },
    { table: "vlans", icon: "vlans", label: "VLANs" },
  ] },
  { title: "Software", items: [
    { table: "software_dashboard", icon: "dashboard", label: "License Dashboard" },
    { table: "software_catalogue", icon: "software", label: "Software Catalogue" },
    { table: "software_licenses", icon: "license", label: "License Control" },
    { table: "software_allocations", icon: "license", label: "License Allocation" },
    { table: "software_master", icon: "software", label: "Category / Vendor / Metric" },
  ] },
  { title: "Permission Control", id: "permissionSection", items: [
    { table: "permission_dashboard", icon: "permissionDashboard", label: "Permission dashboard" },
    { table: "access_check", icon: "accessCheck", label: "Access check" },
    { table: "ad_users", icon: "adUsers", label: "AD Users" },
    { table: "server_permissions", icon: "serverPermission", label: "Server Permission" },
  ] },
  { title: "Governance", id: "governanceSection", items: [
    { table: "warranty_assets", icon: "warranty", label: "Warranty & assets" },
    { table: "ma_renewal_history", icon: "license", label: "MA / Renewal history" },
    { table: "change_history", icon: "history", label: "Change history" },
    { table: "recycle_bin", icon: "recycleBin", label: "Recycle bin" },
  ] },
  { title: "Reference", items: [
    { table: "locations", icon: "locations", label: "Locations & racks" },
  ] },
  { title: "Administration", id: "adminSection", items: [
    { table: "users", icon: "users", label: "Users" },
    { link: "setup.html", icon: "databaseSetup", label: "Database Setup" },
  ] },
];
function renderNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = NAV_SECTIONS.map(sec => `
    <div class="nav-section"${sec.id ? ` id="${sec.id}" hidden` : ""}>
      <div class="nav-section-title">${escapeHtml(sec.title)}</div>
      ${sec.items.map(item => item.link
        ? `<a class="nav-item nav-link" href="${escapeHtml(item.link)}"><span class="nav-icon">${ICONS[item.icon]}</span><span class="nav-label">${escapeHtml(item.label)}</span></a>`
        : `<button type="button" class="nav-item${item.table === state.activeTable ? " active" : ""}" data-table="${item.table}"><span class="nav-icon">${ICONS[item.icon]}</span><span class="nav-label">${escapeHtml(item.label)}</span></button>`
      ).join("")}
    </div>
  `).join("");
}

/* ---------------- Storage adapter ---------------- */
/* Talks to the Python backend (see app.py) for real persistence.
   Falls back to an in-memory store if the API is unreachable, so the page
   still works standalone (data just won't survive a reload in that case). */
const StorageAdapter = (function () {
  const memory = {};
  const LS_PREFIX = "inv::";
  function lsGet(key) {
    try { const v = localStorage.getItem(LS_PREFIX + key); return v === null ? undefined : v; }
    catch (e) { return undefined; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(LS_PREFIX + key, value); } catch (e) { /* quota / private mode */ }
  }
  async function get(key) {
    try {
      const res = await fetch("/api/data/" + encodeURIComponent(key));
      if (res.ok) {
        const body = await res.json();
        return body.value;
      }
      // Falls through to the local mirror below for a 404 too, not just a
      // thrown/network error — a 404 from a real backend saying "this key
      // has no row in app_kv yet" and a 404 from there being NO backend at
      // all (index.html opened via a plain static file server, or directly
      // as a file, with no app.py running) are indistinguishable from here.
      // Treating every 404 as authoritative "not found" used to make
      // seedData() re-run and silently overwrite previously-saved data on
      // every single page load whenever there was no backend — that's the
      // exact bug behind "I added a record and after reloading it's gone".
    } catch (e) {
      // fetch itself failed (network/CORS) — definitely no backend reachable
    }
    const fromLs = lsGet(key);
    if (fromLs !== undefined) return fromLs;
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
  }
  async function set(key, value) {
    memory[key] = value;   // in-memory mirror
    lsSet(key, value);     // durable mirror so data survives a page reload without a backend
    try {
      const res = await fetch("/api/data/" + encodeURIComponent(key), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("bad status " + res.status);
    } catch (e) { /* already mirrored above */ }
  }
  return { get, set };
})();

/* ---------------- Lookup values (mirrors the Lookup sheet) ---------------- */
const LOOKUPS = {
  HostingType: ["Virtual", "Physical"],
  HypervisorPlatform: ["Vmware", "Hyper-V", "Nutanix", "N/A"],
  InfrastructureType: [
    "3-Tier (SAN-based)",
    "HCI - Nutanix",
    "HCI - VMware vSAN",
    "HCI - Dell VxRail",
    "HCI - Cisco HyperFlex",
    "HCI - HPE SimpliVity",
    "HCI - Azure Stack HCI",
    "Other",
  ],
  Manufacturer: ["Dell", "HPE", "Lenovo", "Nutanix", "Other"],
  Criticality: ["Tier 1 (High)", "Tier 2 (Medium)", "Tier 3 (Low)"],
  StorageType: ["SSD", "HDD", "SAN", "NAS"],
  StorageUnit: ["GB", "TB"],
  Site: ["1st Site", "2nd Site"],
  // Shared network-zone vocabulary — used by Server List (server_zone),
  // VLAN (firewall_zone), and Network Inventory (network_zone) so the same
  // zone name means the same thing everywhere in the system.
  NetworkZone: ["Trust", "Untrust", "DMZ", "DMZ Internet", "DMZ Server", "Management", "Guest"],
  Environment: ["Production", "UAT", "Development", "DR"],
  Status: ["Active", "Maintenance", "Decommissioned", "Standby"],
  HardwareStatus: ["In Stock", "In Use", "Maintenance", "Decommissioned"],
  LocationLevel: ["Site", "Factory", "Floor", "Area", "Rack"],

  // VLAN
  DhcpEnabled: ["Yes", "No"],
  GatewayDevice: ["Core Switch", "Firewall", "Router", "Other"],

  // Network Device
  DeviceStatus: ["Use", "Standby", "Decommissioned"],
  StackRole: ["Member", "Active", "Standby"],
  DeviceRole: ["L2", "L3"],
  NetworkBrand: ["Cisco", "HPE", "Huawei", "Fortinet", "Other"],

  // AD Users (Permission Control)
  AdUserStatus: ["Enabled", "Disabled"],

  // Server Permission — folder classification level
  PermissionLevel: ["Section", "Top Secret", "Secret", "Confidential", "Special"],
};

/* Stack ID choices: ST001-ST100, generated rather than typed by hand. */
const STACK_ID_OPTIONS = Array.from({ length: 100 }, (_, i) => `ST${String(i + 1).padStart(3, "0")}`);

/* Windows Server versions: latest release year first, Datacenter edition
   before Standard within the same year (per explicit request). */
const WINDOWS_OS_VERSIONS = (() => {
  const releases = ["2025", "2022", "2019", "2016", "2012 R2", "2012", "2008 R2", "2008"];
  const editions = ["Datacenter", "Standard"];
  const list = [];
  releases.forEach(r => editions.forEach(e => list.push(`Windows Server ${r} ${e}`)));
  return list;
})();
const LINUX_OS_VERSIONS = [
  "Ubuntu Server 24.04 LTS", "Ubuntu Server 22.04 LTS", "Ubuntu Server 20.04 LTS",
  "Red Hat Enterprise Linux 9", "Red Hat Enterprise Linux 8",
  "Rocky Linux 9", "Rocky Linux 8",
  "CentOS Linux 8", "CentOS Linux 7",
  "Debian 12", "Debian 11",
];

/* Editable "catalogs" — curated pick-lists that can be extended on the fly
   via a "+ Add" button (an Admin/User adding a value persists it for every
   later selection, everywhere that catalog is used). Numeric catalogs exist
   so RAM/CPU/Storage can only be set to values that are actually sold,
   instead of free-typed numbers. */
const DEFAULT_CATALOGS = {
  server_roles: [
    "Web Server", "Application Server", "Database Server", "File Server",
    "Domain Controller", "DNS Server", "DHCP Server", "Mail Server",
    "Backup Server", "Monitoring Server", "Proxy Server", "Print Server",
  ],
  ram_gb: [8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024],
  cpu_cores: [1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64],
  storage_gb: [120, 128, 240, 250, 256, 480, 500, 512, 600, 800, 960, 1024],
  storage_tb: [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 30, 32, 40, 48, 64, 96, 128],
  os_version_windows: WINDOWS_OS_VERSIONS,
  os_version_linux: LINUX_OS_VERSIONS,
  os_version_other: [],
  software_category: [
    "Operating System", "Database", "Virtualization", "Backup & Recovery", "Security",
    "Network Management", "Monitoring", "Productivity", "Development", "Middleware",
    "Application", "Utility", "Cloud Service",
  ],
  software_type: [
    "Operating System", "Database", "Virtualization", "Backup & Recovery", "Security",
    "Network Management", "Monitoring", "Application", "Development", "Middleware",
    "Utility", "Cloud Service",
  ],
  license_metric: [
    "Per Device", "Per User", "Per Core", "Per CPU", "Per Socket", "Per VM", "Per Host",
    "Per TB", "Per Instance", "Per Site", "Per Concurrent User", "Per Installation",
    "Per Workload", "Server + CAL", "Unlimited",
  ],
  license_type: [
    "Perpetual", "Subscription", "OEM", "Open Source", "Freeware", "Trial",
    "Evaluation", "Enterprise Agreement", "Volume License",
  ],
};
const NUMERIC_CATALOGS = new Set(["ram_gb", "cpu_cores", "storage_gb", "storage_tb"]);
let CATALOGS = {};
Object.keys(DEFAULT_CATALOGS).forEach(k => { CATALOGS[k] = DEFAULT_CATALOGS[k].slice(); });
function getCatalog(key) { return CATALOGS[key] || []; }
async function loadCatalogs() {
  const raw = await StorageAdapter.get("inv_catalogs");
  if (raw) {
    try {
      const obj = JSON.parse(raw);
      Object.keys(DEFAULT_CATALOGS).forEach(k => { if (Array.isArray(obj[k]) && obj[k].length) CATALOGS[k] = obj[k]; });
    } catch (e) {}
  }
  // Migrate the legacy Server Role storage key used before catalogs existed.
  const legacyRoles = await StorageAdapter.get("inv_server_roles");
  if (legacyRoles) {
    try { const arr = JSON.parse(legacyRoles); if (Array.isArray(arr) && arr.length) CATALOGS.server_roles = arr; } catch (e) {}
  }
}
async function persistCatalogs() { await StorageAdapter.set("inv_catalogs", JSON.stringify(CATALOGS)); }
async function addCatalogValue(catalogKey, rawValue) {
  const v = String(rawValue || "").trim();
  if (!v) return false;
  if (NUMERIC_CATALOGS.has(catalogKey)) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return false; // catalogs of real-world sizes can't hold zero/negative/non-numeric values
  }
  const opts = CATALOGS[catalogKey] || (CATALOGS[catalogKey] = []);
  if (opts.some(o => String(o).toLowerCase() === v.toLowerCase())) return v; // already present
  opts.push(v);
  await persistCatalogs();
  return v;
}

/* ---------------- Network Device Category -> Subcategory cascade ---------------- */
const NETWORK_CATEGORIES = {
  "Network Device": ["Router", "Switch", "Core Switch", "Distribution Switch", "Access Switch", "Access Point (AP)", "Wireless Controller", "SD-WAN"],
  "Network Security Device": ["Firewall", "NGFW", "IDS", "IPS", "TippingPoint", "WAF", "NAC", "DDoS Protection"],
  "VPN / Remote Access": ["Ivanti Connect Secure (VPN)"],
  "Network Service / Server": ["DNS Server", "DHCP Server", "Proxy Server", "NTP Server", "RADIUS Server", "LDAP/AD"],
  "Network Management": ["SolarWinds"],
  "Monitoring & Logging": ["ArcSight"],
};

/* ---------------- Site -> Location -> Rack cascade ---------------- */
/* Each site has its own set of location choices (ending with "Other" for a
   free-typed value). Only locations with a defined rack list get a rack
   dropdown — everything else (incl. "Other") falls back to free text.
   Only the Hardware table uses this cascade now — Server Host and Server
   List both reference a Hardware record instead of storing this directly. */
const SITE_LOCATIONS = {
  "1st Site": {
    locations: ["Server Room", "UPS Room2", "Other"],
    racks: {
      "Server Room": Array.from({ length: 14 }, (_, i) => `R-${String(i + 1).padStart(2, "0")}`),
      "UPS Room2": Array.from({ length: 3 }, (_, i) => `R-${String(i + 1).padStart(2, "0")}`),
    },
  },
  "2nd Site": {
    locations: ["Server", "Other"],
    racks: {},
  },
};

/* ---------------- App state ---------------- */
const state = {
  data: {
    clusters: [], hardware: [], servers: [], locations: [], vlans: [], network_devices: [], users: [],
    server_permissions: [], ad_users: [],
    software_catalogue: [], software_licenses: [], software_allocations: [],
    audit_log: [], recycle_bin: [], ad_memberships: [], record_versions: [],   // not TABLES-driven — see EXTRA_STORAGE / logChange / moveToRecycleBin
  },
  session: null,       // { user_id, username, role, full_name } once signed in
  activeTable: "dashboard",
  editing: null,        // { tableKey, id }
  serverFilter: "all",  // "all" | "Virtual" | "Physical" — view filter on Server List table
  hardwareFilter: "all", // "all" | "Server" | "Storage" — view filter on Hardware table
  networkCategoryFilter: "all", // "all" | one of NETWORK_CATEGORIES keys — view filter on Network Inventory table
  tableUI: {},           // tableKey -> { sortKey, sortDir, filters: {colKey: Set<string>}, page, pageSize }
};

function getTableUI(tableKey) {
  if (!state.tableUI[tableKey]) {
    state.tableUI[tableKey] = { sortKey: null, sortDir: 1, filters: {}, page: 1, pageSize: 5 };
  }
  return state.tableUI[tableKey];
}

/* ---------------- Lookup helpers (cross-table display) ---------------- */
function clusterNameFor(clusterId) {
  const c = state.data.clusters.find(c => c.cluster_id === clusterId);
  return c ? c.cluster_name : "";
}
function hardwareLabelFor(hardwareId) {
  const hw = state.data.hardware.find(h => h.hardware_id === hardwareId);
  if (!hw) return "-";
  return `${hw.manufacturer || ""} ${hw.model || ""}`.trim() || hw.serial_number || hardwareId;
}
function costCenterFor(hardwareId) {
  const hw = state.data.hardware.find(h => h.hardware_id === hardwareId);
  return hw ? (hw.cost_center || "") : "";
}
/* One-line spec summary for a Server-type Hardware record, shared by the
   Hardware "Specs" list column and Server List's Physical-only derived
   "Specs (auto from Hardware)" field. */
function formatHardwareSpecsText(hw) {
  if (!hw) return "";
  return [
    hw.cpu || "",
    hw.cpu_cores ? `${hw.cpu_cores} cores` : "",
    hw.memory_gb ? `${hw.memory_gb}GB RAM` : "",
    hw.storage_capacity ? `${hw.storage_capacity}${hw.storage_unit || "GB"} ${hw.storage_drive_type || ""}`.trim() : "",
  ].filter(Boolean).join(" · ");
}
function serverNameFor(serverId) {
  const s = state.data.servers.find(s => s.server_id === serverId);
  return s ? s.system_name : "-";
}

/* ---------------- Location hierarchy helpers (Site > Factory > Floor > Area) ---------------- */
function locationsByLevel(level) {
  return state.data.locations.filter(l => l.level === level);
}
function locationNameFor(id) {
  const l = state.data.locations.find(l => l.location_id === id);
  return l ? l.name : "";
}
function locationParentPath(record) {
  if (!record.parent_id) return record.name || "";
  const chain = [record.name];
  let current = state.data.locations.find(l => l.location_id === record.parent_id);
  while (current) {
    chain.unshift(current.name);
    current = current.parent_id ? state.data.locations.find(l => l.location_id === current.parent_id) : null;
  }
  return chain.join(" > ");
}
/* Full "Site > Factory > Floor > Area" label for any location_id — used
   wherever another table (e.g. Network Device) references a Location. */
function locationFullPathFor(id) {
  const l = state.data.locations.find(l => l.location_id === id);
  if (!l) return "-";
  return locationParentPath(l);
}
function validateLocation(values, excludeId) {
  const errors = [];
  if (!values.name || !values.level) return errors; // required-field check handles the message
  const parentId = values.parent_site || values.parent_factory || values.parent_floor || values.parent_area || null;
  const dup = state.data.locations.some(l =>
    l.location_id !== excludeId &&
    l.level === values.level &&
    (l.parent_id || null) === (parentId || null) &&
    l.name.trim().toLowerCase() === values.name.trim().toLowerCase()
  );
  if (dup) errors.push(`A ${values.level} named "${values.name}" already exists under the same parent`);
  return errors;
}

/* ---------------- IPv4 / subnet math helpers ---------------- */
/* Converts "192.168.1.10" -> 3232235786 (32-bit unsigned integer), or NaN if invalid. */
function ipToInt(ip) {
  if (!isValidIPv4(ip)) return NaN;
  return ip.trim().split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}
function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}
/* Subnet mask (255.255.255.0) -> CIDR prefix length (24), or null if not a valid contiguous mask. */
function maskToCidr(mask) {
  const n = ipToInt(mask);
  if (Number.isNaN(n)) return null;
  // count leading 1 bits; a valid mask has all 1s then all 0s
  let ones = 0;
  let seenZero = false;
  for (let i = 31; i >= 0; i--) {
    const bit = (n >>> i) & 1;
    if (bit === 1) {
      if (seenZero) return null; // 1 after a 0 -> not contiguous, invalid mask
      ones++;
    } else {
      seenZero = true;
    }
  }
  return ones;
}
/* Given network address + subnet mask, returns { networkInt, broadcastInt, firstUsable, lastUsable, usableLabel } or null if invalid. */
function subnetRangeFor(networkAddress, subnetMask) {
  const cidr = maskToCidr(subnetMask);
  const netInt = ipToInt(networkAddress);
  if (cidr === null || Number.isNaN(netInt)) return null;
  const hostBits = 32 - cidr;
  const size = hostBits >= 31 ? (hostBits === 32 ? 1 : 2) : Math.pow(2, hostBits);
  const broadcastInt = (netInt + size - 1) >>> 0;
  const firstUsable = hostBits <= 1 ? netInt : netInt + 1;
  const lastUsable = hostBits <= 1 ? broadcastInt : broadcastInt - 1;
  return {
    networkInt: netInt,
    broadcastInt,
    firstUsable,
    lastUsable,
    usableLabel: hostBits <= 1 ? `${intToIp(netInt)}` : `${intToIp(firstUsable)}–${intToIp(lastUsable)}`,
  };
}
/* Is `ip` within the usable range of the given network/mask? */
function ipInSubnet(ip, networkAddress, subnetMask) {
  const range = subnetRangeFor(networkAddress, subnetMask);
  const ipInt = ipToInt(ip);
  if (!range || Number.isNaN(ipInt)) return false;
  return ipInt >= range.firstUsable && ipInt <= range.lastUsable;
}
/* Do two inclusive IP ranges [aStart,aEnd] and [bStart,bEnd] overlap? */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const a1 = ipToInt(aStart), a2 = ipToInt(aEnd), b1 = ipToInt(bStart), b2 = ipToInt(bEnd);
  if ([a1, a2, b1, b2].some(Number.isNaN)) return false;
  return a1 <= b2 && b1 <= a2;
}
const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
function isValidMac(value) {
  return MAC_RE.test(String(value || "").trim());
}
function filterMacKeystroke(el) {
  el.addEventListener("input", () => {
    const cleaned = el.value.replace(/[^0-9A-Fa-f:-]/g, "");
    if (cleaned !== el.value) el.value = cleaned;
  });
}

/* ---------------- Table / field configuration ---------------- */
/* Fields with `onlyFor: "Virtual"` or `onlyFor: "Physical"` only appear
   (and only get saved) once the record's Hosting type matches. Fields with
   no `onlyFor` are common to both and always shown. */
const TABLES = {
  hardware: {
    key: "hardware", label: "Inventory", desc: "All physical assets — choose Server or Storage type when adding a record; the form shows only the relevant fields",
    idField: "hardware_id", idPrefix: "HW", storageKey: "inv_hardware",
    discriminatorKey: "asset_type",
    listColumns: [
      { key: "asset_type", label: "Type", render: r => typeBadge(r.asset_type) },
      { key: "identity", label: "Details", render: r => (r.asset_type === "Storage" ? (r.storage_name || "-") : `${r.manufacturer || "-"} ${r.model || ""}`.trim()) },
      { key: "serial_number", label: "Serial number", mono: true },
      { key: "specs", label: "Specs", render: r => r.asset_type === "Server" ? escapeHtml(formatHardwareSpecsText(r)) || "-" : "-" },
      { key: "ma_expiry_date", label: "MA", render: r => r.ma_expiry_date ? statusBadge(warrantyStatus(r.ma_expiry_date)) : "-" },
      { key: "site", label: "Site" },
      { key: "rack_number", label: "Rack" },
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
    ],
    fields: [
      { key: "asset_type", label: "Asset type", type: "select", options: ["Server", "Storage"], required: true, group: "Identity" },

      // Storage-only identity
      { key: "storage_name", label: "Storage name", type: "text", onlyFor: "Storage", required: true, group: "System Info" },
      { key: "storage_array_type", label: "Storage Array Type", type: "select", options: ["SAN", "NAS", "DAS", "Other"], onlyFor: "Storage", required: true, group: "System Info" },
      { key: "capacity_gb", label: "Total capacity (GB)", type: "number", onlyFor: "Storage", group: "System Info" },

      // Common identity
      { key: "manufacturer", label: "Manufacturer", type: "select", options: LOOKUPS.Manufacturer, required: true, group: "System Info" },
      { key: "model", label: "Model", type: "text", group: "System Info" },
      { key: "serial_number", label: "Serial number", type: "text", required: true, group: "System Info" },

      // Server-only specifications — CPU/RAM/Storage are catalogs of values that
      // are actually sold, not free-typed numbers, so bad data (e.g. "5 GB RAM")
      // can't get in. "+ Add" extends the catalog permanently when a genuinely
      // new size is needed.
      { key: "cpu", label: "CPU", type: "text", onlyFor: "Server", required: true, placeholder: "e.g. 2x Intel Xeon Silver 4314", group: "Specifications" },
      { key: "cpu_cores", label: "CPU cores", type: "selectAddable", onlyFor: "Server", required: true, catalogKey: "cpu_cores",
        addButtonLabel: "+ Add", addButtonTitle: "Add a new CPU core count", addPromptLabel: "Add a new CPU core count:", group: "Specifications" },
      { key: "memory_gb", label: "Memory (GB)", type: "selectAddable", onlyFor: "Server", required: true, catalogKey: "ram_gb",
        addButtonLabel: "+ Add", addButtonTitle: "Add a new RAM size (GB)", addPromptLabel: "Add a new RAM size (GB):", group: "Specifications" },
      { key: "storage_unit", label: "Storage unit", type: "select", options: LOOKUPS.StorageUnit, onlyFor: "Server", required: true, group: "Specifications" },
      { key: "storage_capacity", label: "Storage capacity", type: "selectAddable", onlyFor: "Server", required: true,
        catalogKey: () => (getLiveValue("storage_unit") === "TB" ? "storage_tb" : "storage_gb"),
        addButtonLabel: "+ Add", addButtonTitle: "Add a new storage size", addPromptLabel: "Add a new storage size:", group: "Specifications" },
      { key: "storage_drive_type", label: "Storage drive type", type: "select", options: LOOKUPS.StorageType, onlyFor: "Server", required: true, group: "Specifications" },

      // Server-only network (switch port)
      { key: "port_no", label: "Switch port", type: "text", onlyFor: "Server", placeholder: "e.g. Gi1/0/1", group: "Network" },
      { key: "port_name", label: "Switch name", type: "text", onlyFor: "Server", placeholder: "e.g. SW-Core-01", group: "Network" },

      // Storage-only usage — repeatable: a storage array can serve more than one Cluster/Server
      { key: "used_with", label: "Used With (Cluster / Server)", type: "multiSelect", onlyFor: "Storage", required: true, group: "Network",
        dynamicOptions: () => [
          ...state.data.clusters.map(c => ({ value: `cluster:${c.cluster_name}`, label: `[Cluster] ${c.cluster_name}` })),
          ...state.data.servers.map(s => ({ value: `server:${s.system_name}`, label: `[Server] ${s.system_name} (${s.hosting_type})` })),
        ] },

      // Common location (Site -> Location -> Rack cascade)
      { key: "site", label: "Site", type: "select", options: LOOKUPS.Site, required: true, group: "Location" },
      { key: "location", label: "Location", type: "locationCascade", dynamicOptions: () => (SITE_LOCATIONS[getLiveValue("site")] || {}).locations || null, group: "Location" },
      { key: "rack_number", label: "Rack number", type: "select", dynamicOptions: () => {
          const rackList = (SITE_LOCATIONS[getLiveValue("site")] || {}).racks || {};
          const list = rackList[getLiveValue("location")];
          return list ? list.map(v => ({ value: v, label: v })) : null;
        }, group: "Location" },
      { key: "u_position", label: "U position", type: "text", group: "Location" },

      { key: "commission_date", label: "Commission date", type: "date", group: "Lifecycle" },
      { key: "warranty_years", label: "Warranty period (years)", type: "select", options: ["1", "2", "3", "4", "5"], group: "Lifecycle" },
      { key: "warranty_expiry", label: "Warranty expiry (vendor, auto)", type: "date", locked: true, group: "Lifecycle" },
      { key: "status", label: "Status", type: "select", options: LOOKUPS.HardwareStatus, required: true, group: "Lifecycle" },

      // MA (Maintenance Agreement) — a recurring support contract, separate
      // from the one-time vendor warranty above. Locked to read-only here;
      // only the "Renew MA" button (Actions column) can set/renew it, so
      // every renewal is captured in ma_renewal_history for cost audit.
      { key: "ma_contract_no", label: "MA Contract No.", type: "lockedText", group: "Maintenance Agreement (use the Renew MA button)" },
      { key: "ma_provider", label: "MA Provider", type: "lockedText", group: "Maintenance Agreement (use the Renew MA button)" },
      { key: "ma_expiry_date", label: "MA Expiry date", type: "lockedText", group: "Maintenance Agreement (use the Renew MA button)" },
      { key: "ma_cost", label: "MA Cost (THB, latest)", type: "lockedText", group: "Maintenance Agreement (use the Renew MA button)" },

      { key: "owner", label: "Owner", type: "text", group: "Other" },
      { key: "cost_center", label: "Cost Center", type: "text", placeholder: "e.g. IT-CC-1001", group: "Other" },
      { key: "remarks", label: "Remarks", type: "textarea", group: "Other" },
    ],
  },

  clusters: {
    key: "clusters", label: "Cluster", desc: "A group of Hosts/Nodes running hypervisor together — add each Host/Node with its Hardware (S/N) and IP details",
    idField: "cluster_id", idPrefix: "CLU", storageKey: "inv_clusters",
    listColumns: [
      { key: "cluster_name", label: "Cluster name", mono: true },
      { key: "hypervisor_platform", label: "Hypervisor" },
      { key: "infrastructure_type", label: "Architecture" },
      { key: "node_count", label: "Host/Node", render: r => `${(r.nodes || []).length} node(s)` },
      { key: "criticality", label: "Criticality" },
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
    ],
    fields: [
      { key: "cluster_name", label: "Cluster name", type: "text", required: true, group: "System Info" },
      { key: "hypervisor_platform", label: "Hypervisor", type: "select", options: LOOKUPS.HypervisorPlatform, required: true, group: "System Info" },
      { key: "infrastructure_type", label: "Infrastructure architecture", type: "select", options: LOOKUPS.InfrastructureType, required: true, group: "System Info" },
      { key: "management_console", label: "IP Management Console (e.g. vCenter)", type: "ip", placeholder: "e.g. 192.168.1.5", group: "System Info" },

      { key: "nodes", label: "Host / Node", type: "nodeList", required: true, group: "Host / Node" },

      { key: "criticality", label: "Criticality", type: "select", options: LOOKUPS.Criticality, required: true, group: "Lifecycle" },
      { key: "environment", label: "Environment", type: "select", options: LOOKUPS.Environment, required: true, group: "Lifecycle" },
      { key: "status", label: "Status", type: "select", options: LOOKUPS.Status, required: true, group: "Lifecycle" },

      { key: "owner", label: "Owner", type: "text", group: "Other" },
      { key: "remarks", label: "Remarks", type: "textarea", group: "Other" },
    ],
  },


  servers: {
    key: "servers", label: "Server List", desc: "Overview of all servers — choose Virtual Machine or Physical Server when adding a record; the form shows only the fields relevant to that type",
    idField: "server_id", idPrefix: "SRV", storageKey: "inv_servers",
    discriminatorKey: "hosting_type",
    listColumns: [
      { key: "hosting_type", label: "Type", render: r => typeBadge(r.hosting_type) },
      { key: "system_name", label: "System name", mono: true },
      { key: "ip_address", label: "IP address", mono: true },
      { key: "service_port", label: "Service port", mono: true },
      { key: "context", label: "Cluster / Hardware", render: r => (r.hosting_type === "Virtual" ? (r.cluster_name || "-") : hardwareLabelFor(r.hardware_id)) },
      { key: "cost_center", label: "Cost Center", render: r => (r.hosting_type === "Physical" ? (costCenterFor(r.hardware_id) || "-") : "-") },
      { key: "environment", label: "Environment" },
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
    ],
    fields: [
      // Type selector — drives which fields below appear and get saved
      { key: "hosting_type", label: "Hosting type", type: "select", options: LOOKUPS.HostingType, required: true, group: "Identity" },

      // Virtual-only
      { key: "host_ref", label: "Host", type: "select", onlyFor: "Virtual", required: true, group: "System Info",
        dynamicOptions: () => {
          const opts = [];
          state.data.clusters.forEach(c => (c.nodes || []).forEach(n => {
            opts.push({ value: `${c.cluster_id}::${n.node_id}`, label: `${n.host_name || "(no name)"} — ${c.cluster_name}` });
          }));
          return opts;
        } },
      { key: "cluster_name", label: "Cluster name (auto from Host)", type: "derivedText", onlyFor: "Virtual", dependsLabel: "Host", required: true, group: "System Info" },

      // Physical-only
      { key: "hardware_id", label: "Hardware", type: "select", onlyFor: "Physical", required: true, group: "System Info",
        dynamicOptions: () => state.data.hardware.filter(h => h.asset_type === "Server").map(h => ({ value: h.hardware_id, label: `${hardwareLabelFor(h.hardware_id)} — ${h.serial_number || "-"}` })) },
      { key: "hardware_cost_center", label: "Cost Center (auto from Hardware)", type: "derivedText", onlyFor: "Physical", dependsLabel: "Hardware", group: "System Info" },

      // Common — system identity
      { key: "system_group", label: "System group", type: "text", group: "System Info" },
      { key: "system_name", label: "System name", type: "text", required: true, group: "System Info" },
      { key: "server_name", label: "Server Name", type: "text", required: true, group: "System Info" },
      { key: "os_type", label: "OS Type", type: "select", options: ["Windows", "Linux", "Other"], group: "System Info" },
      { key: "os_version", label: "OS Version", type: "selectAddable", group: "System Info",
        catalogKey: () => {
          const t = getLiveValue("os_type");
          return t === "Windows" ? "os_version_windows" : t === "Linux" ? "os_version_linux" : "os_version_other";
        },
        addButtonLabel: "+ Add OS", addButtonTitle: "Add a new OS Version", addPromptLabel: "Add a new OS Version:" },
      { key: "server_role", label: "Server Role", type: "selectAddable", catalogKey: "server_roles",
        addButtonLabel: "+ Role", addButtonTitle: "Add a new Server Role", addPromptLabel: "Add a new Server Role:", group: "System Info" },

      // Common — network
      { key: "ip_address", label: "IP address", type: "ip", required: true, group: "Network" },
      { key: "ip_management", label: "IP Address (iDRAC/iLO)", type: "ip", onlyFor: "Physical", placeholder: "e.g. 192.168.1.100", group: "Network" },
      { key: "service_port", label: "Service port (TCP)", type: "text", placeholder: "e.g. 443, 8080", group: "Network" },
      { key: "server_zone", label: "Server zone", type: "select", options: LOOKUPS.NetworkZone, required: true, group: "Network" },

      // Virtual-only — vCPU/vRAM/vDisk are set by hand (no physical hardware to
      // derive them from), but still catalog-backed so values stay realistic.
      { key: "cpu_cores", label: "CPU cores", type: "selectAddable", onlyFor: "Virtual", required: true, catalogKey: "cpu_cores",
        addButtonLabel: "+ Add", addButtonTitle: "Add a new CPU core count", addPromptLabel: "Add a new CPU core count:", group: "Hardware" },
      { key: "ram_gb", label: "RAM (GB)", type: "selectAddable", onlyFor: "Virtual", required: true, catalogKey: "ram_gb",
        addButtonLabel: "+ Add", addButtonTitle: "Add a new RAM size (GB)", addPromptLabel: "Add a new RAM size (GB):", group: "Hardware" },
      { key: "storage_unit", label: "Storage unit", type: "select", options: LOOKUPS.StorageUnit, onlyFor: "Virtual", required: true, group: "Hardware" },
      { key: "storage_gb", label: "Storage", type: "multiNumber", onlyFor: "Virtual", required: true, min: 1, placeholder: "e.g. 500", group: "Hardware" },
      // Physical-only — read-only, always mirrors the linked Hardware record.
      { key: "hardware_specs", label: "Specs (auto from Hardware)", type: "derivedText", onlyFor: "Physical", dependsLabel: "Hardware", group: "Hardware" },

      // Physical-only — workload importance (not a hardware property, stays here)
      { key: "criticality", label: "Criticality", type: "select", options: LOOKUPS.Criticality, required: true, onlyFor: "Physical", group: "Lifecycle" },
      { key: "environment", label: "Environment", type: "select", options: LOOKUPS.Environment, required: true, group: "Lifecycle" },
      { key: "status", label: "Status", type: "select", options: LOOKUPS.Status, required: true, group: "Lifecycle" },

      // Common — other
      { key: "owner", label: "Owner", type: "text", group: "Other" },
      { key: "remarks", label: "Remarks", type: "textarea", group: "Other" },
    ],
  },

  locations: {
    key: "locations", label: "Location Master", desc: "Site > Factory > Floor > Area > Rack hierarchy — reference data for filling in Inventory and Network location fields",
    idField: "location_id", idPrefix: "LOC", storageKey: "inv_locations",
    discriminatorKey: "level",
    listColumns: [
      { key: "level", label: "Level", render: r => typeBadge(r.level) },
      { key: "name", label: "Name", mono: true },
      { key: "parent", label: "Path", render: r => locationParentPath(r) || "-" },
      { key: "rack_units", label: "Rack height (U)", render: r => (r.level === "Rack" ? (r.rack_units || "-") : "-") },
    ],
    fields: [
      { key: "level", label: "Level", type: "select", options: LOOKUPS.LocationLevel, required: true, group: "Identity" },
      { key: "name", label: "Name", type: "text", required: true, group: "Identity" },

      { key: "parent_site", label: "Site", type: "select", onlyFor: "Factory", required: true, group: "Hierarchy",
        dynamicOptions: () => locationsByLevel("Site").map(l => ({ value: l.location_id, label: l.name })) },
      { key: "parent_factory", label: "Factory", type: "select", onlyFor: "Floor", required: true, group: "Hierarchy",
        dynamicOptions: () => locationsByLevel("Factory").map(l => ({ value: l.location_id, label: `${l.name} — ${locationNameFor(l.parent_id) || "?"}` })) },
      { key: "parent_floor", label: "Floor", type: "select", onlyFor: "Area", required: true, group: "Hierarchy",
        dynamicOptions: () => locationsByLevel("Floor").map(l => ({ value: l.location_id, label: locationParentPath(l) })) },
      { key: "parent_area", label: "Area", type: "select", onlyFor: "Rack", required: true, group: "Hierarchy",
        dynamicOptions: () => locationsByLevel("Area").map(l => ({ value: l.location_id, label: locationParentPath(l) })) },

      { key: "rack_units", label: "Rack height (U)", type: "number", onlyFor: "Rack", placeholder: "e.g. 42", group: "Hierarchy" },

      { key: "remarks", label: "Remarks", type: "textarea", group: "Other" },
    ],
  },

  vlans: {
    key: "vlans", label: "VLAN", desc: "VLAN / subnet register — network address, gateway, DHCP and static ranges are validated against each other",
    idField: "vlan_id_pk", idPrefix: "VLA", storageKey: "inv_vlans",
    listColumns: [
      { key: "vlan_id", label: "VLAN ID", mono: true },
      { key: "vlan_name", label: "VLAN Name", mono: true },
      { key: "purpose", label: "Purpose" },
      { key: "network_cidr", label: "Network", render: r => `${r.network_address || "-"}${r.cidr ? " " + r.cidr : ""}` },
      { key: "gateway", label: "Gateway", mono: true },
      { key: "dhcp_enabled", label: "DHCP" },
      { key: "firewall_zone", label: "Firewall Zone" },
    ],
    fields: [
      { key: "vlan_id", label: "VLAN ID", type: "number", required: true, group: "Identity" },
      { key: "vlan_name", label: "VLAN Name", type: "text", required: true, group: "Identity" },
      { key: "purpose", label: "Purpose", type: "text", placeholder: "e.g. Server Network", group: "Identity" },

      { key: "network_address", label: "Network Address", type: "ip", required: true, placeholder: "e.g. 10.10.10.0", group: "Subnet" },
      { key: "subnet_mask", label: "Subnet Mask", type: "ip", required: true, placeholder: "e.g. 255.255.255.0", group: "Subnet" },
      { key: "cidr", label: "CIDR (auto)", type: "derivedText", dependsLabel: "Subnet Mask", group: "Subnet" },
      { key: "usable_ip", label: "Usable IP (auto)", type: "derivedText", dependsLabel: "Network Address / Subnet Mask", group: "Subnet" },

      { key: "gateway", label: "Gateway", type: "ip", placeholder: "e.g. 10.10.10.1", group: "Routing" },
      { key: "gateway_device", label: "Gateway Device", type: "select", options: LOOKUPS.GatewayDevice, group: "Routing" },
      { key: "firewall_zone", label: "Firewall Zone", type: "select", options: LOOKUPS.NetworkZone, group: "Routing" },
      { key: "routing", label: "Routing", type: "text", placeholder: "e.g. Core → Firewall", group: "Routing" },

      { key: "dhcp_enabled", label: "DHCP", type: "select", options: LOOKUPS.DhcpEnabled, required: true, default: "No", group: "DHCP" },
      { key: "dhcp_server", label: "DHCP Server", type: "ip", group: "DHCP" },
      { key: "dhcp_start", label: "DHCP usable start (auto)", type: "ip", locked: true, group: "DHCP" },
      { key: "dhcp_end", label: "DHCP usable end (auto)", type: "ip", locked: true, group: "DHCP" },

      { key: "static_start", label: "Static IP Range — Start", type: "ip", placeholder: "e.g. 10.10.10.2", group: "Static IP Range" },
      { key: "static_end", label: "Static IP Range — End", type: "ip", placeholder: "e.g. 10.10.10.99", group: "Static IP Range" },
      { key: "static_usable", label: "Static IP usable (auto)", type: "derivedText", dependsLabel: "Static Start / End", group: "Static IP Range" },
    ],
  },

  network_devices: {
    key: "network_devices", label: "Network Inventory", desc: "Switches, firewalls, and other network hardware — Location is picked from Location Master",
    idField: "device_id", idPrefix: "NET", storageKey: "inv_network_devices",
    listColumns: [
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
      { key: "category", label: "Category" },
      { key: "subcategory", label: "Sub-category" },
      { key: "device_name", label: "Device Name", mono: true },
      { key: "ip_management", label: "IP Management", mono: true },
      { key: "brand_model", label: "Brand / Model", render: r => `${r.brand || "-"} ${r.model || ""}`.trim() },
      { key: "stack_role", label: "Stack Role" },
      { key: "location", label: "Location", render: r => locationFullPathFor(r.location_id) },
      { key: "rack_number", label: "Rack" },
      { key: "eol_date", label: "EOL Date", render: r => formatDateDMY(r.eol_date) },
    ],
    fields: [
      { key: "status", label: "Status", type: "select", options: LOOKUPS.DeviceStatus, required: true, group: "Identity" },
      { key: "category", label: "Category", type: "select", options: Object.keys(NETWORK_CATEGORIES), required: true, group: "Identity" },
      { key: "subcategory", label: "Sub-category", type: "forcedSelect", required: true, placeholder: "Select Category first", group: "Identity",
        dynamicOptions: () => {
          const list = NETWORK_CATEGORIES[getLiveValue("category")];
          return list ? list.map(v => ({ value: v, label: v })) : [];
        } },
      { key: "device_name", label: "Device Name", type: "text", required: true, group: "Identity" },
      { key: "brand", label: "Brand", type: "select", options: LOOKUPS.NetworkBrand, required: true, group: "Identity" },
      { key: "model", label: "Model", type: "text", group: "Identity" },
      { key: "serial_number", label: "S/N", type: "text", required: true, group: "Identity" },
      { key: "fixed_asset", label: "Fixed Asset", type: "text", placeholder: "e.g. IS001", group: "Identity" },
      { key: "description", label: "Description", type: "text", group: "Identity" },

      { key: "network_zone", label: "Network Zone", type: "select", options: LOOKUPS.NetworkZone, group: "Role" },
      { key: "role", label: "Role", type: "select", options: LOOKUPS.DeviceRole, group: "Role" },
      { key: "detail", label: "Detail", type: "text", placeholder: "e.g. Core Switch Wifi", group: "Role" },

      { key: "stack_enabled", label: "Part of a Switch Stack?", type: "radio", options: ["No", "Yes"], default: "No", group: "Stack" },
      { key: "stack_id", label: "Stack ID", type: "select", options: STACK_ID_OPTIONS, group: "Stack" },
      { key: "stack_role", label: "Stack Role", type: "select", options: LOOKUPS.StackRole, group: "Stack" },

      { key: "mac_address", label: "MAC Address", type: "mac", placeholder: "e.g. aa:bb:cc:dd:ee:01", group: "Network" },
      { key: "ip_management", label: "IP Management", type: "ip", required: true, placeholder: "e.g. 192.168.104.126", group: "Network" },

      { key: "parent_site", label: "Site", type: "select", required: true, group: "Location",
        dynamicOptions: () => locationsByLevel("Site").map(l => ({ value: l.location_id, label: l.name })) },
      { key: "parent_factory", label: "Factory", type: "select", required: true, group: "Location",
        dynamicOptions: () => locationsByLevel("Factory").filter(l => l.parent_id === getLiveValue("parent_site")).map(l => ({ value: l.location_id, label: l.name })) },
      { key: "location_id", label: "Floor", type: "select", required: true, group: "Location",
        dynamicOptions: () => locationsByLevel("Floor").filter(l => l.parent_id === getLiveValue("parent_factory")).map(l => ({ value: l.location_id, label: l.name })) },
      { key: "rack_number", label: "Rack Number", type: "text", placeholder: "e.g. Rack 01", group: "Location" },

      { key: "commission_date", label: "Commission Date", type: "date", group: "Lifecycle" },
      { key: "warranty_years", label: "Warranty period (years)", type: "select", options: ["1", "2", "3", "4", "5"], group: "Lifecycle" },
      { key: "warranty_expiry", label: "Warranty expiry (auto)", type: "date", locked: true, group: "Lifecycle" },
      { key: "eol_date", label: "EOL Date", type: "date", group: "Lifecycle" },
    ],
  },

  software_catalogue: {
    key: "software_catalogue", label: "Software Catalogue", desc: "Master Software list that License Control picks from",
    idField: "software_id", idPrefix: "SWC", storageKey: "inv_software_catalogue",
    listColumns: [
      { key: "vendor", label: "Vendor", mono: true },
      { key: "name", label: "Software", mono: true },
      { key: "edition", label: "Edition" },
      { key: "version", label: "Version" },
      { key: "category", label: "Category" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
    ],
    fields: [
      { key: "vendor", label: "Vendor / Publisher", type: "text", required: true, placeholder: "e.g. Microsoft", group: "Identity" },
      { key: "name", label: "Software Name", type: "text", required: true, placeholder: "e.g. SQL Server", group: "Identity" },
      { key: "edition", label: "Edition", type: "text", placeholder: "e.g. Enterprise", group: "Identity" },
      { key: "version", label: "Version", type: "text", placeholder: "e.g. 2022", group: "Identity" },
      { key: "category", label: "Category", type: "selectAddable", catalogKey: "software_category", required: true, group: "Classification" },
      { key: "type", label: "Software Type", type: "selectAddable", catalogKey: "software_type", required: true, group: "Classification" },
      { key: "deployment", label: "Deployment", type: "select", options: ["On-Premise", "Cloud", "Hybrid"], default: "On-Premise", group: "Classification" },
      { key: "criticality", label: "Criticality", type: "select", options: ["Critical", "High", "Medium", "Low"], default: "Medium", group: "Classification" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Retired"], required: true, default: "Active", group: "Classification" },
      { key: "description", label: "Description", type: "textarea", group: "Other" },
    ],
  },

  software_licenses: {
    key: "software_licenses", label: "License Control", desc: "License quantity, metric, expiry and contract/document detail — Software is picked from the Catalogue",
    idField: "license_id", idPrefix: "LIC", storageKey: "inv_software_licenses",
    listColumns: [
      { key: "software_id", label: "Software", render: r => escapeHtml(softwareCatalogueName(r.software_id)) },
      { key: "license_type", label: "License Type" },
      { key: "license_metric", label: "Metric" },
      { key: "purchased_qty", label: "Purchased", render: r => `${r.purchased_qty} ${r.unit || ""}`.trim() },
      { key: "used_qty", label: "Used", render: r => `${licenseUsedQty(r.license_id)} ${r.unit || ""}`.trim() },
      { key: "available_qty", label: "Available", render: r => `${(Number(r.purchased_qty) || 0) - licenseUsedQty(r.license_id)} ${r.unit || ""}`.trim() },
      { key: "expiry_date", label: "Expiry", render: r => r.expiry_date ? formatDateDMY(r.expiry_date) : "Perpetual" },
      { key: "status", label: "Status", render: r => statusBadge(licenseStatus(r)) },
    ],
    fields: [
      { key: "software_id", label: "Software Catalogue", type: "select", required: true, group: "License",
        dynamicOptions: () => state.data.software_catalogue.map(sc => ({ value: sc.software_id, label: softwareCatalogueName(sc.software_id) })) },
      { key: "license_type", label: "License Type", type: "selectAddable", catalogKey: "license_type", group: "License" },
      { key: "license_metric", label: "License Metric", type: "selectAddable", catalogKey: "license_metric", group: "License" },
      { key: "purchased_qty", label: "Purchased Quantity", type: "number", required: true, min: 0, group: "License" },
      { key: "unit", label: "Unit", type: "text", placeholder: "Core / User / Workload", group: "License" },

      { key: "purchase_date", label: "Purchase Date", type: "date", group: "Dates" },
      { key: "start_date", label: "Start Date", type: "date", group: "Dates" },
      { key: "expiry_date", label: "Expiry Date", type: "date", group: "Dates" },

      { key: "contract_no", label: "Contract No.", type: "text", placeholder: "e.g. CTR-2026-001", group: "Contract" },
      { key: "po_no", label: "PO No.", type: "text", placeholder: "e.g. PO-2026-001", group: "Contract" },
      { key: "invoice_no", label: "Invoice No.", type: "text", placeholder: "e.g. INV-2026-001", group: "Contract" },
      { key: "cost", label: "Cost (THB)", type: "number", min: 0, group: "Contract" },
      { key: "auto_renewal", label: "Auto Renewal", type: "select", options: ["Yes", "No"], default: "No", group: "Contract" },
      { key: "owner", label: "Owner", type: "text", placeholder: "e.g. IT Infrastructure", group: "Contract" },
      { key: "remark", label: "Remark", type: "textarea", group: "Other" },
    ],
  },

  software_allocations: {
    key: "software_allocations", label: "License Allocation", desc: "Binds a License to the Server / VM / Device / User / Workload actually using it",
    idField: "allocation_id", idPrefix: "ALC", storageKey: "inv_software_allocations",
    listColumns: [
      { key: "license_id", label: "License", mono: true },
      { key: "software_id", label: "Software", render: r => escapeHtml(softwareCatalogueName((state.data.software_licenses.find(l => l.license_id === r.license_id) || {}).software_id)) },
      { key: "target_type", label: "Target Type" },
      { key: "target_name", label: "Target", mono: true },
      { key: "quantity", label: "Quantity", render: r => `${r.quantity} ${r.unit || ""}`.trim() },
      { key: "environment", label: "Environment" },
    ],
    fields: [
      { key: "license_id", label: "License", type: "select", required: true, group: "Allocation",
        dynamicOptions: () => state.data.software_licenses.map(l => ({ value: l.license_id, label: `${l.license_id} — ${softwareCatalogueName(l.software_id)}` })) },
      { key: "target_type", label: "Target Type", type: "select", options: ["Physical Server", "Virtual Machine", "Device", "User", "Workload", "Site"], default: "Physical Server", group: "Allocation" },
      { key: "target_name", label: "Target Name", type: "text", required: true, placeholder: "e.g. ESXi01 / SQL01 / VM01", group: "Allocation" },
      { key: "quantity", label: "Quantity", type: "number", required: true, min: 1, group: "Allocation" },
      { key: "unit", label: "Unit", type: "text", placeholder: "Core / User / Workload", group: "Allocation" },
      { key: "environment", label: "Environment", type: "select", options: ["Production", "DR", "Test", "Development"], default: "Production", group: "Allocation" },
      { key: "remark", label: "Remark", type: "textarea", group: "Other" },
    ],
  },

  users: {
    key: "users", label: "Users", desc: "Application accounts and their access role — Admin manages users; User can edit data; Viewer is read-only",
    idField: "user_id", idPrefix: "USR", storageKey: "inv_users",
    listColumns: [
      { key: "full_name", label: "Name" },
      { key: "username", label: "Username", mono: true },
      { key: "role", label: "Role", render: r => roleBadge(r.role) },
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
    ],
    fields: [
      { key: "full_name", label: "Full name", type: "text", required: true, group: "Account" },
      { key: "username", label: "Username", type: "text", required: true, group: "Account" },
      { key: "password", label: "Password", type: "password", placeholder: "Leave blank to keep current password", group: "Account" },
      { key: "role", label: "Role", type: "select", options: ["Admin", "User", "Viewer"], required: true, group: "Access" },
      { key: "status", label: "Status", type: "select", options: ["Active", "Disabled"], required: true, group: "Access" },
    ],
  },

  server_permissions: {
    key: "server_permissions", label: "Server Permission", desc: "Shared folders on File Servers and the AD group(s) that hold Read/Write or Read-only access — Admin only",
    idField: "permission_id", idPrefix: "PRM", storageKey: "inv_server_permissions",
    listColumns: [
      { key: "folder_name", label: "Folder", mono: true },
      { key: "server_id", label: "Server", render: r => escapeHtml(serverNameFor(r.server_id)) },
      { key: "level", label: "Level" },
      { key: "access_groups", label: "AD groups (RW / RO)", render: r => `${escapeHtml(r.rw_group || "-")} / ${escapeHtml(r.ro_group || "-")}` },
      { key: "department", label: "Department" },
      { key: "quota_gb", label: "Quota (GB)" },
    ],
    fields: [
      { key: "server_id", label: "File Server", type: "select", required: true, group: "Folder",
        dynamicOptions: () => state.data.servers.map(s => ({ value: s.server_id, label: s.system_name })) },
      { key: "folder_name", label: "Folder name", type: "text", required: true, group: "Folder" },
      { key: "folder_path", label: "Path", type: "text", placeholder: "e.g. \\\\FS-PROD-01\\Share\\Folder", group: "Folder" },
      { key: "level", label: "Level", type: "select", options: LOOKUPS.PermissionLevel, required: true, group: "Folder" },
      { key: "department", label: "Department", type: "text", group: "Folder" },
      { key: "rw_group", label: "AD group — Read/Write", type: "text", group: "Access" },
      { key: "ro_group", label: "AD group — Read only", type: "text", group: "Access" },
      { key: "quota_gb", label: "Quota (GB)", type: "number", group: "Access" },
      { key: "owner", label: "Folder owner", type: "text", group: "Other" },
      { key: "remarks", label: "Remarks", type: "textarea", group: "Other" },
    ],
  },

  ad_users: {
    key: "ad_users", label: "AD Users", desc: "Directory of Active Directory accounts and their group membership — imported, not created here",
    idField: "ad_user_id", idPrefix: "AD", storageKey: "inv_ad_users", noAdd: true,
    listColumns: [
      { key: "user_logon", label: "User logon", mono: true },
      { key: "display_name", label: "Display name" },
      { key: "department", label: "Department" },
      { key: "job_title", label: "Job title" },
      { key: "group_count", label: "Groups" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status", render: r => statusBadge(r.status) },
    ],
    fields: [
      { key: "user_logon", label: "User logon", type: "text", required: true, group: "Account" },
      { key: "display_name", label: "Display name", type: "text", group: "Account" },
      { key: "status", label: "Status", type: "select", options: LOOKUPS.AdUserStatus, required: true, group: "Account" },
      { key: "job_title", label: "Job title", type: "text", group: "Organisation" },
      { key: "department", label: "Department", type: "text", group: "Organisation" },
      { key: "email", label: "Email", type: "text", group: "Organisation" },
      { key: "groups", label: "AD Groups", type: "multiText", placeholder: "e.g. Production Control_Modify", group: "Access" },
      { key: "group_count", label: "AD group count (auto)", type: "derivedText", dependsLabel: "AD Groups", group: "Access" },
      { key: "remarks", label: "Remarks", type: "textarea", group: "Other" },
    ],
  },
};


/* ---------------- Uniqueness rules (duplicate checks) ---------------- */
/* Each rule checks `key` for duplicates within the same table (optionally
   restricted to records where the discriminator field matches `onlyFor`),
   plus any `crossChecks` against other tables. */
const UNIQUE_RULES = {
  hardware: [
    { key: "serial_number", label: "Serial number" },
    { key: "storage_name", label: "Storage name", onlyFor: "Storage" },
  ],
  clusters: [
    { key: "cluster_name", label: "Cluster name" },
  ],
  servers: [
    { key: "system_name", label: "System name" },
    { key: "server_name", label: "Server Name" },
    { key: "ip_address", label: "IP address" },
  ],
  vlans: [
    { key: "vlan_id", label: "VLAN ID" },
    { key: "vlan_name", label: "VLAN Name" },
    { key: "network_address", label: "Network Address" },
  ],
  network_devices: [
    { key: "serial_number", label: "S/N" },
    { key: "mac_address", label: "MAC Address" },
    { key: "device_name", label: "Device Name" },
    { key: "ip_management", label: "IP Management" },
  ],
  users: [
    { key: "username", label: "Username" },
  ],
  ad_users: [
    { key: "user_logon", label: "User logon" },
  ],
};

/* server_permissions has no single-column unique rule — a folder must be
   unique per server, so it's checked separately (like Location/VLAN). */
function validateServerPermission(values, excludeId) {
  if (!values.server_id || !values.folder_name) return [];
  const dup = state.data.server_permissions.some(p =>
    p.permission_id !== excludeId && p.server_id === values.server_id &&
    p.folder_name.trim().toLowerCase() === values.folder_name.trim().toLowerCase()
  );
  return dup ? [`Folder "${values.folder_name}" already has a permission entry for "${serverNameFor(values.server_id)}"`] : [];
}

/* A Network device that's marked as part of a switch stack must specify
   which Stack and what role it plays in it. */
function validateNetworkDevice(values) {
  if (values.stack_enabled === "Yes" && (!values.stack_id || !values.stack_role)) {
    return ["Please fill in: Stack ID, Stack Role (required when this device is part of a Switch Stack)"];
  }
  return [];
}
/* A given Hardware record can only be assigned to ONE Server Host or ONE
   Physical entry in Server List at a time — it's the same physical box. */
function genNodeId() {
  return "NODE-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* Finds which Cluster/Host-node (if any) currently has this hardware_id assigned. */
function findNodeByHardware(hardwareId, excludeClusterId, excludeNodeId) {
  for (const c of state.data.clusters) {
    if (c.cluster_id === excludeClusterId) continue;
    for (const n of (c.nodes || [])) {
      if (n.node_id === excludeNodeId) continue;
      if (n.hardware_id === hardwareId) return { cluster: c, node: n };
    }
  }
  return null;
}

/* Server-type Hardware not currently assigned to any Cluster's Host/Node or
   Server List (Physical) entry — except the one this particular row already
   has (so editing an existing node doesn't hide its own current hardware). */
function availableHardwareForNode(currentHardwareId) {
  const assignedElsewhere = new Set();
  state.data.clusters.forEach(c => (c.nodes || []).forEach(n => {
    if (n.hardware_id && n.hardware_id !== currentHardwareId) assignedElsewhere.add(n.hardware_id);
  }));
  state.data.servers.forEach(s => {
    if (s.hosting_type === "Physical" && s.hardware_id && s.hardware_id !== currentHardwareId) assignedElsewhere.add(s.hardware_id);
  });
  return state.data.hardware.filter(h => h.asset_type === "Server" && !assignedElsewhere.has(h.hardware_id));
}

/* Builds the <option>s for one Host row's hardware picker: everything not
   already saved elsewhere (availableHardwareForNode), minus whatever is
   picked in this row's *sibling* rows in the same open form right now
   (excludeIds) — so two new, not-yet-saved Hosts can't claim the same box. */
function nodeHardwareOptionsHtml(currentHardwareId, excludeIds) {
  const available = availableHardwareForNode(currentHardwareId)
    .filter(h => h.hardware_id === currentHardwareId || !excludeIds.has(h.hardware_id));
  return `<option value="">-- Select hardware --</option>` + available.map(h =>
    `<option value="${escapeHtml(h.hardware_id)}" ${h.hardware_id === currentHardwareId ? "selected" : ""}>${escapeHtml(h.serial_number)} — ${escapeHtml(hardwareLabelFor(h.hardware_id))}</option>`
  ).join("");
}
function nodeHwInfoHtml(hardwareId) {
  const hw = state.data.hardware.find(h => h.hardware_id === hardwareId);
  if (!hw) return `<span class="node-hw-info-line empty">No hardware selected yet.</span>`;
  return `<span class="node-hw-info-line">${escapeHtml(hw.manufacturer || "-")} ${escapeHtml(hw.model || "")} · S/N ${escapeHtml(hw.serial_number || "-")}</span>`;
}
function nodeRowMarkup(node, idx, excludeIds) {
  const rowId = node.node_id || genNodeId();
  return `
    <div class="node-row" data-node-id="${escapeHtml(node.node_id || rowId)}">
      <div class="node-row-header">
        <span class="node-row-title">Host ${idx + 1}</span>
        <button type="button" class="icon-btn node-remove" aria-label="Remove this Host">Remove</button>
      </div>
      <div class="node-field-grid">
        <label class="node-field">
          <span class="field-label">Server Hardware</span>
          <select class="node-input node-hw-select" data-node-key="hardware_id">
            ${nodeHardwareOptionsHtml(node.hardware_id || "", excludeIds)}
          </select>
          <div class="node-hw-info-wrap">${nodeHwInfoHtml(node.hardware_id)}</div>
        </label>
        <label class="node-field">
          <span class="field-label">Host name</span>
          <input type="text" class="node-input" data-node-key="host_name" value="${escapeHtml(node.host_name || `Host-${String(idx + 1).padStart(2, "0")}`)}">
        </label>
        <label class="node-field">
          <span class="field-label">IP Host</span>
          <input type="text" class="node-input" data-node-key="ip_host" data-ip-field="1" value="${escapeHtml(node.ip_host || "")}" placeholder="e.g. 192.168.10.1">
        </label>
        <label class="node-field">
          <span class="field-label">IP Management (iDRAC/iLO)</span>
          <input type="text" class="node-input" data-node-key="ip_management" data-ip-field="1" value="${escapeHtml(node.ip_management || "")}" placeholder="e.g. 192.168.1.10">
        </label>
      </div>
    </div>`;
}
/* Re-derives every row's option list + info line from what's actually
   selected in the DOM right now — called after any add/remove/change so a
   Host picked in one row disappears from every other row's dropdown. */
function refreshNodeHardwareOptions(listEl) {
  const selects = Array.from(listEl.querySelectorAll('.node-row [data-node-key="hardware_id"]'));
  selects.forEach((sel, i) => {
    const currentVal = sel.value;
    const excludeIds = new Set(selects.filter((_, j) => j !== i).map(s => s.value).filter(Boolean));
    sel.innerHTML = nodeHardwareOptionsHtml(currentVal, excludeIds);
    const infoWrap = sel.closest(".node-field").querySelector(".node-hw-info-wrap");
    if (infoWrap) infoWrap.innerHTML = nodeHwInfoHtml(currentVal);
  });
}

/* A given Hardware record can only be assigned to ONE Host/Node or ONE
   Physical entry in Server List at a time — it's the same physical box. */
function checkHardwareAssignment(tableKey, values, excludeId) {
  const hardwareId = values.hardware_id;
  if (!hardwareId) return [];
  const conflicts = [];

  const nodeUse = findNodeByHardware(hardwareId);
  if (nodeUse) conflicts.push(`This hardware is already assigned to Host "${nodeUse.node.host_name}" in Cluster "${nodeUse.cluster.cluster_name}"`);

  const physUse = state.data.servers.find(s => s.hosting_type === "Physical" && s.hardware_id === hardwareId && !(tableKey === "servers" && s.server_id === excludeId));
  if (physUse) conflicts.push(`This hardware is already assigned to Server List entry "${physUse.system_name}"`);

  return conflicts;
}

/* Validates every Host/Node row inside a Cluster form: required sub-fields,
   and duplicate/reused hardware, host name, or IP across the whole system. */
function validateNodes(nodes, excludeClusterId) {
  const errors = [];
  const seenHw = new Set(), seenHost = new Set(), seenIpHost = new Set(), seenIpMgmt = new Set();

  nodes.forEach((n, i) => {
    const label = `Host ${i + 1}`;
    if (!n.hardware_id) {
      errors.push(`${label}: please select a Server Hardware`);
      return;
    }
    if (!n.host_name) errors.push(`${label}: please enter a Host name`);
    if (!n.ip_host) errors.push(`${label}: please enter an IP Host`);
    if (n.ip_host && !isValidIPv4(n.ip_host)) errors.push(`${label}: IP Host must be a valid IP address (e.g. 192.168.1.10)`);
    if (n.ip_management && !isValidIPv4(n.ip_management)) errors.push(`${label}: IP Management must be a valid IP address (e.g. 192.168.1.10)`);

    const dupHw = seenHw.has(n.hardware_id) || findNodeByHardware(n.hardware_id, excludeClusterId, n.node_id) ||
      state.data.servers.some(s => s.hosting_type === "Physical" && s.hardware_id === n.hardware_id);
    if (dupHw) errors.push(`${label}: this hardware is already in use elsewhere in the system`);
    seenHw.add(n.hardware_id);

    if (n.host_name) {
      const key = n.host_name.toLowerCase();
      if (seenHost.has(key)) errors.push(`${label}: Host name "${n.host_name}" is already used`);
      seenHost.add(key);
    }
    if (n.ip_host) {
      if (seenIpHost.has(n.ip_host)) errors.push(`${label}: IP Host "${n.ip_host}" is already used`);
      seenIpHost.add(n.ip_host);
    }
    if (n.ip_management) {
      if (seenIpMgmt.has(n.ip_management)) errors.push(`${label}: IP Management "${n.ip_management}" is already used`);
      seenIpMgmt.add(n.ip_management);
    }
  });

  return errors;
}

function checkDuplicates(tableKey, values, excludeId) {
  const cfg = TABLES[tableKey];
  const rules = UNIQUE_RULES[tableKey] || [];
  const conflicts = [];

  rules.forEach(rule => {
    const discVal = cfg.discriminatorKey ? values[cfg.discriminatorKey] : null;
    if (rule.onlyFor && discVal !== rule.onlyFor) return; // rule doesn't apply to this record's type
    const val = String(values[rule.key] || "").trim();
    if (!val) return; // don't flag empty optional fields

    const dupSelf = state.data[tableKey].some(r => {
      if (r[cfg.idField] === excludeId) return false;
      if (rule.onlyFor && cfg.discriminatorKey && r[cfg.discriminatorKey] !== rule.onlyFor) return false;
      return String(r[rule.key] || "").trim().toLowerCase() === val.toLowerCase();
    });

    let dupCross = false;
    (rule.crossChecks || []).forEach(cc => {
      if (dupCross) return;
      const otherCfg = TABLES[cc.table];
      dupCross = state.data[cc.table].some(r => {
        if (cc.onlyFor && otherCfg.discriminatorKey && r[otherCfg.discriminatorKey] !== cc.onlyFor) return false;
        return String(r[rule.key] || "").trim().toLowerCase() === val.toLowerCase();
      });
    });

    if (dupSelf || dupCross) conflicts.push(`${rule.label} "${val}" already exists in the system`);
  });

  return conflicts;
}

/* Cross-field validation for a VLAN record: every IP field that should live
   inside the VLAN's own subnet actually does, and the DHCP / Static ranges
   don't overlap each other or the Gateway. */
function validateVlan(values) {
  const errors = [];
  const { network_address, subnet_mask, gateway, dhcp_enabled, dhcp_server, dhcp_start, dhcp_end, static_start, static_end } = values;

  if (!network_address || !subnet_mask) return errors; // required-field check already covers this
  const range = subnetRangeFor(network_address, subnet_mask);
  if (!range) {
    errors.push("Subnet Mask must be a valid, contiguous mask (e.g. 255.255.255.0)");
    return errors;
  }

  const checkInSubnet = (label, ip) => {
    if (ip && !ipInSubnet(ip, network_address, subnet_mask)) {
      errors.push(`${label} (${ip}) is not within the usable range of this subnet (${range.usableLabel})`);
    }
  };
  checkInSubnet("Gateway", gateway);
  checkInSubnet("DHCP Server", dhcp_server);
  checkInSubnet("DHCP Start", dhcp_start);
  checkInSubnet("DHCP End", dhcp_end);
  checkInSubnet("Static IP Range Start", static_start);
  checkInSubnet("Static IP Range End", static_end);

  if (dhcp_enabled === "Yes") {
    if (!dhcp_server) errors.push("DHCP Server is required when DHCP is enabled");
    if (!dhcp_start || !dhcp_end) errors.push("The subnet has no room left for a DHCP range once the Gateway/Static IP range are excluded");
    else if (ipToInt(dhcp_start) > ipToInt(dhcp_end)) errors.push("DHCP Start must come before DHCP End");
  }
  if (static_start && static_end && ipToInt(static_start) > ipToInt(static_end)) {
    errors.push("Static IP Range Start must come before Static IP Range End");
  }

  if (dhcp_enabled === "Yes" && dhcp_start && dhcp_end && static_start && static_end &&
      rangesOverlap(dhcp_start, dhcp_end, static_start, static_end)) {
    errors.push("DHCP range and Static IP range overlap — they must not share any addresses");
  }
  if (gateway) {
    if (dhcp_start && dhcp_end && ipInSubnet(gateway, network_address, subnet_mask) &&
        ipToInt(gateway) >= ipToInt(dhcp_start) && ipToInt(gateway) <= ipToInt(dhcp_end)) {
      errors.push("Gateway falls inside the DHCP range — exclude it from DHCP Start/End");
    }
    if (static_start && static_end &&
        ipToInt(gateway) >= ipToInt(static_start) && ipToInt(gateway) <= ipToInt(static_end)) {
      errors.push("Gateway falls inside the Static IP range — exclude it from Static Start/End");
    }
  }

  return errors;
}

/* ---------------- Location Master seed (from Location Master.xlsx) ---------------- */
const LOCATION_MASTER = [
  ["1st Site","Main Office","Floor 1"],["1st Site","Main Office","Floor 2"],
  ["1st Site","HDC","Floor 1"],["1st Site","HDC","Floor 2"],["1st Site","HDC","Floor 3"],["1st Site","HDC","Floor 4"],
  ["1st Site","Factory 1","Floor 1"],["1st Site","Factory 1","Floor 2"],
  ["1st Site","Factory 2","Floor 1"],["1st Site","Factory 2","Floor 2"],
  ["1st Site","Canteen 1","Floor 1"],["1st Site","Canteen 2","Floor 1"],
  ["1st Site","Guard House 1","Floor 1"],["1st Site","Guard House 2","Floor 1"],
  ["1st Site","Shop Factory","Floor 1"],
  ["1st Site","Multi Purpose","Floor 1"],["1st Site","Multi Purpose","Floor 2"],
  ["1st Site","Anechoic 1","Floor 1"],["1st Site","Anechoic 2","Floor 1"],["1st Site","Anechoic 3","Floor 1"],
  ["2nd Site","Canteen 1","Floor 1"],["2nd Site","Canteen 1","Floor 2"],
  ["2nd Site","Canteen 2","Floor 1"],["2nd Site","Canteen 2","Floor 2"],
  ["2nd Site","Shop Factory","Floor 1"],["2nd Site","Shop Forklift","Floor 1"],["2nd Site","Shop Recycle","Floor 1"],
  ["2nd Site","Guard House 2","Floor 1"],["2nd Site","Guard House 3","Floor 1"],
  ["2nd Site","Warehouse 3","Floor 1"],
  ["2nd Site","Factory 3","Floor 1"],["2nd Site","Factory 3","Floor 2"],
];
function buildLocationSeed(today) {
  const locs = [];
  const siteId = {}, facId = {};
  let n = 0;
  const nextId = () => `LOC-${String(++n).padStart(3, "0")}`;
  const row = (level, name, parent_id) => ({ location_id: nextId(), level, name, parent_id, remarks: "-", created_at: today, updated_at: today });
  LOCATION_MASTER.forEach(([site, factory, floor]) => {
    if (!siteId[site]) { const r = row("Site", site, null); siteId[site] = r.location_id; locs.push(r); }
    const fKey = site + "||" + factory;
    if (!facId[fKey]) { const r = row("Factory", factory, siteId[site]); facId[fKey] = r.location_id; locs.push(r); }
    locs.push(row("Floor", floor, facId[fKey]));
  });
  return locs;
}

/* Backfills any Site/Factory/Floor row from LOCATION_MASTER that isn't
   already present in state.data.locations — matched by (level, name,
   parent), never by array position — and leaves everything else alone:
   custom Areas/Racks, any locations a user added by hand, any edits to
   remarks, etc. This is what makes Location Master self-healing for a
   browser whose localStorage predates this exact master list (or an
   earlier, incomplete version of it) instead of staying stuck on stale
   data forever — see the migration check in loadAll(). Returns true if it
   actually added anything (so the caller knows whether to persist).
*/
function ensureLocationMaster() {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  const findChild = (level, name, parentId) =>
    state.data.locations.find(l => l.level === level && l.name === name && l.parent_id === parentId);
  const addRow = (level, name, parentId) => {
    const rec = { location_id: generateId({ key: "locations", idField: "location_id", idPrefix: "LOC" }),
      level, name, parent_id: parentId, remarks: "-", created_at: today, updated_at: today };
    state.data.locations.push(rec);
    changed = true;
    return rec;
  };
  LOCATION_MASTER.forEach(([siteName, factoryName, floorName]) => {
    const site = findChild("Site", siteName, null) || addRow("Site", siteName, null);
    const factory = findChild("Factory", factoryName, site.location_id) || addRow("Factory", factoryName, site.location_id);
    findChild("Floor", floorName, factory.location_id) || addRow("Floor", floorName, factory.location_id);
  });
  return changed;
}

/* ---------------- Seed / example data ---------------- */
function seedData() {
  const today = new Date().toISOString().slice(0, 10);

  state.data.hardware = [
    {
      hardware_id: "HW-001", asset_type: "Server", manufacturer: "Dell", model: "PowerEdge R740", serial_number: "SN123456",
      cpu: "2x Intel Xeon Gold 6248R", cpu_cores: 48, memory_gb: 256, storage_capacity: 4, storage_unit: "TB", storage_drive_type: "SSD",
      site: "1st Site", location: "Server Room", rack_number: "R-12",
      u_position: "U10-U12", port_no: "", port_name: "",
      commission_date: "2023-01-15", warranty_expiry: "2026-01-15", status: "In Use",
      ma_contract_no: "", ma_provider: "", ma_expiry_date: "", ma_cost: "", ma_renewal_history: [],
      owner: "IT Infrastructure", cost_center: "IT-CC-1001", remarks: "-", created_at: today, updated_at: today,
    },
    {
      hardware_id: "HW-002", asset_type: "Server", manufacturer: "HPE", model: "ProLiant DL380", serial_number: "SN654321",
      cpu: "2x Intel Xeon Silver 4314", cpu_cores: 32, memory_gb: 128, storage_capacity: 960, storage_unit: "GB", storage_drive_type: "SSD",
      site: "1st Site", location: "Server Room", rack_number: "R-05",
      u_position: "U3", port_no: "Gi1/0/1", port_name: "SW-Core-01",
      commission_date: "2022-06-01", warranty_expiry: "2025-06-01", status: "In Use",
      ma_contract_no: "MA-2025-0100", ma_provider: "HPE Care Pack", ma_expiry_date: "2026-12-01", ma_cost: 45000,
      ma_renewal_history: [
        { renewal_id: "RNW-seed-hw1", contract_no: "MA-2024-0099", provider: "HPE Care Pack", start_date: "2024-06-01", end_date: "2025-06-01", cost_thb: 42000, note: "First MA period after warranty ended", renewed_by: "admin", renewed_at: "2024-06-01T00:00:00.000Z" },
        { renewal_id: "RNW-seed-hw2", contract_no: "MA-2025-0100", provider: "HPE Care Pack", start_date: "2025-06-01", end_date: "2026-12-01", cost_thb: 45000, note: "", renewed_by: "admin", renewed_at: "2025-06-01T00:00:00.000Z" },
      ],
      owner: "IT Infrastructure", cost_center: "IT-CC-1001", remarks: "-", created_at: today, updated_at: today,
    },
    {
      hardware_id: "HW-003", asset_type: "Storage", storage_name: "SAN-Storage-01", storage_array_type: "SAN",
      capacity_gb: 20480, manufacturer: "Dell", model: "PowerVault ME5", serial_number: "SANSN0001",
      used_with: ["cluster:Datacenter"], site: "1st Site", location: "Server Room", rack_number: "R-01",
      status: "In Use", owner: "IT Infrastructure", cost_center: "IT-CC-1002", remarks: "-", created_at: today, updated_at: today,
    },
  ];

  state.data.clusters = [{
    cluster_id: "CLU-001", cluster_name: "Datacenter", hypervisor_platform: "Vmware",
    infrastructure_type: "HCI - VMware vSAN", management_console: "192.168.1.5",
    nodes: [
      { node_id: "NODE-001", hardware_id: "HW-001", host_name: "Host-01", ip_host: "192.168.10.1", ip_management: "192.168.1.10" },
    ],
    criticality: "Tier 1 (High)", environment: "Production", status: "Active",
    owner: "IT Infrastructure", remarks: "-", created_at: today, updated_at: today,
  }];

  state.data.servers = [
    {
      server_id: "SRV-001", hosting_type: "Virtual", host_ref: "CLU-001::NODE-001", cluster_name: "Datacenter",
      system_group: "SharePoint", system_name: "DB Sharepoint", server_name: "DBSP01",
      os_type: "Windows", os_version: "Windows Server 2022 Standard",
      ip_address: "192.168.10.10", service_port: "443, 1433",
      server_zone: "Trust", cpu_cores: 8, ram_gb: 32, storage_unit: "GB", storage_gb: [1024],
      environment: "Production", status: "Active", owner: "Application Team", remarks: "-",
      created_at: today, updated_at: today,
    },
    {
      server_id: "SRV-002", hosting_type: "Physical", hardware_id: "HW-002", system_group: "File Service",
      system_name: "File Server", server_name: "FS01",
      os_type: "Windows", os_version: "Windows Server 2019 Standard",
      ip_address: "192.168.30.5", service_port: "445, 443", server_zone: "Trust",
      criticality: "Tier 1 (High)", environment: "Production", status: "Active",
      owner: "IT Infrastructure", remarks: "-", created_at: today, updated_at: today,
    },
  ];

  state.data.locations = buildLocationSeed(today);

  state.data.vlans = [
    {
      vlan_id_pk: "VLA-001", vlan_id: 10, vlan_name: "SERVER", purpose: "Server Network",
      network_address: "10.10.10.0", subnet_mask: "255.255.255.0", cidr: "/24", usable_ip: "10.10.10.1–10.10.10.254",
      gateway: "10.10.10.1", gateway_device: "Core Switch",
      dhcp_enabled: "No", dhcp_server: "", dhcp_start: "", dhcp_end: "",
      static_start: "10.10.10.2", static_end: "10.10.10.99",
      firewall_zone: "Trust", routing: "Core → Firewall",
      created_at: today, updated_at: today,
    },
  ];

  state.data.network_devices = [
    {
      device_id: "NET-001", status: "Use", category: "Network Device", subcategory: "Core Switch",
      stack_enabled: "Yes", stack_id: "ST016", stack_role: "Active", network_zone: "Trust", detail: "Core Switch Wifi", role: "L3",
      brand: "Cisco", model: "C9500-16X", serial_number: "RR2", description: "-", fixed_asset: "IS004",
      mac_address: "aa:bb:cc:dd:e4", device_name: "OT1-Maincore", ip_management: "192.168.104.128",
      location_id: "LOC-003", rack_number: "Rack 01",
      commission_date: "2022-03-01", warranty_expiry: "2026-10-15", eol_date: "2027-03-01",
      created_at: today, updated_at: today,
    },
  ];

  state.data.server_permissions = [
    { permission_id: "PRM-001", server_id: "SRV-001", folder_name: "Production Control", folder_path: "\\\\FS-PROD-01\\Share\\ProductionControl", level: "Confidential", department: "Production Control", rw_group: "Production Control_Modify", ro_group: "", quota_gb: 500, owner: "IT Infrastructure", remarks: "-", created_at: today, updated_at: today },
    { permission_id: "PRM-002", server_id: "SRV-001", folder_name: "PC Common", folder_path: "\\\\FS-PROD-01\\Share\\PC_Common", level: "Section", department: "Production Control", rw_group: "PC Common_Modify", ro_group: "All Staff_Read Only", quota_gb: 200, owner: "IT Infrastructure", remarks: "-", created_at: today, updated_at: today },
    { permission_id: "PRM-003", server_id: "SRV-002", folder_name: "IT Secret", folder_path: "\\\\FS-HQ-02\\Secret\\ITInfra", level: "Secret", department: "IT Infrastructure", rw_group: "IT Secret_Modify", ro_group: "", quota_gb: 120, owner: "IT Infrastructure", remarks: "-", created_at: today, updated_at: today },
  ];

  state.data.ad_users = [
    { ad_user_id: "AD-001", user_logon: "admin", display_name: "Administrator", department: "IT Infrastructure", job_title: "System Engineer", email: "admin@company.local", group_count: 1, status: "Enabled", remarks: "-", created_at: today, updated_at: today },
    { ad_user_id: "AD-002", user_logon: "somchai.p", display_name: "Somchai Pattana", department: "Production Control", job_title: "Staff", email: "somchai.p@company.local", group_count: 2, status: "Enabled", remarks: "-", created_at: today, updated_at: today },
    { ad_user_id: "AD-003", user_logon: "wanida.k", display_name: "Wanida Kong", department: "Production Control", job_title: "Officer", email: "wanida.k@company.local", group_count: 1, status: "Enabled", remarks: "-", created_at: today, updated_at: today },
  ];

  // AD group membership backing Server Permission's rw_group/ro_group and the
  // Permission dashboard / Access check features — "IT Secret_Modify" is left
  // with zero members on purpose to demonstrate orphan-group detection.
  state.data.ad_memberships = [
    { membership_id: "MBR-001", ad_user_id: "AD-001", group_name: "All Staff_Read Only", created_at: today, updated_at: today },
    { membership_id: "MBR-002", ad_user_id: "AD-002", group_name: "Production Control_Modify", created_at: today, updated_at: today },
    { membership_id: "MBR-003", ad_user_id: "AD-002", group_name: "All Staff_Read Only", created_at: today, updated_at: today },
    { membership_id: "MBR-004", ad_user_id: "AD-003", group_name: "PC Common_Modify", created_at: today, updated_at: today },
  ];

  seedSoftwareData(today);
}

/* Split out from seedData() so it can also run on its own — as a one-time
   migration for a browser whose localStorage predates the Software
   Management tables (added after that browser's very first, one-time
   seedData() run already happened; see the migration check in loadAll()). */
function seedSoftwareData(today) {
  state.data.software_catalogue = [
    { software_id: "SWC-001", vendor: "VMware", name: "vSphere", edition: "Enterprise Plus", version: "8.x", category: "Virtualization", type: "Virtualization", deployment: "On-Premise", criticality: "Critical", status: "Active", description: "-", created_at: today, updated_at: today },
    { software_id: "SWC-002", vendor: "Microsoft", name: "SQL Server", edition: "Enterprise", version: "2022", category: "Database", type: "Database", deployment: "On-Premise", criticality: "Critical", status: "Active", description: "-", created_at: today, updated_at: today },
    { software_id: "SWC-003", vendor: "Microsoft", name: "Windows Server", edition: "Datacenter", version: "2025", category: "Operating System", type: "Operating System", deployment: "On-Premise", criticality: "Critical", status: "Active", description: "-", created_at: today, updated_at: today },
    { software_id: "SWC-004", vendor: "Veeam", name: "Backup & Replication", edition: "Enterprise Plus", version: "12.x", category: "Backup & Recovery", type: "Backup & Recovery", deployment: "On-Premise", criticality: "High", status: "Active", description: "-", created_at: today, updated_at: today },
  ];

  state.data.software_licenses = [
    { license_id: "LIC-001", software_id: "SWC-001", license_type: "Subscription", license_metric: "Per Core", purchased_qty: 96, unit: "Core", purchase_date: "2026-01-01", start_date: "2026-01-01", expiry_date: "2026-12-31", contract_no: "CTR-VM-2026", po_no: "PO-001", invoice_no: "INV-001", cost: "", auto_renewal: "Yes", owner: "IT Infrastructure", remark: "-", created_at: today, updated_at: today },
    { license_id: "LIC-002", software_id: "SWC-002", license_type: "Perpetual", license_metric: "Per Core", purchased_qty: 32, unit: "Core", purchase_date: "2026-01-10", start_date: "2026-01-10", expiry_date: "", contract_no: "CTR-SQL-001", po_no: "PO-002", invoice_no: "INV-002", cost: "", auto_renewal: "No", owner: "IT Infrastructure", remark: "-", created_at: today, updated_at: today },
    { license_id: "LIC-003", software_id: "SWC-003", license_type: "Perpetual", license_metric: "Per Core", purchased_qty: 64, unit: "Core", purchase_date: "2025-06-01", start_date: "2025-06-01", expiry_date: "", contract_no: "", po_no: "PO-003", invoice_no: "INV-003", cost: "", auto_renewal: "No", owner: "IT Infrastructure", remark: "-", created_at: today, updated_at: today },
    { license_id: "LIC-004", software_id: "SWC-004", license_type: "Subscription", license_metric: "Per Workload", purchased_qty: 100, unit: "Workload", purchase_date: "2026-07-01", start_date: "2026-07-01", expiry_date: "2026-10-15", contract_no: "CTR-VEEAM-26", po_no: "PO-004", invoice_no: "INV-004", cost: "", auto_renewal: "Yes", owner: "IT Infrastructure", remark: "-", created_at: today, updated_at: today },
  ];

  state.data.software_allocations = [
    { allocation_id: "ALC-001", license_id: "LIC-001", target_type: "Physical Server", target_name: "ESXi01", quantity: 32, unit: "Core", environment: "Production", remark: "-", created_at: today, updated_at: today },
    { allocation_id: "ALC-002", license_id: "LIC-001", target_type: "Physical Server", target_name: "ESXi02", quantity: 32, unit: "Core", environment: "Production", remark: "-", created_at: today, updated_at: today },
    { allocation_id: "ALC-003", license_id: "LIC-001", target_type: "Physical Server", target_name: "ESXi03", quantity: 32, unit: "Core", environment: "DR", remark: "-", created_at: today, updated_at: today },
    { allocation_id: "ALC-004", license_id: "LIC-002", target_type: "Physical Server", target_name: "SQL01", quantity: 16, unit: "Core", environment: "Production", remark: "-", created_at: today, updated_at: today },
    { allocation_id: "ALC-005", license_id: "LIC-002", target_type: "Physical Server", target_name: "SQL02", quantity: 8, unit: "Core", environment: "DR", remark: "-", created_at: today, updated_at: today },
    { allocation_id: "ALC-006", license_id: "LIC-004", target_type: "Virtual Machine", target_name: "VM-BACKUP-01", quantity: 50, unit: "Workload", environment: "Production", remark: "-", created_at: today, updated_at: today },
    { allocation_id: "ALC-007", license_id: "LIC-004", target_type: "Virtual Machine", target_name: "VM-BACKUP-DR", quantity: 36, unit: "Workload", environment: "DR", remark: "-", created_at: today, updated_at: today },
  ];
}

async function persist(tableKey) {
  const cfg = TABLES[tableKey];
  await StorageAdapter.set(cfg.storageKey, JSON.stringify(state.data[tableKey]));
}

/* audit_log / recycle_bin aren't user-editable TABLES — they're maintained
   by logChange()/moveToRecycleBin() below, so they get their own storage keys. */
const EXTRA_STORAGE = { audit_log: "inv_audit_log", recycle_bin: "inv_recycle_bin", ad_memberships: "inv_ad_memberships", record_versions: "inv_record_versions" };
async function persistExtra(key) {
  await StorageAdapter.set(EXTRA_STORAGE[key], JSON.stringify(state.data[key]));
}

async function loadAll() {
  // Fetch every table's blob in parallel rather than one round-trip at a
  // time — with a real backend this turns ~12 sequential requests at boot
  // into 1 batch, so it matters a lot once StorageAdapter isn't just hitting
  // localStorage.
  let anyLoaded = false;
  const tableKeys = Object.keys(TABLES);
  const tableResults = await Promise.all(tableKeys.map(key => StorageAdapter.get(TABLES[key].storageKey)));
  tableKeys.forEach((key, i) => {
    const raw = tableResults[i];
    if (raw) {
      try { state.data[key] = JSON.parse(raw); anyLoaded = true; } catch (e) { state.data[key] = []; }
    }
  });
  if (!anyLoaded) {
    seedData();
    await seedUsers();
    await Promise.all(tableKeys.map(key => persist(key)));
    await persistExtra("ad_memberships");
  }
  // Ensure a login account always exists (e.g. data seeded before accounts were added).
  if (!state.data.users || !state.data.users.length) {
    await seedUsers();
    await persist("users");
  }
  // Same idea for a browser whose localStorage predates the Software
  // Management tables entirely: anyLoaded was already true from the older
  // tables, so the seedData() branch above never ran, and these three
  // arrays would otherwise stay at their [] default forever.
  if (!state.data.software_catalogue || !state.data.software_catalogue.length) {
    seedSoftwareData(new Date().toISOString().slice(0, 10));
    await Promise.all(["software_catalogue", "software_licenses", "software_allocations"].map(persist));
  }
  // Location Master (Site > Factory > Floor) is reference data that should
  // always contain every row from LOCATION_MASTER — this backfills anything
  // missing (a browser whose locations predate this exact master list, or
  // an earlier/partial version of it) additively, without touching custom
  // Areas/Racks or any locations added by hand.
  if (ensureLocationMaster()) {
    await persist("locations");
  }
  const extraKeys = Object.keys(EXTRA_STORAGE);
  const extraResults = await Promise.all(extraKeys.map(key => StorageAdapter.get(EXTRA_STORAGE[key])));
  extraKeys.forEach((key, i) => {
    const raw = extraResults[i];
    if (raw) { try { state.data[key] = JSON.parse(raw); } catch (e) { state.data[key] = []; } }
  });
}

/* ---------------- Change history + Recycle bin ---------------- */
/* A short human label for any record, used in the audit trail and the
   recycle bin so both stay readable without dumping raw JSON at the user. */
function recordDisplayName(tableKey, record) {
  switch (tableKey) {
    case "hardware": return record.asset_type === "Storage" ? (record.storage_name || record.serial_number || "-") : `${record.manufacturer || ""} ${record.model || ""}`.trim() || record.serial_number || "-";
    case "clusters": return record.cluster_name || "-";
    case "servers": return record.system_name || "-";
    case "locations": return record.name || "-";
    case "vlans": return record.vlan_name || "-";
    case "network_devices": return record.device_name || "-";
    case "users": return record.username || "-";
    case "server_permissions": return `${record.folder_name || "-"} @ ${serverNameFor(record.server_id)}`;
    case "ad_users": return record.display_name || record.user_logon || "-";
    case "software_catalogue": return `${record.vendor || ""} ${record.name || ""}`.trim() || "-";
    case "software_licenses": return softwareCatalogueName(record.software_id);
    case "software_allocations": return record.target_name || "-";
    default: {
      const cfg = TABLES[tableKey];
      return (cfg && record[cfg.idField]) || "record";
    }
  }
}
async function logChange(tableKey, action, record) {
  state.data.audit_log.unshift({
    log_id: `LOG-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    table_key: tableKey,
    record_id: record[(TABLES[tableKey] || {}).idField] || "",
    display: recordDisplayName(tableKey, record),
    action,
    username: state.session ? state.session.username : "system",
    changed_at: new Date().toISOString(),
  });
  if (state.data.audit_log.length > 500) state.data.audit_log.length = 500; // cap unbounded growth
  await persistExtra("audit_log");
}

/* Per-record version snapshots — keeps only the 3 most recent versions per
   record (oldest rotates out), used by the History modal to show a
   field-level diff between consecutive versions. Separate from audit_log
   (which is an unlimited, global action timeline with no field data). */
async function pushRecordVersion(tableKey, record) {
  const cfg = TABLES[tableKey];
  const recordId = record[cfg.idField];
  const snapshot = JSON.parse(JSON.stringify(record));
  if (tableKey === "users") delete snapshot.password; // never keep a password hash in a snapshot
  state.data.record_versions.push({
    version_id: `VER-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    table_key: tableKey,
    record_id: recordId,
    snapshot,
    changed_at: new Date().toISOString(),
    username: state.session ? state.session.username : "system",
  });
  const sameRecord = state.data.record_versions.filter(v => v.table_key === tableKey && v.record_id === recordId);
  if (sameRecord.length > 3) {
    const oldestFirst = sameRecord.slice().sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
    const idsToRemove = new Set(oldestFirst.slice(0, sameRecord.length - 3).map(v => v.version_id));
    state.data.record_versions = state.data.record_versions.filter(v => !idsToRemove.has(v.version_id));
  }
  await persistExtra("record_versions");
}
/* Renders one field's value for the diff view — dates in dd/mm/yyyy, lists
   joined, blanks shown as "(empty)" so a diff against nothing is visible. */
function formatFieldValueForDiff(field, v) {
  if (v === undefined || v === null || v === "") return "(empty)";
  if (Array.isArray(v)) {
    if (!v.length) return "(empty)";
    if (field.type === "nodeList") return v.map(n => n.host_name || n.hardware_id || "?").join(", ");
    return v.join(", ");
  }
  if (field.type === "date") return formatDateDMY(v);
  return String(v);
}
function diffRecordVersions(prevSnap, curSnap, tableKey) {
  const cfg = TABLES[tableKey];
  const fieldsByKey = {};
  cfg.fields.forEach(f => { fieldsByKey[f.key] = f; });
  const keys = new Set([...(prevSnap ? Object.keys(prevSnap) : []), ...Object.keys(curSnap)]);
  const skip = new Set([cfg.idField, "created_at", "updated_at", "password"]);
  const changes = [];
  keys.forEach(k => {
    if (skip.has(k)) return;
    const f = fieldsByKey[k];
    if (!f) return; // only diff known form fields, skip internal bookkeeping keys
    const oldStr = formatFieldValueForDiff(f, prevSnap ? prevSnap[k] : undefined);
    const newStr = formatFieldValueForDiff(f, curSnap[k]);
    if (oldStr === newStr) return;
    changes.push({ label: f.label, oldStr, newStr });
  });
  return changes;
}
async function moveToRecycleBin(tableKey, record) {
  state.data.recycle_bin.unshift({
    trash_id: `TRH-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    table_key: tableKey,
    record,
    deleted_at: new Date().toISOString(),
    deleted_by: state.session ? state.session.username : "system",
  });
  await persistExtra("recycle_bin");
}
async function restoreFromRecycleBin(trashId) {
  const idx = state.data.recycle_bin.findIndex(t => t.trash_id === trashId);
  if (idx === -1) return;
  const entry = state.data.recycle_bin[idx];
  const cfg = TABLES[entry.table_key];
  if (cfg && !state.data[entry.table_key].some(r => r[cfg.idField] === entry.record[cfg.idField])) {
    state.data[entry.table_key].push(entry.record);
    await persist(entry.table_key);
    await logChange(entry.table_key, "Restore", entry.record);
  }
  state.data.recycle_bin.splice(idx, 1);
  await persistExtra("recycle_bin");
}
async function purgeFromRecycleBin(trashId) {
  state.data.recycle_bin = state.data.recycle_bin.filter(t => t.trash_id !== trashId);
  await persistExtra("recycle_bin");
}

/* ---------------- Helpers ---------------- */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function getPlainText(html) {
  return String(html ?? "").replace(/<[^>]*>/g, "").trim();
}
const IPV4_RE = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
function isValidIPv4(value) {
  return IPV4_RE.test(String(value || "").trim());
}
function filterIpKeystroke(el) {
  el.addEventListener("input", () => {
    const cleaned = el.value.replace(/[^0-9.]/g, "");
    if (cleaned !== el.value) el.value = cleaned;
  });
}
function getColumnDisplayValue(col, row) {
  return col.render ? col.render(row) : (row[col.key] || "-");
}
function getTypeFilteredRows(tableKey) {
  let rows = state.data[tableKey];
  const fcfg = FILTER_BARS[tableKey];
  if (fcfg && state[fcfg.stateKey] !== "all") {
    rows = rows.filter(r => r[fcfg.field] === state[fcfg.stateKey]);
  }
  return rows;
}
function statusBadge(value) {
  if (!value) return "-";
  const cls = `status-${value}`.replace(/\s+/g, "");
  return `<span class="badge ${cls}">${escapeHtml(value)}</span>`;
}
function typeBadge(value) {
  if (!value) return "-";
  return `<span class="badge type-${value}">${escapeHtml(value)}</span>`;
}
function roleBadge(value) {
  if (!value) return "-";
  return `<span class="badge role-${value}">${escapeHtml(value)}</span>`;
}
/* Every date is displayed dd/mm/yyyy across the app. formatDateDMY parses a
   pure "yyyy-mm-dd" date string directly (no Date object) so it can't shift
   by a day in timezones behind UTC. formatDateTimeDMY is for real timestamps
   (audit log, recycle bin) where converting to local time is correct. */
function formatDateDMY(dateStr) {
  if (!dateStr) return "-";
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "-";
}
/* dd/mm/yyyy masked date input: the user types into a plain text box, and a
   sibling hidden input (same id every date field used before) keeps holding
   the real yyyy-mm-dd value so every other date-consuming codepath (list
   columns, warrantyStatus, sort, validation) needs no change at all. */
function isoToDmyInput(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
function dmyInputToIso(dmy) {
  const m = String(dmy || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const dd = Number(m[1]), mm = Number(m[2]), yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const check = new Date(yyyy, mm - 1, dd);
  if (check.getFullYear() !== yyyy || check.getMonth() !== mm - 1 || check.getDate() !== dd) return "";
  return `${yyyy}-${m[2]}-${m[1]}`;
}
function wireDateMaskInput(displayEl, hiddenEl) {
  displayEl.addEventListener("input", () => {
    const digits = displayEl.value.replace(/\D/g, "").slice(0, 8);
    let out = digits.slice(0, 2);
    if (digits.length > 2) out += "/" + digits.slice(2, 4);
    if (digits.length > 4) out += "/" + digits.slice(4, 8);
    displayEl.value = out;
    hiddenEl.value = dmyInputToIso(out);
    hiddenEl.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function wireDateMaskInputs(scopeEl) {
  if (!scopeEl) return;
  scopeEl.querySelectorAll("[data-date-display]").forEach(displayEl => {
    if (displayEl.dataset.dmWired) return;
    displayEl.dataset.dmWired = "1";
    const hiddenEl = document.getElementById("f_" + displayEl.dataset.dateDisplay);
    if (hiddenEl) wireDateMaskInput(displayEl, hiddenEl);
  });
}

/* Four-octet IP input: each box only accepts 0-255, auto-advances after 3
   digits or on ".", and keeps a hidden input (the field's real id) joined
   with dots in sync — so isValidIPv4/list rendering/etc. need no change. */
function wireIpOctetGroups(scopeEl) {
  if (!scopeEl) return;
  scopeEl.querySelectorAll(".ip-input-group").forEach(group => {
    if (group.dataset.ipWired) return;
    group.dataset.ipWired = "1";
    const hidden = group.querySelector('input[type="hidden"]');
    const octets = Array.from(group.querySelectorAll(".ip-octet"));
    function updateHidden() {
      const parts = octets.map(o => o.value);
      hidden.value = parts.every(p => p === "") ? "" : parts.join(".");
      hidden.dispatchEvent(new Event("input", { bubbles: true }));
    }
    octets.forEach((input, idx) => {
      input.addEventListener("input", () => {
        let v = input.value.replace(/\D/g, "").slice(0, 3);
        if (v !== "" && parseInt(v, 10) > 255) v = v.slice(0, 2);
        input.value = v;
        if (v.length === 3 && idx < octets.length - 1) {
          octets[idx + 1].focus();
          octets[idx + 1].select();
        }
        updateHidden();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === ".") {
          e.preventDefault();
          if (idx < octets.length - 1) { octets[idx + 1].focus(); octets[idx + 1].select(); }
        } else if (e.key === "Backspace" && input.value === "" && idx > 0) {
          octets[idx - 1].focus();
        }
      });
    });
  });
}

function setIpFieldValue(key, dotted) {
  const hidden = document.getElementById("f_" + key);
  if (hidden) hidden.value = dotted || "";
  const octets = String(dotted || "").split(".");
  const group = hidden ? hidden.closest(".ip-input-group") : null;
  if (!group) return;
  group.querySelectorAll(".ip-octet").forEach((el, i) => { el.value = octets[i] || ""; });
}

/* Warranty expiry (hardware & network devices) is never typed directly —
   it's Commission date + Warranty period (years), recomputed live. */
function computeWarrantyExpiry(commissionIso, years) {
  const m = String(commissionIso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const y = Number(years);
  if (!m || !y) return "";
  const d = new Date(Number(m[1]) + y, Number(m[2]) - 1, Number(m[3]));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function setDateFieldValue(key, iso) {
  const hidden = document.getElementById("f_" + key);
  if (hidden) hidden.value = iso;
  const display = document.querySelector(`[data-date-display="${key}"]`);
  if (display) display.value = isoToDmyInput(iso);
}
function wireWarrantyAutoCalc() {
  if (!state.editing) return;
  if (state.editing.tableKey !== "hardware" && state.editing.tableKey !== "network_devices") return;
  const commissionDisplay = document.querySelector('[data-date-display="commission_date"]');
  const yearsEl = document.getElementById("f_warranty_years");
  if (!commissionDisplay || !yearsEl) return;
  function recalc() {
    const commissionIso = document.getElementById("f_commission_date")?.value || "";
    setDateFieldValue("warranty_expiry", computeWarrantyExpiry(commissionIso, yearsEl.value));
  }
  commissionDisplay.addEventListener("input", recalc);
  yearsEl.addEventListener("change", recalc);
}
function formatDateTimeDMY(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

/* Warranty/license status is always computed from the date, never stored —
   so it can't go stale relative to today's date. */
function warrantyStatus(dateStr) {
  if (!dateStr) return null;
  const days = (new Date(dateStr) - new Date()) / 86400000;
  if (days < 0) return "Expired";
  if (days <= 90) return "Expiring Soon";
  return "OK";
}

/* ---------------- Access control ---------------- */
const SESSION_KEY = "inv::__session";
function currentRole() { return state.session ? state.session.role : null; }
function canWrite() { return currentRole() === "Admin" || currentRole() === "User"; }
function canManageUsers() { return currentRole() === "Admin"; }
function tableWritable(tableKey) { return tableKey === "users" ? canManageUsers() : canWrite(); }

/* Role-parameterised versions of the three functions above, used by the
   Access check tool to answer "what could role X do" without needing to
   actually sign in as that role. */
function canWriteAs(role) { return role === "Admin" || role === "User"; }
function canManageUsersAs(role) { return role === "Admin"; }
function tableWritableAs(tableKey, role) { return tableKey === "users" ? canManageUsersAs(role) : canWriteAs(role); }
/* Mirrors which nav sections are visible per role (see applyPermissions) —
   Permission Control is Admin-only, Governance is Admin/User, everything
   else is visible to every signed-in role including Viewer. */
function tableViewableAs(tableKey, role) {
  if (tableKey === "users" || tableKey === "server_permissions") return canManageUsersAs(role);
  return true;
}
function sectionVisibleAs(sectionKey, role) {
  if (sectionKey === "administration" || sectionKey === "permission_control") return canManageUsersAs(role);
  if (sectionKey === "governance") return canWriteAs(role);
  return true;
}

/* Passwords are never kept in plaintext, even in this client-only prototype —
   hash with SHA-256 before storing or comparing. A real backend should use a
   proper salted hash (e.g. bcrypt/argon2); this is the best a static page can do. */
async function sha256Hex(text) {
  if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) { /* e.g. insecure context — fall through */ }
  }
  // crypto.subtle needs a secure context (HTTPS/localhost). This intranet tool may be
  // served over plain HTTP, so fall back to a simple non-cryptographic hash rather than
  // breaking login entirely — it's convenience-layer obfuscation either way, not real security.
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

async function seedUsers() {
  const today = new Date().toISOString().slice(0, 10);
  state.data.users = [
    { user_id: "USR-001", full_name: "Administrator", username: "admin", password: await sha256Hex("admin123"), role: "Admin", status: "Active", created_at: today, updated_at: today },
  ];
}

function saveSession() { try { localStorage.setItem(SESSION_KEY, JSON.stringify(state.session)); } catch (e) {} }
function clearSession() { state.session = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    const u = state.data.users.find(u => u.user_id === s.user_id && u.status === "Active");
    if (!u) { clearSession(); return false; }
    state.session = { user_id: u.user_id, username: u.username, role: u.role, full_name: u.full_name };
    return true;
  } catch (e) { return false; }
}

/* "Administrator" -> "AD", "Somchai Pattana" -> "SP" — a short, stable
   fallback avatar when there's no photo to show. */
function initialsFor(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function updateUserChip() {
  const chip = document.getElementById("userChip");
  if (!state.session) { chip.hidden = true; return; }
  chip.hidden = false;
  const name = state.session.full_name || state.session.username;
  document.getElementById("userChipName").textContent = name;
  document.getElementById("userChipRole").textContent = state.session.role;
  document.getElementById("userAvatar").textContent = initialsFor(name);
}

const PERMISSION_ONLY_TABLES = ["permission_dashboard", "access_check", "ad_users", "server_permissions"];
const GOVERNANCE_ONLY_TABLES = ["warranty_assets", "ma_renewal_history", "change_history", "recycle_bin"];
function applyPermissions() {
  const role = currentRole();
  document.getElementById("adminSection").hidden = !sectionVisibleAs("administration", role);
  document.getElementById("permissionSection").hidden = !sectionVisibleAs("permission_control", role);
  document.getElementById("governanceSection").hidden = !sectionVisibleAs("governance", role);
  updateUserChip();
  if (state.activeTable === "users" && !canManageUsers()) state.activeTable = "dashboard";
  if (PERMISSION_ONLY_TABLES.includes(state.activeTable) && !canManageUsers()) state.activeTable = "dashboard";
  if (GOVERNANCE_ONLY_TABLES.includes(state.activeTable) && !canWrite()) state.activeTable = "dashboard";
}

function showApp() {
  document.getElementById("loginScreen").hidden = true;
  applyPermissions();
  switchTable(state.activeTable);
}
async function showLogin() {
  document.getElementById("loginScreen").hidden = false;
  const admin = state.data.users.find(u => u.username === "admin");
  const isDefaultPassword = admin && admin.password === await sha256Hex("admin123");
  document.getElementById("loginHint").textContent = isDefaultPassword ? "Default admin — username: admin  ·  password: admin123" : "";
}
function generateId(cfg) {
  const arr = state.data[cfg.key];
  const n = arr.reduce((max, r) => {
    const parts = String(r[cfg.idField] || "").split("-");
    const num = parseInt(parts[1] || "0", 10);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0) + 1;
  return `${cfg.idPrefix}-${String(n).padStart(3, "0")}`;
}

/* ---------------- Custom (non-CRUD) views ---------------- */
/* A small table builder shared by the read-only views below — they don't
   need the generic engine's sort/filter/pagination, just a styled table. */
function buildSimpleTable(columns, rows, opts = {}) {
  if (!rows.length) return `<p class="empty-state">${escapeHtml(opts.emptyText || "No records.")}</p>`;
  const head = `<thead><tr>${columns.map(c => `<th><div class="th-inner"><span class="col-sort" style="cursor:default;">${escapeHtml(c.label)}</span></div></th>`).join("")}${opts.actionsLabel ? `<th>${escapeHtml(opts.actionsLabel)}</th>` : ""}</tr></thead>`;
  const body = rows.map(r => {
    const cells = columns.map(c => `<td class="${c.mono ? "mono" : ""}">${c.render ? c.render(r) : escapeHtml(r[c.key] ?? "-")}</td>`).join("");
    const actionsCell = opts.actions ? `<td><div class="row-actions">${opts.actions(r)}</div></td>` : "";
    return `<tr>${cells}${actionsCell}</tr>`;
  }).join("");
  return `<div class="table-scroll"><table>${head}<tbody>${body}</tbody></table></div>`;
}

function renderDashboardView() {
  const warrantyRows = [...state.data.hardware, ...state.data.network_devices].filter(h => h.warranty_expiry);
  const soonWarranty = warrantyRows.filter(h => warrantyStatus(h.warranty_expiry) === "Expiring Soon").length;
  const expiredWarranty = warrantyRows.filter(h => warrantyStatus(h.warranty_expiry) === "Expired").length;
  const recent = state.data.audit_log.slice(0, 6);
  const stats = [
    ["Servers", state.data.servers.length, false],
    ["Hardware assets", state.data.hardware.length, false],
    ["Network devices", state.data.network_devices.length, false],
    ["VLANs", state.data.vlans.length, false],
    ["Warranty expired / expiring", expiredWarranty + soonWarranty, (expiredWarranty + soonWarranty) > 0],
    ["Recycle bin items", state.data.recycle_bin.length, false],
  ];
  return `
    <section class="view-block">
      <p class="section-title">Infrastructure at a glance</p>
      <div class="stat-grid">
        ${stats.map(([label, value, warn]) => `<div class="stat-card${warn ? " warn" : ""}"><div class="stat-value">${value}</div><div class="stat-label">${escapeHtml(label)}</div></div>`).join("")}
      </div>
    </section>
    <section class="view-block">
      <p class="section-title">Recent activity</p>
      <div class="activity-list">
        ${recent.length ? recent.map(r => `<div class="activity-row">
            <span><span class="badge type-${escapeHtml(r.action)}">${escapeHtml(r.action)}</span> ${escapeHtml(r.display || r.record_id)} <span class="activity-meta">(${escapeHtml((TABLES[r.table_key] || {}).label || r.table_key)})</span></span>
            <span class="activity-meta">${escapeHtml(r.username)} · ${formatDateTimeDMY(r.changed_at)}</span>
          </div>`).join("") : `<p class="muted">No activity recorded yet.</p>`}
      </div>
    </section>`;
}

function renderPermissionDashboardView() {
  const adUsers = state.data.ad_users;
  const disabledUsers = adUsers.filter(u => u.status === "Disabled").length;
  const noGroupUsers = adUsers.filter(u => !state.data.ad_memberships.some(m => m.ad_user_id === u.ad_user_id)).length;
  const allGroupNames = new Set([
    ...state.data.ad_memberships.map(m => m.group_name),
    ...state.data.server_permissions.flatMap(p => [p.rw_group, p.ro_group]).filter(Boolean),
  ]);
  const fileServerIds = new Set(state.data.server_permissions.map(p => p.server_id));
  const foldersNoGroup = state.data.server_permissions.filter(p => !p.rw_group && !p.ro_group).length;
  const summaryTiles = [
    ["Users", adUsers.length, false],
    ["Disabled", disabledUsers, disabledUsers > 0],
    ["Memberships", state.data.ad_memberships.length, false],
    ["AD Groups", allGroupNames.size, false],
    ["No group", noGroupUsers, noGroupUsers > 0],
    ["Folders", state.data.server_permissions.length, false],
    ["File Servers", fileServerIds.size, false],
    ["Folders w/o group", foldersNoGroup, foldersNoGroup > 0],
  ];

  const deptMap = {};
  state.data.server_permissions.forEach(p => {
    const dept = p.department || "(no department)";
    if (!deptMap[dept]) deptMap[dept] = { folders: 0, quota: 0, noGroup: 0 };
    deptMap[dept].folders += 1;
    deptMap[dept].quota += Number(p.quota_gb) || 0;
    if (!p.rw_group && !p.ro_group) deptMap[dept].noGroup += 1;
  });
  const deptRows = Object.entries(deptMap)
    .map(([department, v]) => ({ department, folders: v.folders, quota: v.quota, noGroup: v.noGroup }))
    .sort((a, b) => b.folders - a.folders);

  const serverMap = {};
  state.data.server_permissions.forEach(p => {
    const name = serverNameFor(p.server_id);
    serverMap[name] = (serverMap[name] || 0) + 1;
  });
  const topServerRows = Object.entries(serverMap)
    .map(([server, folders]) => ({ server, folders }))
    .sort((a, b) => b.folders - a.folders)
    .slice(0, 5);

  const knownGroups = new Set(state.data.ad_memberships.map(m => m.group_name));
  const orphanGroups = [...new Set(
    state.data.server_permissions.flatMap(p => [p.rw_group, p.ro_group]).filter(g => g && !knownGroups.has(g))
  )];
  const recentActivity = state.data.audit_log
    .filter(l => l.table_key === "server_permissions" || l.table_key === "ad_users")
    .slice(0, 6);

  return `
    <section class="view-block">
      <p class="section-title">Permission Control at a glance</p>
      <div class="stat-grid">
        ${summaryTiles.map(([label, value, warn]) => `<div class="stat-card${warn ? " warn" : ""}"><div class="stat-value">${value}</div><div class="stat-label">${escapeHtml(label)}</div></div>`).join("")}
      </div>
    </section>
    <section class="card" style="padding:16px 18px;">
      <p class="section-title">Folders &amp; quota by department</p>
      ${buildSimpleTable([
        { key: "department", label: "Department" },
        { key: "folders", label: "Folders" },
        { key: "quota", label: "Quota (GB)" },
        { key: "noGroup", label: "No AD group", render: r => r.noGroup > 0 ? `<span class="badge status-Expired">${r.noGroup}</span>` : "0" },
      ], deptRows, { emptyText: "No Server Permission folders recorded yet." })}
    </section>
    <section class="card" style="padding:16px 18px;">
      <p class="section-title">Top File Servers by folder count</p>
      ${buildSimpleTable([
        { key: "server", label: "File Server" },
        { key: "folders", label: "Folders" },
      ], topServerRows, { emptyText: "No Server Permission folders recorded yet." })}
    </section>
    <section class="card" style="padding:16px 18px;">
      <p class="section-title">Orphan AD groups</p>
      <p class="muted" style="margin-top:-4px;">AD groups referenced by a Server Permission folder (Read/Write or Read-only) with no AD user assigned to them.</p>
      ${orphanGroups.length
        ? `<div class="stat-grid">${orphanGroups.map(g => `<div class="stat-card warn"><div class="stat-value" style="font-size:14px;">${escapeHtml(g)}</div><div class="stat-label">0 members</div></div>`).join("")}</div>`
        : `<p class="empty-state">No orphan AD groups — every group referenced by a folder has at least one member.</p>`}
    </section>
    <section class="view-block">
      <p class="section-title">Recent permission activity</p>
      <div class="activity-list">
        ${recentActivity.length ? recentActivity.map(r => `<div class="activity-row">
            <span><span class="badge type-${escapeHtml(r.action)}">${escapeHtml(r.action)}</span> ${escapeHtml(r.display || r.record_id)} <span class="activity-meta">(${escapeHtml((TABLES[r.table_key] || {}).label || r.table_key)})</span></span>
            <span class="activity-meta">${escapeHtml(r.username)} · ${formatDateTimeDMY(r.changed_at)}</span>
          </div>`).join("") : `<p class="muted">No permission changes recorded yet.</p>`}
      </div>
    </section>`;
}

function renderAccessCheckView() {
  return renderAccessLookupSection();
}

/* Which folders an AD user reaches (via ad_memberships + server_permissions)
   or who reaches a given folder — real data, not the role-capability table above. */
function foldersForAdUser(adUserId) {
  const groups = new Set(state.data.ad_memberships.filter(m => m.ad_user_id === adUserId).map(m => m.group_name));
  return state.data.server_permissions
    .filter(p => (p.rw_group && groups.has(p.rw_group)) || (p.ro_group && groups.has(p.ro_group)))
    .map(p => {
      const rw = p.rw_group && groups.has(p.rw_group);
      return { folder_name: p.folder_name, folder_path: p.folder_path, server: serverNameFor(p.server_id),
               access: rw ? "Read/Write" : "Read only", via: rw ? p.rw_group : p.ro_group, quota_gb: p.quota_gb };
    });
}
function peopleForFolder(permission) {
  const people = [];
  const addFrom = (groupName, access) => {
    if (!groupName) return;
    state.data.ad_memberships.filter(m => m.group_name === groupName).forEach(m => {
      const u = state.data.ad_users.find(a => a.ad_user_id === m.ad_user_id);
      if (u) people.push({ user_logon: u.user_logon, display_name: u.display_name, department: u.department, status: u.status, access, via: groupName });
    });
  };
  addFrom(permission.rw_group, "Read/Write");
  addFrom(permission.ro_group, "Read only");
  return people;
}
function renderAccessLookupSection() {
  if (!state.accessLookup) state.accessLookup = { mode: "user", query: "" };
  const { mode, query } = state.accessLookup;
  const q = query.trim().toLowerCase();
  let resultHtml = `<p class="muted">Type a user logon or a folder name to look up real AD-group-based access.</p>`;

  if (q.length >= 2 && mode === "user") {
    const matches = state.data.ad_users.filter(u =>
      (u.user_logon || "").toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q)).slice(0, 5);
    resultHtml = matches.length ? matches.map(u => {
      const folders = foldersForAdUser(u.ad_user_id);
      return `<div class="access-lookup-card">
        <p class="access-lookup-card-title">${escapeHtml(u.display_name || u.user_logon)} <span class="muted">(${escapeHtml(u.user_logon)})</span> ${statusBadge(u.status)}</p>
        <p class="muted">${escapeHtml(u.department || "-")} · ${folders.length} folder(s) reachable</p>
        ${buildSimpleTable([
          { key: "folder_name", label: "Folder" }, { key: "server", label: "Server" },
          { key: "access", label: "Access", render: r => statusBadge(r.access === "Read/Write" ? "Enabled" : "Disabled") },
          { key: "via", label: "Via AD group", mono: true }, { key: "quota_gb", label: "Quota (GB)" },
        ], folders, { emptyText: "No folders reachable via this user's AD groups." })}
      </div>`;
    }).join("") : `<p class="empty-state">No AD user matches "${escapeHtml(query)}".</p>`;
  } else if (q.length >= 2 && mode === "folder") {
    const matches = state.data.server_permissions.filter(p => (p.folder_name || "").toLowerCase().includes(q)).slice(0, 5);
    resultHtml = matches.length ? matches.map(p => {
      const people = peopleForFolder(p);
      return `<div class="access-lookup-card">
        <p class="access-lookup-card-title">${escapeHtml(p.folder_name)} <span class="muted">@ ${escapeHtml(serverNameFor(p.server_id))}</span></p>
        <p class="muted">${escapeHtml(p.folder_path || "-")} · ${people.length} people</p>
        ${buildSimpleTable([
          { key: "user_logon", label: "User", mono: true }, { key: "display_name", label: "Display name" },
          { key: "department", label: "Department" },
          { key: "access", label: "Access", render: r => statusBadge(r.access === "Read/Write" ? "Enabled" : "Disabled") },
          { key: "via", label: "Via AD group", mono: true },
        ], people, { emptyText: "No AD user belongs to this folder's Read/Write or Read-only group yet." })}
      </div>`;
    }).join("") : `<p class="empty-state">No folder matches "${escapeHtml(query)}".</p>`;
  }

  return `
    <section class="view-block">
      <p class="section-title">Access check</p>
      <div class="access-check-controls">
        <label>Look up by
          <select id="accessLookupMode">
            <option value="user" ${mode === "user" ? "selected" : ""}>AD user → folders they can reach</option>
            <option value="folder" ${mode === "folder" ? "selected" : ""}>Folder → who can reach it</option>
          </select>
        </label>
        <label>${mode === "user" ? "User logon or name" : "Folder name"}
          <input type="text" id="accessLookupQuery" value="${escapeHtml(query)}" placeholder="${mode === "user" ? "e.g. somchai.p" : "e.g. Production Control"}" autocomplete="off">
        </label>
      </div>
      <div style="margin-top:12px;">${resultHtml}</div>
    </section>`;
}

function renderWarrantyAssetsView() {
  const hwRows = state.data.hardware
    .filter(h => h.warranty_expiry)
    .map(h => ({
      _category: "Hardware",
      _identity: h.asset_type === "Storage" ? (h.storage_name || "-") : `${h.manufacturer || "-"} ${h.model || ""}`.trim(),
      serial_number: h.serial_number,
      _location: `${h.site || "-"}${h.rack_number ? " / " + h.rack_number : ""}`,
      warranty_expiry: h.warranty_expiry,
      _status: warrantyStatus(h.warranty_expiry),
    }));
  const netRows = state.data.network_devices
    .filter(n => n.warranty_expiry)
    .map(n => ({
      _category: "Network",
      _identity: n.device_name || "-",
      serial_number: n.serial_number,
      _location: `${locationFullPathFor(n.location_id) || "-"}${n.rack_number ? " / " + n.rack_number : ""}`,
      warranty_expiry: n.warranty_expiry,
      _status: warrantyStatus(n.warranty_expiry),
    }));
  const rows = [...hwRows, ...netRows].sort((a, b) => new Date(a.warranty_expiry) - new Date(b.warranty_expiry));
  const expired = rows.filter(r => r._status === "Expired").length;
  const soon = rows.filter(r => r._status === "Expiring Soon").length;
  const cols = [
    { key: "_category", label: "Category", render: r => typeBadge(r._category) },
    { key: "_identity", label: "Asset", render: r => escapeHtml(r._identity) },
    { key: "serial_number", label: "Serial number", mono: true },
    { key: "_location", label: "Location", render: r => escapeHtml(r._location) },
    { key: "warranty_expiry", label: "Warranty expiry", mono: true, render: r => formatDateDMY(r.warranty_expiry) },
    { key: "_status", label: "Status", render: r => statusBadge(r._status) },
  ];
  return `
    <section class="view-block">
      <div class="stat-grid">
        <div class="stat-card${expired ? " danger" : ""}"><div class="stat-value">${expired}</div><div class="stat-label">Expired</div></div>
        <div class="stat-card${soon ? " warn" : ""}"><div class="stat-value">${soon}</div><div class="stat-label">Expiring within 90 days</div></div>
        <div class="stat-card"><div class="stat-value">${rows.length}</div><div class="stat-label">Assets tracked</div></div>
      </div>
    </section>
    <section class="card">${buildSimpleTable(cols, rows, { emptyText: "No hardware or network devices with a warranty date recorded yet." })}</section>`;
}

/* Hardware MA renewal history — every cost is THB, so a grand total can be
   summed directly without any currency conversion. */
function renderMaRenewalHistoryView() {
  const rows = state.data.hardware.flatMap(h => (h.ma_renewal_history || []).map(rn => ({
    _type: "Hardware MA", _asset: recordDisplayName("hardware", h), ...rn,
  }))).sort((a, b) => new Date(b.renewed_at) - new Date(a.renewed_at));
  const totalThb = rows.reduce((sum, r) => sum + (Number(r.cost_thb) || 0), 0);
  const thisYear = new Date().getFullYear();
  const totalThisYear = rows.filter(r => new Date(r.renewed_at).getFullYear() === thisYear).reduce((sum, r) => sum + (Number(r.cost_thb) || 0), 0);
  const cols = [
    { key: "renewed_at", label: "Renewed on", mono: true, render: r => escapeHtml(formatDateTimeDMY(r.renewed_at)) },
    { key: "_type", label: "Type", render: r => typeBadge("Hardware") },
    { key: "_asset", label: "Asset" },
    { key: "contract_no", label: "Contract No.", render: r => escapeHtml(r.contract_no || "-") },
    { key: "period", label: "Period", render: r => `${escapeHtml(formatDateDMY(r.start_date) || "-")} → ${escapeHtml(formatDateDMY(r.end_date))}` },
    { key: "cost_thb", label: "Cost (THB)", mono: true, render: r => Number(r.cost_thb || 0).toLocaleString("th-TH") },
    { key: "renewed_by", label: "By" },
  ];
  return `
    <section class="view-block">
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${rows.length}</div><div class="stat-label">Renewals recorded</div></div>
        <div class="stat-card"><div class="stat-value">${totalThb.toLocaleString("th-TH")}</div><div class="stat-label">Total spend (THB)</div></div>
        <div class="stat-card"><div class="stat-value">${totalThisYear.toLocaleString("th-TH")}</div><div class="stat-label">Spend in ${thisYear} (THB)</div></div>
      </div>
    </section>
    <section class="card">${buildSimpleTable(cols, rows, { emptyText: "No MA renewals recorded yet — use the Renew MA button on Server hardware." })}</section>`;
}

function renderChangeHistoryView() {
  const cols = [
    { key: "changed_at", label: "When", mono: true, render: r => escapeHtml(formatDateTimeDMY(r.changed_at)) },
    { key: "table_key", label: "Module", render: r => escapeHtml((TABLES[r.table_key] || {}).label || r.table_key) },
    { key: "display", label: "Record" },
    { key: "action", label: "Action", render: r => `<span class="badge type-${escapeHtml(r.action)}">${escapeHtml(r.action)}</span>` },
    { key: "username", label: "By" },
  ];
  return `<section class="card">${buildSimpleTable(cols, state.data.audit_log.slice(0, 200), { emptyText: "No changes recorded yet." })}</section>`;
}

function renderRecycleBinView() {
  const cols = [
    { key: "table_key", label: "Module", render: r => escapeHtml((TABLES[r.table_key] || {}).label || r.table_key) },
    { key: "display", label: "Record", render: r => escapeHtml(recordDisplayName(r.table_key, r.record)) },
    { key: "deleted_at", label: "Deleted", mono: true, render: r => escapeHtml(formatDateTimeDMY(r.deleted_at)) },
    { key: "deleted_by", label: "Deleted by" },
  ];
  const writable = canWrite();
  return `<section class="card">${buildSimpleTable(cols, state.data.recycle_bin, {
    emptyText: "Recycle bin is empty.",
    actionsLabel: writable ? "Actions" : null,
    actions: writable ? (r => `
      <button type="button" class="icon-btn" data-action="restore" data-trash="${escapeHtml(r.trash_id)}">Restore</button>
      <button type="button" class="icon-btn danger" data-action="purge" data-trash="${escapeHtml(r.trash_id)}">Delete forever</button>
    `) : null,
  })}</section>`;
}

/* ---------------- Software Management helpers ---------------- */
function softwareCatalogueName(softwareId) {
  const sc = state.data.software_catalogue.find(s => s.software_id === softwareId);
  if (!sc) return "-";
  return `${sc.vendor || ""} ${sc.name || ""}${sc.edition ? " " + sc.edition : ""}`.trim() || "-";
}
function licenseUsedQty(licenseId) {
  return state.data.software_allocations
    .filter(a => a.license_id === licenseId)
    .reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
}
/* Perpetual licenses (no expiry_date) are always "Active" — warrantyStatus()
   only distinguishes Expired / Expiring Soon / OK, so map its "OK" to the
   more license-appropriate "Active" wording used everywhere else here. */
function licenseStatus(lic) {
  if (!lic.expiry_date) return "Active";
  const s = warrantyStatus(lic.expiry_date);
  return s === "OK" ? "Active" : s;
}
/* A new/edited allocation can't push total allocated quantity past what was
   purchased on the license — mirrors the same guard the Software Management
   prototype had in saveAllocation(). */
function validateSoftwareAllocation(values, excludeId) {
  if (!values.license_id || !values.quantity) return [];
  const lic = state.data.software_licenses.find(l => l.license_id === values.license_id);
  if (!lic) return [];
  const usedByOthers = state.data.software_allocations
    .filter(a => a.license_id === values.license_id && a.allocation_id !== excludeId)
    .reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  const requested = Number(values.quantity) || 0;
  const available = (Number(lic.purchased_qty) || 0) - usedByOthers;
  if (requested > available) {
    return [`Quantity exceeds available license: purchased ${lic.purchased_qty}, already allocated ${usedByOthers}, available ${available}`];
  }
  return [];
}

function renderSoftwareDashboardView() {
  const catalogue = state.data.software_catalogue;
  const licenses = state.data.software_licenses;
  const activeCount = licenses.filter(l => licenseStatus(l) === "Active").length;
  const expiringCount = licenses.filter(l => licenseStatus(l) === "Expiring Soon").length;
  const expiredCount = licenses.filter(l => licenseStatus(l) === "Expired").length;
  const stats = [
    ["Software Catalogue", catalogue.length, false],
    ["Active licenses", activeCount, false],
    ["Expiring ≤ 90 days", expiringCount, expiringCount > 0],
    ["Expired", expiredCount, expiredCount > 0],
  ];
  const utilizationRows = licenses.map(l => ({
    software: softwareCatalogueName(l.software_id),
    used: licenseUsedQty(l.license_id),
    purchased: Number(l.purchased_qty) || 0,
    unit: l.unit || "",
  }));
  const expiryRows = licenses
    .filter(l => l.expiry_date)
    .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
    .map(l => ({ software: softwareCatalogueName(l.software_id), expiry: l.expiry_date, status: licenseStatus(l) }));

  return `
    <section class="view-block">
      <p class="section-title">License Dashboard</p>
      <div class="stat-grid">
        ${stats.map(([label, value, warn]) => `<div class="stat-card${warn ? " warn" : ""}"><div class="stat-value">${value}</div><div class="stat-label">${escapeHtml(label)}</div></div>`).join("")}
      </div>
    </section>
    <section class="card" style="padding:16px 18px;">
      <p class="section-title">License utilization</p>
      ${buildSimpleTable([
        { key: "software", label: "Software" },
        { key: "used", label: "Used", render: r => `${r.used} ${r.unit}`.trim() },
        { key: "purchased", label: "Purchased", render: r => `${r.purchased} ${r.unit}`.trim() },
        { key: "available", label: "Available", render: r => `${r.purchased - r.used} ${r.unit}`.trim() },
      ], utilizationRows, { emptyText: "No licenses recorded yet." })}
    </section>
    <section class="card" style="padding:16px 18px;">
      <p class="section-title">Expiring / expired licenses</p>
      ${buildSimpleTable([
        { key: "software", label: "Software" },
        { key: "expiry", label: "Expiry", render: r => formatDateDMY(r.expiry) },
        { key: "status", label: "Status", render: r => statusBadge(r.status) },
      ], expiryRows, { emptyText: "No licenses with an expiry date." })}
    </section>`;
}

function renderSoftwareMasterView() {
  const makeTable = (label, catalogKey) =>
    buildSimpleTable([{ key: "value", label }], getCatalog(catalogKey).map(value => ({ value })), { emptyText: "No values yet." });
  return `
    <section class="view-block">
      <p class="section-title">Master Data</p>
      <p class="muted">Extend these lists from the "+ Add" button next to the matching field in Software Catalogue / License Control.</p>
    </section>
    <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);">
      <div class="card" style="padding:16px 18px;"><p class="section-title">Software Category</p>${makeTable("Category", "software_category")}</div>
      <div class="card" style="padding:16px 18px;"><p class="section-title">License Metric</p>${makeTable("Metric", "license_metric")}</div>
      <div class="card" style="padding:16px 18px;"><p class="section-title">Software Type</p>${makeTable("Type", "software_type")}</div>
      <div class="card" style="padding:16px 18px;"><p class="section-title">License Type</p>${makeTable("License Type", "license_type")}</div>
    </div>`;
}

const CUSTOM_VIEWS = {
  dashboard: { label: "Dashboard", desc: "Live summary of the infrastructure inventory", render: renderDashboardView },
  permission_dashboard: { label: "Permission dashboard", desc: "AD users, groups and folder coverage at a glance", render: renderPermissionDashboardView },
  access_check: { label: "Access check", desc: "Look up which folders an AD user can reach, or who can reach a given folder", render: renderAccessCheckView },
  warranty_assets: { label: "Warranty & assets", desc: "Hardware warranty coverage at a glance", render: renderWarrantyAssetsView },
  ma_renewal_history: { label: "MA / Renewal history", desc: "Every Hardware MA renewal, with THB cost, for spend audit", render: renderMaRenewalHistoryView },
  software_dashboard: { label: "License Dashboard", desc: "Software licensing at a glance — utilization, expiring and expired licenses", render: renderSoftwareDashboardView },
  software_master: { label: "Category / Vendor / Metric", desc: "Master data used by the Software Catalogue and License Control forms", render: renderSoftwareMasterView },
  change_history: { label: "Change history", desc: "Audit trail of create / update / delete / restore actions", render: renderChangeHistoryView },
  recycle_bin: { label: "Recycle bin", desc: "Deleted records — restore them or purge them permanently", render: renderRecycleBinView },
};
function renderCustomView(tableKey) {
  document.getElementById("genericCard").hidden = true;
  const cv = document.getElementById("customView");
  cv.hidden = false;
  const view = CUSTOM_VIEWS[tableKey];
  cv.innerHTML = view.render();
  if (view.mount) view.mount();
}

function switchTable(tableKey) {
  state.activeTable = tableKey;
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.table === tableKey);
  });
  const cfg = TABLES[tableKey];
  const view = CUSTOM_VIEWS[tableKey];
  document.getElementById("pageTitle").textContent = cfg ? cfg.label : view.label;
  document.getElementById("pageDesc").textContent = cfg ? cfg.desc : view.desc;
  document.getElementById("addBtn").hidden = !(cfg && !cfg.noAdd && tableWritable(tableKey));
  closeForm();
  if (cfg) {
    document.getElementById("customView").hidden = true;
    document.getElementById("genericCard").hidden = false;
    renderTable(tableKey);
  } else {
    renderCustomView(tableKey);
  }
}

/* ---------------- Rendering: filter bar (type-split tables) ---------------- */
const FILTER_BARS = {
  servers: { stateKey: "serverFilter", field: "hosting_type", options: [["all", "All"], ["Virtual", "Virtual Machine"], ["Physical", "Physical Server"]] },
  hardware: { stateKey: "hardwareFilter", field: "asset_type", options: [["all", "All"], ["Server", "Server"], ["Storage", "Storage"]] },
  network_devices: { stateKey: "networkCategoryFilter", field: "category", options: [["all", "All"], ...Object.keys(NETWORK_CATEGORIES).map(c => [c, c])] },
};

function renderFilterBar(tableKey) {
  const bar = document.getElementById("filterBar");
  const fcfg = FILTER_BARS[tableKey];
  if (!fcfg) { bar.hidden = true; bar.innerHTML = ""; return; }
  bar.hidden = false;
  bar.innerHTML = fcfg.options.map(([val, label]) =>
    `<button class="filter-chip ${state[fcfg.stateKey] === val ? "active" : ""}" data-filter="${val}">${escapeHtml(label)}</button>`
  ).join("");
}
document.getElementById("filterBar").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;
  const fcfg = FILTER_BARS[state.activeTable];
  if (!fcfg) return;
  state[fcfg.stateKey] = btn.dataset.filter;
  getTableUI(state.activeTable).page = 1;
  renderTable(state.activeTable);
});

/* ---------------- Column filter popup (Excel-style) ---------------- */
let openFilterPopupEl = null;

function closeFilterPopup() {
  if (openFilterPopupEl) { openFilterPopupEl.remove(); openFilterPopupEl = null; }
}

function openColumnFilterPopup(tableKey, colKey, btnEl) {
  closeFilterPopup();
  const cfg = TABLES[tableKey];
  const col = cfg.listColumns.find(c => c.key === colKey);
  if (!col) return;
  const ui = getTableUI(tableKey);
  const sourceRows = getTypeFilteredRows(tableKey);
  const uniqueValues = Array.from(new Set(
    sourceRows.map(r => getPlainText(getColumnDisplayValue(col, r)) || "(blank)")
  )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  const currentAllowed = ui.filters[colKey]; // Set, or undefined = everything allowed

  const popup = document.createElement("div");
  popup.className = "filter-popup";
  popup.innerHTML = `
    <div class="filter-popup-search">
      <input type="text" class="filter-popup-search-input" placeholder="Search values…" autocomplete="off">
    </div>
    <div class="filter-popup-actions-top">
      <button type="button" class="link-btn" data-fp-action="selectAll">Select all</button>
      <button type="button" class="link-btn" data-fp-action="clearAll">Clear</button>
    </div>
    <div class="filter-popup-list">
      ${uniqueValues.map(v => `
        <label class="filter-popup-item" data-fp-value="${escapeHtml(v.toLowerCase())}">
          <input type="checkbox" value="${escapeHtml(v)}" ${(!currentAllowed || currentAllowed.has(v)) ? "checked" : ""}>
          <span>${escapeHtml(v)}</span>
        </label>
      `).join("")}
      <p class="filter-popup-empty" hidden>No matching values.</p>
    </div>
    <div class="filter-popup-actions-bottom">
      <button type="button" class="ghost-btn" style="color:var(--text);border-color:var(--border);" data-fp-action="cancel">Cancel</button>
      <button type="button" class="primary-btn" data-fp-action="apply">Apply</button>
    </div>
  `;
  document.body.appendChild(popup);

  const rect = btnEl.getBoundingClientRect();
  const popupWidth = 220;
  popup.style.top = `${rect.bottom + 4}px`;
  popup.style.left = `${Math.min(Math.max(8, rect.right - popupWidth), window.innerWidth - popupWidth - 8)}px`;

  const searchInput = popup.querySelector(".filter-popup-search-input");
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const items = popup.querySelectorAll(".filter-popup-item");
    let anyVisible = false;
    items.forEach(item => {
      const matches = !q || item.dataset.fpValue.includes(q);
      item.hidden = !matches;
      if (matches) anyVisible = true;
    });
    popup.querySelector(".filter-popup-empty").hidden = anyVisible;
  });
  searchInput.addEventListener("click", (e) => e.stopPropagation());
  setTimeout(() => searchInput.focus(), 0);

  popup.addEventListener("click", (e) => {
    e.stopPropagation();
    const action = e.target.closest("[data-fp-action]")?.dataset.fpAction;
    // Select all / Clear only ever touch the values the search box is
    // currently showing — exactly how Excel's own filter dropdown behaves
    // once you've typed something into its search box.
    if (action === "selectAll") {
      popup.querySelectorAll('.filter-popup-item:not([hidden]) input[type="checkbox"]').forEach(cb => { cb.checked = true; });
    } else if (action === "clearAll") {
      popup.querySelectorAll('.filter-popup-item:not([hidden]) input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    } else if (action === "cancel") {
      closeFilterPopup();
    } else if (action === "apply") {
      const checked = Array.from(popup.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
      if (checked.length === 0 || checked.length === uniqueValues.length) {
        delete ui.filters[colKey]; // nothing checked, or everything checked -> no filter
      } else {
        ui.filters[colKey] = new Set(checked);
      }
      ui.page = 1;
      closeFilterPopup();
      renderTable(tableKey);
    }
  });

  openFilterPopupEl = popup;
}

document.addEventListener("click", (e) => {
  if (openFilterPopupEl && !openFilterPopupEl.contains(e.target) && !e.target.closest(".col-filter-btn")) {
    closeFilterPopup();
  }
});

/* ---------------- Rendering: table ---------------- */
function renderTable(tableKey) {
  const cfg = TABLES[tableKey];
  const ui = getTableUI(tableKey);
  const writable = tableWritable(tableKey);
  let rows = getTypeFilteredRows(tableKey);
  renderFilterBar(tableKey);

  // Excel-style column filters
  Object.entries(ui.filters).forEach(([colKey, allowedSet]) => {
    const col = cfg.listColumns.find(c => c.key === colKey);
    if (!col || !allowedSet || allowedSet.size === 0) return;
    rows = rows.filter(r => allowedSet.has(getPlainText(getColumnDisplayValue(col, r)) || "(blank)"));
  });

  // sort
  if (ui.sortKey) {
    const col = cfg.listColumns.find(c => c.key === ui.sortKey);
    if (col) {
      rows = [...rows].sort((a, b) => {
        const av = getPlainText(getColumnDisplayValue(col, a));
        const bv = getPlainText(getColumnDisplayValue(col, b));
        const na = parseFloat(av), nb = parseFloat(bv);
        const bothNumeric = av !== "" && bv !== "" && !isNaN(na) && !isNaN(nb) && String(na) === av.trim() && String(nb) === bv.trim();
        const cmp = bothNumeric ? (na - nb) : av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return cmp * ui.sortDir;
      });
    }
  }

  const table = document.getElementById("dataTable");
  const emptyState = document.getElementById("emptyState");

  if (!rows.length) {
    table.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  // pagination
  const pageSize = ui.pageSize;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  ui.page = Math.min(Math.max(1, ui.page), totalPages);
  const startIdx = (ui.page - 1) * pageSize;
  const pageRows = rows.slice(startIdx, startIdx + pageSize);

  const showHistory = true; // every menu gets per-record version history
  const showRenew = writable && tableKey === "hardware";
  const showActionsCol = writable || showHistory;
  const head = `<thead><tr>${cfg.listColumns.map(c => {
    const isSorted = ui.sortKey === c.key;
    const arrow = isSorted ? (ui.sortDir === 1 ? "▲" : "▼") : "";
    const hasFilter = ui.filters[c.key] && ui.filters[c.key].size > 0;
    return `<th>
      <div class="th-inner">
        <span class="col-sort" data-col="${c.key}">${escapeHtml(c.label)}${arrow ? ` <span class="sort-indicator">${arrow}</span>` : ""}</span>
        <button type="button" class="col-filter-btn ${hasFilter ? "active" : ""}" data-col="${c.key}" aria-label="Filter ${escapeHtml(c.label)}">▾</button>
      </div>
    </th>`;
  }).join("")}${showActionsCol ? "<th>Actions</th>" : ""}</tr></thead>`;

  const body = pageRows.map(r => {
    const cells = cfg.listColumns.map(c => {
      const val = c.render ? c.render(r) : escapeHtml(r[c.key] || "-");
      return `<td class="${c.mono ? "mono" : ""}">${val}</td>`;
    }).join("");
    const actionsCell = showActionsCol ? `<td><div class="row-actions">
          ${writable ? `<button class="icon-btn" data-action="edit" data-id="${escapeHtml(r[cfg.idField])}">Edit</button>` : ""}
          ${writable ? `<button class="icon-btn danger" data-action="delete" data-id="${escapeHtml(r[cfg.idField])}">Remove</button>` : ""}
          ${showRenew ? `<button class="icon-btn" data-action="renew" data-id="${escapeHtml(r[cfg.idField])}">${tableKey === "hardware" ? "Renew MA" : "Renew"}</button>` : ""}
          ${showHistory ? `<button class="icon-btn" data-action="history" data-id="${escapeHtml(r[cfg.idField])}">History</button>` : ""}
        </div></td>` : "";
    return `<tr>${cells}${actionsCell}</tr>`;
  }).join("");

  const foot = `<tfoot><tr><td colspan="${cfg.listColumns.length + (showActionsCol ? 1 : 0)}">
    <div class="table-pagination">
      <span class="page-info">${rows.length} record(s) — page ${ui.page} of ${totalPages}</span>
      <div class="page-controls">
        <button type="button" class="icon-btn" data-page-action="prev" ${ui.page <= 1 ? "disabled" : ""}>‹ Prev</button>
        <button type="button" class="icon-btn" data-page-action="next" ${ui.page >= totalPages ? "disabled" : ""}>Next ›</button>
      </div>
    </div>
  </td></tr></tfoot>`;

  table.innerHTML = head + `<tbody>${body}</tbody>` + foot;
}

/* Row action delegation */
document.getElementById("dataTable").addEventListener("click", async (e) => {
  const tableKey = state.activeTable;

  const sortEl = e.target.closest(".col-sort");
  if (sortEl) {
    const ui = getTableUI(tableKey);
    const colKey = sortEl.dataset.col;
    if (ui.sortKey !== colKey) {
      ui.sortKey = colKey;
      ui.sortDir = 1;
    } else if (ui.sortDir === 1) {
      ui.sortDir = -1;
    } else {
      ui.sortKey = null;
      ui.sortDir = 1;
    }
    ui.page = 1;
    renderTable(tableKey);
    return;
  }

  const filterBtn = e.target.closest(".col-filter-btn");
  if (filterBtn) {
    e.stopPropagation();
    openColumnFilterPopup(tableKey, filterBtn.dataset.col, filterBtn);
    return;
  }

  const pageBtn = e.target.closest("[data-page-action]");
  if (pageBtn) {
    const ui = getTableUI(tableKey);
    if (pageBtn.dataset.pageAction === "prev") ui.page = Math.max(1, ui.page - 1);
    else ui.page = ui.page + 1; // renderTable clamps to the real last page
    renderTable(tableKey);
    return;
  }

  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const cfg = TABLES[tableKey];
  const id = btn.dataset.id;
  if (btn.dataset.action === "history") {
    openHistoryPanel(tableKey, id);
    return;
  }
  if (!tableWritable(tableKey)) return;
  if (btn.dataset.action === "renew") {
    openRenewModal(tableKey, id);
  } else if (btn.dataset.action === "edit") {
    openForm(tableKey, id);
  } else if (btn.dataset.action === "delete") {
    if (btn.dataset.armed === "1") {
      if (tableKey === "locations" && state.data.locations.some(l => l.parent_id === id)) {
        btn.textContent = "Has sub-locations";
        btn.dataset.armed = "0";
        btn.classList.remove("armed");
        setTimeout(() => { if (btn.isConnected) btn.textContent = "Remove"; }, 2500);
        return;
      }
      if (tableKey === "locations" && state.data.network_devices.some(d => d.location_id === id)) {
        btn.textContent = "In use by a device";
        btn.dataset.armed = "0";
        btn.classList.remove("armed");
        setTimeout(() => { if (btn.isConnected) btn.textContent = "Remove"; }, 2500);
        return;
      }
      if (tableKey === "software_catalogue" && state.data.software_licenses.some(l => l.software_id === id)) {
        btn.textContent = "In use by a license";
        btn.dataset.armed = "0";
        btn.classList.remove("armed");
        setTimeout(() => { if (btn.isConnected) btn.textContent = "Remove"; }, 2500);
        return;
      }
      if (tableKey === "software_licenses" && state.data.software_allocations.some(a => a.license_id === id)) {
        btn.textContent = "In use by an allocation";
        btn.dataset.armed = "0";
        btn.classList.remove("armed");
        setTimeout(() => { if (btn.isConnected) btn.textContent = "Remove"; }, 2500);
        return;
      }
      if (tableKey === "users" && id === (state.session && state.session.user_id)) {
        btn.textContent = "Can't delete yourself"; btn.dataset.armed = "0"; btn.classList.remove("armed");
        setTimeout(() => { if (btn.isConnected) btn.textContent = "Remove"; }, 2500);
        return;
      }
      if (tableKey === "users") {
        const target = state.data.users.find(u => u.user_id === id);
        const admins = state.data.users.filter(u => u.role === "Admin" && u.status === "Active");
        if (target && target.role === "Admin" && admins.length <= 1) {
          btn.textContent = "Last active admin"; btn.dataset.armed = "0"; btn.classList.remove("armed");
          setTimeout(() => { if (btn.isConnected) btn.textContent = "Remove"; }, 2500);
          return;
        }
      }
      const removed = state.data[tableKey].find(r => r[cfg.idField] === id);
      state.data[tableKey] = state.data[tableKey].filter(r => r[cfg.idField] !== id);
      await persist(tableKey);
      if (removed) {
        await moveToRecycleBin(tableKey, removed);
        await logChange(tableKey, "Delete", removed);
      }
      renderTable(tableKey);
    } else {
      btn.dataset.armed = "1";
      btn.textContent = "Confirm delete?";
      btn.classList.add("armed");
      setTimeout(() => {
        if (btn.isConnected && btn.dataset.armed === "1") {
          btn.dataset.armed = "0";
          btn.textContent = "Remove";
          btn.classList.remove("armed");
        }
      }, 3000);
    }
  }
});

/* ---------------- Rendering: form ---------------- */
function fieldBlock(field, value) {
  const id = "f_" + field.key;
  const wide = field.type === "textarea";
  let control;

  if (field.type === "select") {
    const opts = field.dynamicOptions ? field.dynamicOptions() : (field.options || []).map(o => ({ value: o, label: o }));
    if (opts === null) {
      // No predefined list for the current context (e.g. no rack list for this site/location) — free text instead.
      control = `<input type="text" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(field.placeholder || "Custom")}" ${field.required ? "required" : ""}>`;
    } else {
      control = `<select id="${id}" data-key="${field.key}" ${field.required ? "required" : ""}>
        <option value="">-- Select --</option>
        ${opts.map(o => `<option value="${escapeHtml(o.value)}" ${String(value) === String(o.value) ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}
      </select>`;
    }
  } else if (field.type === "forcedSelect") {
    const opts = field.dynamicOptions ? field.dynamicOptions() : (field.options || []).map(o => ({ value: o, label: o }));
    if (!opts.length) {
      control = `<select id="${id}" data-key="${field.key}" disabled>
        <option value="">${escapeHtml(field.placeholder || "-- Select --")}</option>
      </select>`;
    } else {
      control = `<select id="${id}" data-key="${field.key}" ${field.required ? "required" : ""}>
        <option value="">-- Select --</option>
        ${opts.map(o => `<option value="${escapeHtml(o.value)}" ${String(value) === String(o.value) ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}
      </select>`;
    }
  } else if (field.type === "radio") {
    const opts = field.options || [];
    const current = value !== undefined && value !== null && value !== "" ? String(value) : String(field.default ?? opts[0] ?? "");
    control = `<div class="radio-group" id="${id}">
      ${opts.map(o => `<label class="radio-option"><input type="radio" name="${field.key}" data-key="${field.key}" value="${escapeHtml(o)}" ${current === String(o) ? "checked" : ""}> ${escapeHtml(o)}</label>`).join("")}
    </div>`;
  } else if (field.type === "locationCascade") {
    const opts = field.dynamicOptions ? field.dynamicOptions() : null;
    if (!Array.isArray(opts) || !opts.length) {
      control = `<input type="text" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}" placeholder="Select Site first" disabled>`;
    } else {
      const isOther = value && !opts.includes(value);
      const selectValue = !value ? "" : (isOther ? "Other" : value);
      control = `
        <select id="${id}_select" data-key="${field.key}_select" ${field.required ? "required" : ""}>
          <option value="">-- Select --</option>
          ${opts.map(o => `<option value="${escapeHtml(o)}" ${selectValue === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
        </select>
        <input type="text" id="${id}_other" data-key="${field.key}_other" value="${escapeHtml(isOther ? value : "")}" placeholder="Enter location" style="margin-top:6px;${isOther ? "" : "display:none;"}">
      `;
    }
  } else if (field.type === "multiText") {
    const rows = Array.isArray(value) && value.length ? value : [""];
    control = `
      <div class="multi-ip-list" id="${id}_list">
        ${rows.map(v => `
          <div class="multi-ip-row">
            <input type="text" class="multi-ip-input" data-key="${field.key}" value="${escapeHtml(v)}" placeholder="${escapeHtml(field.placeholder || "")}">
            <button type="button" class="icon-btn multi-ip-remove" aria-label="Remove this IP">−</button>
          </div>
        `).join("")}
      </div>
      <button type="button" class="ghost-btn multi-ip-add" data-key="${field.key}" data-placeholder="${escapeHtml(field.placeholder || "")}">+ Add IP</button>
    `;
  } else if (field.type === "multiNumber") {
    const rows = Array.isArray(value) && value.length ? value : [""];
    control = `
      <div class="multi-ip-list" id="${id}_list">
        ${rows.map(v => `
          <div class="multi-ip-row">
            <input type="number" class="multi-ip-input" data-key="${field.key}" value="${escapeHtml(v)}" placeholder="${escapeHtml(field.placeholder || "")}" min="${field.min ?? 0}">
            <button type="button" class="icon-btn multi-ip-remove" aria-label="Remove this entry">−</button>
          </div>
        `).join("")}
      </div>
      <button type="button" class="ghost-btn multi-number-add" data-key="${field.key}" data-placeholder="${escapeHtml(field.placeholder || "")}">+ Add ${escapeHtml(field.label)}</button>
    `;
  } else if (field.type === "multiSelect") {
    const opts = field.dynamicOptions ? field.dynamicOptions() : [];
    const selected = Array.isArray(value) && value.length ? value : [""];
    const rowHtml = v => `
      <div class="multi-ip-row">
        <select class="multi-select-input" data-key="${field.key}">
          <option value="">-- Select --</option>
          ${opts.map(o => `<option value="${escapeHtml(o.value)}" ${v === o.value ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}
        </select>
        <button type="button" class="icon-btn multi-ip-remove" aria-label="Remove this entry">−</button>
      </div>
    `;
    control = `
      <div class="multi-ip-list" id="${id}_list">
        ${selected.map(v => rowHtml(v)).join("")}
      </div>
      <button type="button" class="ghost-btn multi-select-add" data-key="${field.key}">+ Add</button>
    `;
  } else if (field.type === "nodeList") {
    const nodes = Array.isArray(value) ? value : [];
    control = `
      <div class="node-list" id="${id}_list">
        ${nodes.map((n, i) => {
          const excludeIds = new Set(nodes.filter((_, j) => j !== i).map(x => x.hardware_id).filter(Boolean));
          return nodeRowMarkup(n, i, excludeIds);
        }).join("")}
      </div>
      <button type="button" class="ghost-btn node-add" data-key="${field.key}">+ Add Host</button>
    `;
  } else if (field.type === "ip") {
    const octets = String(value || "").split(".");
    const seg = i => escapeHtml((octets[i] || "").replace(/\D/g, ""));
    const lockedAttr = field.locked ? "readonly" : "";
    control = `<span class="ip-input-group">
      <input type="hidden" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}">
      <input type="text" class="ip-octet" inputmode="numeric" maxlength="3" value="${seg(0)}" aria-label="${escapeHtml(field.label)} octet 1" ${lockedAttr}>
      <span class="ip-dot">.</span>
      <input type="text" class="ip-octet" inputmode="numeric" maxlength="3" value="${seg(1)}" aria-label="${escapeHtml(field.label)} octet 2" ${lockedAttr}>
      <span class="ip-dot">.</span>
      <input type="text" class="ip-octet" inputmode="numeric" maxlength="3" value="${seg(2)}" aria-label="${escapeHtml(field.label)} octet 3" ${lockedAttr}>
      <span class="ip-dot">.</span>
      <input type="text" class="ip-octet" inputmode="numeric" maxlength="3" value="${seg(3)}" aria-label="${escapeHtml(field.label)} octet 4" ${lockedAttr}>
    </span>`;
  } else if (field.type === "mac") {
    control = `<input type="text" id="${id}" data-key="${field.key}" data-mac-field="1" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(field.placeholder || "e.g. aa:bb:cc:dd:ee:01")}" ${field.required ? "required" : ""}>`;
  } else if (field.type === "password") {
    // Never echo the stored hash back into the form — blank means "keep current password".
    control = `<input type="password" id="${id}" data-key="${field.key}" placeholder="${escapeHtml(field.placeholder || "")}" autocomplete="new-password">`;
  } else if (field.type === "selectAddable") {
    const catalogKey = typeof field.catalogKey === "function" ? field.catalogKey() : (field.catalogKey || "server_roles");
    const opts = getCatalog(catalogKey);
    const isOther = value !== undefined && value !== null && value !== "" && !opts.map(String).includes(String(value));
    control = `
      <div style="display:flex;gap:6px;align-items:center;">
        <select id="${id}" data-key="${field.key}" style="flex:1;min-width:0;" ${field.required ? "required" : ""}>
          <option value="">-- Select --</option>
          ${isOther ? `<option value="${escapeHtml(value)}" selected>${escapeHtml(value)}</option>` : ""}
          ${opts.map(o => `<option value="${escapeHtml(String(o))}" ${String(value) === String(o) ? "selected" : ""}>${escapeHtml(String(o))}</option>`).join("")}
        </select>
        <button type="button" class="icon-btn addable-add" data-key="${field.key}" data-catalog="${escapeHtml(catalogKey)}" title="${escapeHtml(field.addButtonTitle || "Add a new value")}" style="flex-shrink:0;white-space:nowrap;">${escapeHtml(field.addButtonLabel || "+ Add")}</button>
      </div>`;
  } else if (field.type === "lockedText") {
    control = `<input type="text" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}" readonly placeholder="${escapeHtml(field.placeholder || "Use the Renew button to set this")}">`;
  } else if (field.type === "derivedText") {
    control = `<input type="text" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}" readonly placeholder="Select ${escapeHtml(field.dependsLabel || "")} first">`;
  } else if (field.type === "number") {
    control = `<input type="number" id="${id}" data-key="${field.key}" value="${value ?? ""}" min="${field.min ?? 0}" ${field.required ? "required" : ""}>`;
  } else if (field.type === "date") {
    control = `<input type="hidden" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}">
      <input type="text" class="date-mask-input" data-date-display="${field.key}" value="${escapeHtml(isoToDmyInput(value))}" placeholder="${field.locked ? "Auto-calculated" : "dd/mm/yyyy"}" inputmode="numeric" maxlength="10" autocomplete="off" ${field.locked ? "readonly" : ""}>`;
  } else if (field.type === "textarea") {
    control = `<textarea id="${id}" data-key="${field.key}" rows="2">${escapeHtml(value || "")}</textarea>`;
  } else {
    control = `<input type="text" id="${id}" data-key="${field.key}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(field.placeholder || "")}" ${field.required ? "required" : ""}>`;
  }

  return `<label class="field ${wide ? "full" : ""}">
    <span class="field-label">${escapeHtml(field.label)}${field.required ? ' <span class="req">*</span>' : ""}</span>
    <span class="control-slot" id="slot_${field.key}">${control}</span>
  </label>`;
}

function renderGroupedFields(fields, record) {
  const groups = [];
  const idx = {};
  fields.forEach(f => {
    if (!(f.group in idx)) { idx[f.group] = groups.length; groups.push({ name: f.group, fields: [] }); }
    groups[idx[f.group]].fields.push(f);
  });
  return groups.map(g => `
    <fieldset>
      <legend>${escapeHtml(g.name)}</legend>
      <div class="field-grid">
        ${g.fields.map(f => fieldBlock(f, record ? record[f.key] : f.default)).join("")}
      </div>
    </fieldset>
  `).join("");
}

function filterFieldsByType(fields, type) {
  return fields.filter(f => !f.onlyFor || f.onlyFor === type);
}

/* formRecordCtx holds the record currently open in the panel (or null),
   used as a fallback source of truth for cascading fields before their
   sibling DOM elements exist yet (i.e. during the very first render). */
let formRecordCtx = null;

function getCascadeLocationValue(key) {
  const id = "f_" + key;
  const selEl = document.getElementById(id + "_select");
  if (selEl) {
    if (selEl.value === "Other") {
      const otherEl = document.getElementById(id + "_other");
      return otherEl ? otherEl.value.trim() : "";
    }
    return selEl.value;
  }
  const plainEl = document.getElementById(id);
  if (plainEl) return plainEl.value.trim();
  return formRecordCtx ? (formRecordCtx[key] || "") : "";
}

function getMultiTextValues(key) {
  const list = document.getElementById("f_" + key + "_list");
  if (!list) return Array.isArray(formRecordCtx && formRecordCtx[key]) ? formRecordCtx[key] : [];
  return Array.from(list.querySelectorAll(`.multi-ip-input[data-key="${key}"]`))
    .map(el => el.value.trim())
    .filter(Boolean);
}

function getRadioValue(key) {
  const checked = document.querySelector(`input[name="${key}"][data-key="${key}"]:checked`);
  if (checked) return checked.value;
  return formRecordCtx ? (formRecordCtx[key] || "") : "";
}
function getMultiSelectValues(key) {
  const list = document.getElementById("f_" + key + "_list");
  if (!list) return Array.isArray(formRecordCtx && formRecordCtx[key]) ? formRecordCtx[key] : [];
  return Array.from(list.querySelectorAll(`.multi-select-input[data-key="${key}"]`))
    .map(el => el.value)
    .filter(Boolean);
}
function getMultiNumberValues(key) {
  const list = document.getElementById("f_" + key + "_list");
  if (!list) return Array.isArray(formRecordCtx && formRecordCtx[key]) ? formRecordCtx[key] : [];
  return Array.from(list.querySelectorAll(`.multi-ip-input[data-key="${key}"]`))
    .map(el => el.value.trim())
    .filter(v => v !== "")
    .map(v => Number(v));
}

function getNodeListValues(key) {
  const list = document.getElementById("f_" + key + "_list");
  if (!list) return Array.isArray(formRecordCtx && formRecordCtx[key]) ? formRecordCtx[key] : [];
  return Array.from(list.querySelectorAll(".node-row"))
    .map(row => {
      const get = k => (row.querySelector(`[data-node-key="${k}"]`)?.value || "").trim();
      return {
        node_id: row.dataset.nodeId || genNodeId(),
        hardware_id: get("hardware_id"),
        host_name: get("host_name"),
        ip_host: get("ip_host"),
        ip_management: get("ip_management"),
      };
    })
    .filter(n => n.hardware_id || n.host_name || n.ip_host || n.ip_management);
}

function getLiveValue(key) {
  if (key === "location") return getCascadeLocationValue("location");
  const el = document.getElementById("f_" + key);
  if (el) return el.value;
  return formRecordCtx ? (formRecordCtx[key] || "") : "";
}

function refreshFieldSlot(field, value) {
  const slot = document.getElementById("slot_" + field.key);
  if (!slot) return;
  const temp = document.createElement("div");
  temp.innerHTML = fieldBlock(field, value);
  const newSlot = temp.querySelector(".control-slot");
  slot.innerHTML = newSlot ? newSlot.innerHTML : "";
}

function collectCurrentDomValues(fields) {
  const out = {};
  fields.forEach(f => {
    if (f.type === "locationCascade") { out[f.key] = getCascadeLocationValue(f.key); return; }
    if (f.type === "multiText") { out[f.key] = getMultiTextValues(f.key); return; }
    if (f.type === "multiSelect") { out[f.key] = getMultiSelectValues(f.key); return; }
    if (f.type === "multiNumber") { out[f.key] = getMultiNumberValues(f.key); return; }
    if (f.type === "nodeList") { out[f.key] = getNodeListValues(f.key); return; }
    if (f.type === "radio") { out[f.key] = getRadioValue(f.key); return; }
    const el = document.getElementById("f_" + f.key);
    if (el) out[f.key] = el.value;
  });
  return out;
}

function wireLocationCascade() {
  if (!state.editing) return;
  const cfg = TABLES[state.editing.tableKey];
  const siteField = cfg.fields.find(f => f.key === "site");
  const locationField = cfg.fields.find(f => f.key === "location" && f.type === "locationCascade");
  const rackField = cfg.fields.find(f => f.key === "rack_number");
  const siteSel = document.getElementById("f_site");
  if (!siteField || !locationField || !siteSel) return; // this form doesn't use the cascade

  function refreshRack() {
    if (rackField) refreshFieldSlot(rackField, "");
  }
  function wireLocationSelectToggle() {
    const selEl = document.getElementById("f_location_select");
    const otherEl = document.getElementById("f_location_other");
    if (selEl) {
      selEl.addEventListener("change", () => {
        if (otherEl) otherEl.style.display = selEl.value === "Other" ? "" : "none";
        refreshRack();
      });
    }
    if (otherEl) otherEl.addEventListener("input", refreshRack);
  }
  function refreshLocation() {
    refreshFieldSlot(locationField, "");
    wireLocationSelectToggle();
    refreshRack();
  }

  siteSel.addEventListener("change", refreshLocation);
  wireLocationSelectToggle();
}

/* Network Device form: Site -> Factory -> Floor -> Area chained selects,
   each level's options depend on the one above it. */
function wireNetworkDeviceLocationCascade() {
  if (!state.editing || state.editing.tableKey !== "network_devices") return;
  const cfg = TABLES[state.editing.tableKey];
  const factoryField = cfg.fields.find(f => f.key === "parent_factory");
  const floorField = cfg.fields.find(f => f.key === "location_id");

  const siteSel = document.getElementById("f_parent_site");
  const factorySel = document.getElementById("f_parent_factory");
  if (!siteSel || !factorySel) return;

  siteSel.addEventListener("change", () => {
    refreshFieldSlot(factoryField, "");
    refreshFieldSlot(floorField, "");
    wireNetworkDeviceLocationCascade();
  });
  factorySel.addEventListener("change", () => {
    refreshFieldSlot(floorField, "");
  });
}

/* VLAN form: CIDR and Usable IP are derived read-only fields, recalculated
   whenever Network Address or Subnet Mask change. */
function wireVlanAutoCalc() {
  if (!state.editing || state.editing.tableKey !== "vlans") return;
  const cfg = TABLES[state.editing.tableKey];
  const netEl = document.getElementById("f_network_address");
  const maskEl = document.getElementById("f_subnet_mask");
  const cidrField = cfg.fields.find(f => f.key === "cidr");
  const usableField = cfg.fields.find(f => f.key === "usable_ip");
  if (!netEl || !maskEl) return;

  function recalc() {
    const cidr = maskToCidr(maskEl.value.trim());
    const cidrEl = document.getElementById("f_cidr");
    if (cidrEl) cidrEl.value = cidr !== null ? `/${cidr}` : "";
    const range = subnetRangeFor(netEl.value.trim(), maskEl.value.trim());
    const usableEl = document.getElementById("f_usable_ip");
    if (usableEl) usableEl.value = range ? range.usableLabel : "";
  }
  netEl.addEventListener("input", recalc);
  maskEl.addEventListener("input", recalc);
  recalc();
}

/* VLAN form: the DHCP Server/Start/End fields are hidden until DHCP is
   enabled. DHCP Start/End are never typed — they're the subnet's usable
   range minus the Gateway and minus the Static IP range (if one was
   entered); with no Static range, DHCP simply gets the full usable range. */
function wireVlanDhcpCascade() {
  if (!state.editing || state.editing.tableKey !== "vlans") return;
  const dhcpSel = document.getElementById("f_dhcp_enabled");
  const netEl = document.getElementById("f_network_address");
  const maskEl = document.getElementById("f_subnet_mask");
  const gatewayEl = document.getElementById("f_gateway");
  const staticStartEl = document.getElementById("f_static_start");
  const staticEndEl = document.getElementById("f_static_end");
  const staticUsableEl = document.getElementById("f_static_usable");
  if (!dhcpSel || !netEl || !maskEl) return;

  const dhcpServerRow = document.getElementById("f_dhcp_server")?.closest(".field");
  const dhcpStartRow = document.getElementById("f_dhcp_start")?.closest(".field");
  const dhcpEndRow = document.getElementById("f_dhcp_end")?.closest(".field");

  function recalcDhcpRange() {
    const range = subnetRangeFor(netEl.value.trim(), maskEl.value.trim());
    if (!range) { setIpFieldValue("dhcp_start", ""); setIpFieldValue("dhcp_end", ""); return; }
    let startInt = range.firstUsable;
    const gatewayIp = (gatewayEl?.value || "").trim();
    if (gatewayIp && ipToInt(gatewayIp) === startInt) startInt += 1;
    const staticStart = (staticStartEl?.value || "").trim();
    const staticEndInt = ipToInt((staticEndEl?.value || "").trim());
    if (staticStart && !Number.isNaN(staticEndInt) && staticEndInt >= startInt) startInt = staticEndInt + 1;
    const endInt = range.lastUsable;
    const valid = startInt <= endInt;
    setIpFieldValue("dhcp_start", valid ? intToIp(startInt) : "");
    setIpFieldValue("dhcp_end", valid ? intToIp(endInt) : "");
  }

  function recalcStaticUsable() {
    if (!staticUsableEl) return;
    const s = (staticStartEl?.value || "").trim();
    const e = (staticEndEl?.value || "").trim();
    const sInt = ipToInt(s), eInt = ipToInt(e);
    staticUsableEl.value = (s && e && !Number.isNaN(sInt) && !Number.isNaN(eInt) && sInt <= eInt)
      ? `${s}–${e} (${eInt - sInt + 1} addresses)` : "";
  }

  function syncVisibility() {
    const isYes = dhcpSel.value === "Yes";
    if (dhcpServerRow) dhcpServerRow.hidden = !isYes;
    if (dhcpStartRow) dhcpStartRow.hidden = !isYes;
    if (dhcpEndRow) dhcpEndRow.hidden = !isYes;
  }

  function recalcAll() { recalcDhcpRange(); recalcStaticUsable(); }

  dhcpSel.addEventListener("change", () => { syncVisibility(); recalcAll(); });
  netEl.addEventListener("input", recalcAll);
  maskEl.addEventListener("input", recalcAll);
  gatewayEl?.addEventListener("input", recalcAll);
  staticStartEl?.addEventListener("input", recalcAll);
  staticEndEl?.addEventListener("input", recalcAll);

  syncVisibility();
  recalcAll();
}

/* Network Device form: Sub-category options depend on the chosen Category. */
function wireNetworkDeviceCategoryCascade() {
  if (!state.editing || state.editing.tableKey !== "network_devices") return;
  const cfg = TABLES[state.editing.tableKey];
  const subField = cfg.fields.find(f => f.key === "subcategory");
  const catSel = document.getElementById("f_category");
  if (!subField || !catSel) return;

  catSel.addEventListener("change", () => {
    refreshFieldSlot(subField, "");
  });
}

/* Network Device form: Stack ID/Stack Role are only relevant when this
   device is actually part of a switch stack. */
function wireNetworkStackCascade() {
  if (!state.editing || state.editing.tableKey !== "network_devices") return;
  const radios = document.querySelectorAll('input[name="stack_enabled"]');
  const idRow = document.getElementById("f_stack_id")?.closest(".field");
  const roleRow = document.getElementById("f_stack_role")?.closest(".field");
  if (!radios.length || !idRow || !roleRow) return;
  function sync() {
    const isStacked = getRadioValue("stack_enabled") === "Yes";
    idRow.hidden = !isStacked;
    roleRow.hidden = !isStacked;
  }
  radios.forEach(r => r.addEventListener("change", sync));
  sync();
}

function wireAddableFields() {
  document.querySelectorAll(".addable-add").forEach(btn => {
    if (btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async () => {
      if (!state.editing) return;
      const key = btn.dataset.key;
      const catalogKey = btn.dataset.catalog || "server_roles";
      const cfg = TABLES[state.editing.tableKey];
      const field = cfg.fields.find(f => f.key === key);
      const promptLabel = (field && field.addPromptLabel) || "Add a new value:";
      const name = window.prompt(promptLabel);
      if (name === null) return;
      const added = await addCatalogValue(catalogKey, name);
      if (!added) {
        window.alert(NUMERIC_CATALOGS.has(catalogKey) ? "Please enter a positive number." : "Please enter a value.");
        return;
      }
      if (field) refreshFieldSlot(field, added);
      wireAddableFields();
    });
  });
}

/* Hardware form: the Storage capacity catalog (GB vs TB sizes) depends on
   the chosen Storage unit. */
function wireHardwareStorageUnitCascade() {
  if (!state.editing || state.editing.tableKey !== "hardware") return;
  const cfg = TABLES.hardware;
  const capField = cfg.fields.find(f => f.key === "storage_capacity");
  const unitSel = document.getElementById("f_storage_unit");
  if (!unitSel || !capField) return;
  unitSel.addEventListener("change", () => {
    refreshFieldSlot(capField, "");
    wireAddableFields();
  });
}

/* Server List form: the OS Version catalog depends on the chosen OS Type. */
function wireOsCascade() {
  if (!state.editing || state.editing.tableKey !== "servers") return;
  const cfg = TABLES.servers;
  const versionField = cfg.fields.find(f => f.key === "os_version");
  const typeSel = document.getElementById("f_os_type");
  if (!typeSel || !versionField) return;
  typeSel.addEventListener("change", () => {
    refreshFieldSlot(versionField, "");
    wireAddableFields();
  });
}

function attachDynamicHandlers() {
  document.querySelectorAll('[data-ip-field="1"]').forEach(filterIpKeystroke);
  document.querySelectorAll('[data-mac-field="1"]').forEach(filterMacKeystroke);
  wireDateMaskInputs(document.getElementById("panelBody"));
  wireIpOctetGroups(document.getElementById("panelBody"));
  wireWarrantyAutoCalc();

  const hostSel = document.getElementById("f_host_ref");
  const clusterInput = document.getElementById("f_cluster_name");
  if (hostSel && clusterInput) {
    hostSel.addEventListener("change", () => {
      const [clusterId] = hostSel.value.split("::");
      clusterInput.value = clusterNameFor(clusterId);
    });
  }

  const hwSel = document.getElementById("f_hardware_id");
  const costInput = document.getElementById("f_hardware_cost_center");
  const specsInput = document.getElementById("f_hardware_specs");
  if (hwSel && (costInput || specsInput)) {
    const syncHardwareDerived = () => {
      const hw = state.data.hardware.find(h => h.hardware_id === hwSel.value);
      if (costInput) costInput.value = hw ? (hw.cost_center || "") : "";
      if (specsInput) specsInput.value = hw ? formatHardwareSpecsText(hw) : "";
    };
    hwSel.addEventListener("change", syncHardwareDerived);
    syncHardwareDerived(); // populate immediately so edit mode shows the current linked value
  }

  wireLocationCascade();
  wireNetworkDeviceLocationCascade();
  wireNetworkDeviceCategoryCascade();
  wireVlanAutoCalc();
  wireVlanDhcpCascade();
  wireHardwareStorageUnitCascade();
  wireOsCascade();
  wireNetworkStackCascade();
  wireAddableFields();
}

function renderPanelBody(tableKey, record) {
  const cfg = TABLES[tableKey];
  const panelBody = document.getElementById("panelBody");
  const noteHtml = cfg.fixedNote ? `<p class="form-hint">${escapeHtml(cfg.fixedNote)}</p>` : "";
  const discKey = cfg.discriminatorKey;
  formRecordCtx = record;

  if (!discKey) {
    panelBody.innerHTML = noteHtml + renderGroupedFields(cfg.fields, record);
    attachDynamicHandlers();
    return;
  }

  // Type-filtered form: render the discriminator selector on its own,
  // then only the fields relevant to whichever value is currently selected.
  const discField = cfg.fields.find(f => f.key === discKey);
  const otherFields = cfg.fields.filter(f => f.key !== discKey);
  const currentType = record ? record[discKey] : "";
  const hintText = "Select " + discField.label + " first to show the relevant fields";

  panelBody.innerHTML = noteHtml + `
    <fieldset>
      <legend>${escapeHtml(discField.label)}</legend>
      <div class="field-grid">${fieldBlock(discField, currentType)}</div>
    </fieldset>
    <p class="form-hint" id="typeHint">${currentType ? "" : escapeHtml(hintText)}</p>
    <div id="dynamicFields">${renderGroupedFields(filterFieldsByType(otherFields, currentType), record)}</div>
  `;

  document.getElementById("f_" + discKey).addEventListener("change", (e) => {
    const newType = e.target.value;
    const preserved = collectCurrentDomValues(otherFields);
    const merged = Object.assign({}, record, preserved);
    formRecordCtx = merged;
    document.getElementById("typeHint").textContent = newType ? "" : hintText;
    document.getElementById("dynamicFields").innerHTML = renderGroupedFields(filterFieldsByType(otherFields, newType), merged);
    attachDynamicHandlers();
  });

  attachDynamicHandlers();
}

function openForm(tableKey, id = null) {
  if (!tableWritable(tableKey)) return;
  state.editing = { tableKey, id };
  const cfg = TABLES[tableKey];
  let record = id ? state.data[tableKey].find(r => r[cfg.idField] === id) : null;
  const fcfg = FILTER_BARS[tableKey];
  const prefillType = (!record && fcfg && state[fcfg.stateKey] !== "all") ? state[fcfg.stateKey] : null;

  if (record && tableKey === "locations" && record.parent_id) {
    const parentKey = { Factory: "parent_site", Floor: "parent_factory" }[record.level];
    if (parentKey) record = Object.assign({}, record, { [parentKey]: record.parent_id });
  }
  if (record && tableKey === "ad_users") {
    record = Object.assign({}, record, {
      groups: state.data.ad_memberships.filter(m => m.ad_user_id === record.ad_user_id).map(m => m.group_name),
    });
  }
  if (record && tableKey === "network_devices" && record.stack_enabled === undefined) {
    // Legacy records predate the Stack toggle — infer it from whether a
    // Stack ID was already set, so existing stack data isn't hidden/lost.
    record = Object.assign({}, record, { stack_enabled: record.stack_id ? "Yes" : "No" });
  }
  if (record && tableKey === "network_devices" && record.location_id) {
    // Walk the Floor's ancestor chain so the Site/Factory selects
    // pre-populate correctly when editing an existing device.
    const floor = state.data.locations.find(l => l.location_id === record.location_id);
    const factory = floor ? state.data.locations.find(l => l.location_id === floor.parent_id) : null;
    const site = factory ? state.data.locations.find(l => l.location_id === factory.parent_id) : null;
    record = Object.assign({}, record, {
      parent_site: site ? site.location_id : "",
      parent_factory: factory ? factory.location_id : "",
    });
  }

  document.getElementById("panelTitle").textContent = record ? `Edit — ${cfg.label}` : `Add — ${cfg.label}`;
  document.getElementById("formError").hidden = true;
  renderPanelBody(tableKey, record || (prefillType ? { [cfg.discriminatorKey]: prefillType } : null));
  document.getElementById("modalBackdrop").classList.add("open");
  document.querySelector(".dialog-content").scrollTop = 0;
}

function closeForm() {
  document.getElementById("modalBackdrop").classList.remove("open");
  state.editing = null;
}

/* ---------------- Per-record version history ----------------
   Reuses the existing audit_log — filtered to one record and numbered in
   chronological order (oldest = version 1). Offered on every table. */
function openHistoryPanel(tableKey, id) {
  const cfg = TABLES[tableKey];
  const record = state.data[tableKey].find(r => r[cfg.idField] === id);
  const title = record ? recordDisplayName(tableKey, record) : id;
  document.getElementById("historyPanelTitle").textContent = `History — ${title}`;
  const versions = state.data.record_versions
    .filter(v => v.table_key === tableKey && v.record_id === id)
    .slice()
    .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  document.getElementById("historyBody").innerHTML = versions.length
    ? `<p class="form-hint">Showing the ${versions.length} most recent version(s) of this record (older versions roll off automatically).</p>
       <div class="history-timeline">${versions.map((v, i) => {
        const prev = i > 0 ? versions[i - 1].snapshot : null;
        const changes = i > 0 ? diffRecordVersions(prev, v.snapshot, tableKey) : [];
        return `
        <div class="history-entry">
          <div class="history-entry-head">
            <span class="history-version">v${i + 1}</span>
            <span class="history-when">${escapeHtml(formatDateTimeDMY(v.changed_at))}</span>
          </div>
          <div class="history-entry-by">by ${escapeHtml(v.username || "system")}</div>
          ${i === 0
            ? `<p class="form-hint" style="margin:6px 0 0;">Created — no earlier version to compare.</p>`
            : changes.length
              ? `<div class="history-diff">${changes.map(c => `
                  <div class="diff-row"><span class="diff-label">${escapeHtml(c.label)}:</span> <span class="diff-old">${escapeHtml(c.oldStr)}</span> → <span class="diff-new">${escapeHtml(c.newStr)}</span></div>
                `).join("")}</div>`
              : `<p class="form-hint" style="margin:6px 0 0;">No field changes detected.</p>`}
        </div>`;
      }).join("")}</div>`
    : `<p class="empty-state">No history recorded for this record yet.</p>`;
  document.getElementById("historyModalBackdrop").classList.add("open");
}
function closeHistoryPanel() {
  document.getElementById("historyModalBackdrop").classList.remove("open");
}

/* ---------------- Renew MA (Hardware) ----------------
   A dedicated small form instead of the main Edit form: renewing always
   archives the current period into ma_renewal_history (unlimited, kept
   forever for cost audit) before writing the new period — the main Edit
   form's matching fields are locked (lockedText) so this is the only way
   those fields change, guaranteeing every renewal gets recorded.
   Hardware (Server MA) is the only table that uses this — a Software
   License's expiry_date is just edited directly on the license record. */
let renewing = null; // { tableKey, id }
function openRenewModal(tableKey, id) {
  const cfg = TABLES[tableKey];
  const record = state.data[tableKey].find(r => r[cfg.idField] === id);
  if (!record) return;
  renewing = { tableKey, id };
  document.getElementById("renewPanelTitle").textContent = `Renew MA — ${recordDisplayName(tableKey, record)}`;
  document.getElementById("renewFormError").hidden = true;
  document.getElementById("renewExpiry").value = "";
  document.getElementById("renewExpiryDisplay").value = "";
  document.getElementById("renewContractNo").value = record.ma_contract_no || "";
  document.getElementById("renewProvider").value = record.ma_provider || "";
  document.getElementById("renewCost").value = "";
  document.getElementById("renewNote").value = "";

  const history = (record.ma_renewal_history || []).slice().sort((a, b) => new Date(b.renewed_at) - new Date(a.renewed_at));
  document.getElementById("renewHistoryWrap").innerHTML = history.length
    ? `<p class="form-hint" style="margin-top:14px;">Renewal history (${history.length})</p>
       <div class="history-timeline">${history.map(h => `
         <div class="history-entry">
           <div class="history-entry-head">
             <span class="history-when">${escapeHtml(formatDateDMY(h.start_date))} → ${escapeHtml(formatDateDMY(h.end_date))}</span>
           </div>
           <div class="history-entry-by">${escapeHtml(h.contract_no || "-")}${h.provider ? " · " + escapeHtml(h.provider) : ""} · ${Number(h.cost_thb || 0).toLocaleString("th-TH")} THB · by ${escapeHtml(h.renewed_by || "system")}</div>
         </div>
       `).join("")}</div>`
    : `<p class="form-hint" style="margin-top:14px;">No renewal history yet — this will be the first recorded period.</p>`;

  document.getElementById("renewModalBackdrop").classList.add("open");
}
function closeRenewModal() {
  document.getElementById("renewModalBackdrop").classList.remove("open");
  renewing = null;
}
async function submitRenew() {
  if (!renewing) return;
  const { tableKey, id } = renewing;
  const cfg = TABLES[tableKey];
  const record = state.data[tableKey].find(r => r[cfg.idField] === id);
  const errBox = document.getElementById("renewFormError");
  errBox.hidden = true;
  if (!record) { closeRenewModal(); return; }

  const newExpiry = document.getElementById("renewExpiry").value;
  const contractNo = document.getElementById("renewContractNo").value.trim();
  const provider = document.getElementById("renewProvider").value.trim();
  const costRaw = document.getElementById("renewCost").value;
  const note = document.getElementById("renewNote").value.trim();
  const cost = Number(costRaw);

  const prevExpiry = record.ma_expiry_date;
  if (!newExpiry) { errBox.textContent = "Please fill in: New expiry date"; errBox.hidden = false; return; }
  if (prevExpiry && new Date(newExpiry) <= new Date(prevExpiry)) {
    errBox.textContent = "New expiry date must be after the current expiry date.";
    errBox.hidden = false;
    return;
  }
  if (costRaw === "" || !Number.isFinite(cost) || cost < 0) {
    errBox.textContent = "Please enter a valid cost in THB (0 or more).";
    errBox.hidden = false;
    return;
  }

  const historyEntry = {
    renewal_id: `RNW-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    contract_no: contractNo,
    provider,
    start_date: prevExpiry || "",
    end_date: newExpiry,
    cost_thb: cost,
    note,
    renewed_by: state.session ? state.session.username : "system",
    renewed_at: new Date().toISOString(),
  };

  record.ma_renewal_history = record.ma_renewal_history || [];
  record.ma_renewal_history.push(historyEntry);
  record.ma_contract_no = contractNo;
  record.ma_provider = provider;
  record.ma_expiry_date = newExpiry;
  record.ma_cost = cost;
  record.updated_at = new Date().toISOString().slice(0, 10);

  await persist(tableKey);
  await logChange(tableKey, "RenewMA", record);
  await pushRecordVersion(tableKey, record);
  closeRenewModal();
  renderTable(state.activeTable);
}

function collectFormValues(tableKey) {
  const cfg = TABLES[tableKey];
  const discKey = cfg.discriminatorKey;
  const typeEl = discKey ? document.getElementById("f_" + discKey) : null;
  const currentType = typeEl ? typeEl.value : null;
  const values = {};
  const missing = [];
  const invalid = [];

  cfg.fields.forEach(f => {
    const applies = !f.onlyFor || f.onlyFor === currentType;
    const isListType = f.type === "multiText" || f.type === "nodeList" || f.type === "multiSelect" || f.type === "multiNumber";
    if (!applies) { values[f.key] = isListType ? [] : ""; return; } // irrelevant for this type — don't keep stale data

    if (f.type === "multiText") {
      const arr = getMultiTextValues(f.key);
      if (f.required && arr.length === 0) missing.push(f.label);
      values[f.key] = arr;
      return;
    }
    if (f.type === "multiSelect") {
      const arr = getMultiSelectValues(f.key);
      if (f.required && arr.length === 0) missing.push(f.label);
      values[f.key] = arr;
      return;
    }
    if (f.type === "multiNumber") {
      const arr = getMultiNumberValues(f.key);
      if (f.required && arr.length === 0) missing.push(f.label);
      const minVal = f.min ?? 0;
      if (arr.some(n => n < minVal)) invalid.push(`${f.label}: all values must be ${minVal} or greater`);
      values[f.key] = arr;
      return;
    }
    if (f.type === "nodeList") {
      const arr = getNodeListValues(f.key);
      if (f.required && arr.length === 0) missing.push(f.label);
      values[f.key] = arr;
      return;
    }
    if (f.type === "radio") {
      const rv = getRadioValue(f.key) || f.default || "";
      if (f.required && !rv) missing.push(f.label);
      values[f.key] = rv;
      return;
    }
    const v = f.type === "locationCascade" ? getCascadeLocationValue(f.key) : (document.getElementById("f_" + f.key)?.value.trim() || "");
    if (f.required && !v) missing.push(f.label);
    if (f.type === "ip" && v && !isValidIPv4(v)) invalid.push(`${f.label} must be a valid IP address (e.g. 192.168.1.10)`);
    if (f.type === "mac" && v && !isValidMac(v)) invalid.push(`${f.label} must be a valid MAC address (e.g. aa:bb:cc:dd:ee:01)`);
    if (f.type === "number" && v !== "" && Number(v) < (f.min ?? 0)) invalid.push(`${f.label} must be ${f.min ?? 0} or greater`);
    values[f.key] = v;
  });

  return { values, missing, invalid };
}

async function saveForm() {
  if (!state.editing || !tableWritable(state.editing.tableKey)) return;
  const { tableKey, id } = state.editing;
  const cfg = TABLES[tableKey];
  const { values, missing, invalid } = collectFormValues(tableKey);
  const errorBox = document.getElementById("formError");
  errorBox.hidden = true;
  errorBox.innerHTML = "";

  if (missing.length) {
    errorBox.innerHTML = `Please fill in: ${escapeHtml(missing.join(", "))}`;
    errorBox.hidden = false;
    return;
  }
  if (invalid.length) {
    errorBox.innerHTML = invalid.map(escapeHtml).join("<br>");
    errorBox.hidden = false;
    return;
  }

  if (tableKey === "users") {
    if (values.password) {
      values.password = await sha256Hex(values.password);
    } else if (!id) {
      errorBox.innerHTML = "Please fill in: Password";
      errorBox.hidden = false;
      return;
    } else {
      delete values.password; // blank on edit means "keep the current password"
    }
  }

  const conflicts = checkDuplicates(tableKey, values, id).concat(checkHardwareAssignment(tableKey, values, id));
  if (tableKey === "clusters") conflicts.push(...validateNodes(values.nodes, id));
  if (tableKey === "locations") conflicts.push(...validateLocation(values, id));
  if (tableKey === "vlans") conflicts.push(...validateVlan(values));
  if (tableKey === "server_permissions") conflicts.push(...validateServerPermission(values, id));
  if (tableKey === "network_devices") conflicts.push(...validateNetworkDevice(values));
  if (tableKey === "software_allocations") conflicts.push(...validateSoftwareAllocation(values, id));
  if (conflicts.length) {
    errorBox.innerHTML = conflicts.map(escapeHtml).join("<br>");
    errorBox.hidden = false;
    return;
  }
  if (tableKey === "locations") {
    values.parent_id = values.parent_site || values.parent_factory || values.parent_floor || values.parent_area || null;
    delete values.parent_site;
    delete values.parent_factory;
    delete values.parent_floor;
    delete values.parent_area;
  }
  if (tableKey === "network_devices") {
    // parent_site/parent_factory only drive the cascading dropdowns in the UI
    // — the only value that actually gets persisted is location_id (the Floor).
    delete values.parent_site;
    delete values.parent_factory;
    // Stack ID/Role only mean something while Stack is enabled — clear them
    // immediately so a stale value never lingers once switched back to "No".
    if (values.stack_enabled !== "Yes") {
      values.stack_id = "";
      values.stack_role = "";
    }
  }
  if (tableKey === "vlans" && values.vlan_id) {
    values.vlan_id = Number(values.vlan_id);
  }
  let groupNames = null;
  if (tableKey === "ad_users") {
    groupNames = (values.groups || []).filter(Boolean);
    delete values.groups; // real membership rows live in ad_memberships, not on the ad_user record
    values.group_count = groupNames.length;
  }
  const today = new Date().toISOString().slice(0, 10);
  const arr = state.data[tableKey];
  let rec;

  if (id) {
    rec = arr.find(r => r[cfg.idField] === id);
    Object.assign(rec, values);
    rec.updated_at = today;
  } else {
    const newId = generateId(cfg);
    rec = Object.assign({ [cfg.idField]: newId }, values, { created_at: today, updated_at: today });
    arr.push(rec);
  }

  if (tableKey === "ad_users" && groupNames) {
    const adUserId = rec[cfg.idField];
    state.data.ad_memberships = state.data.ad_memberships.filter(m => m.ad_user_id !== adUserId);
    groupNames.forEach(name => {
      state.data.ad_memberships.push({
        membership_id: generateId({ key: "ad_memberships", idField: "membership_id", idPrefix: "MBR" }),
        ad_user_id: adUserId, group_name: name, created_at: today, updated_at: today,
      });
    });
    await persistExtra("ad_memberships");
  }

  await persist(tableKey);
  await logChange(tableKey, id ? "Update" : "Create", rec);
  await pushRecordVersion(tableKey, rec);
  renderTable(tableKey);
  closeForm();
}

/* ---------------- Wire up static controls ---------------- */
document.getElementById("panelBody").addEventListener("click", (e) => {
  const addBtn = e.target.closest(".multi-ip-add");
  if (addBtn) {
    e.preventDefault();
    const list = document.getElementById(`f_${addBtn.dataset.key}_list`);
    if (!list) return;
    const row = document.createElement("div");
    row.className = "multi-ip-row";
    row.innerHTML = `<input type="text" class="multi-ip-input" data-key="${addBtn.dataset.key}" value="" placeholder="${addBtn.dataset.placeholder || ""}">
      <button type="button" class="icon-btn multi-ip-remove" aria-label="Remove this IP">−</button>`;
    list.appendChild(row);
    row.querySelector("input").focus();
    return;
  }
  const numberAddBtn = e.target.closest(".multi-number-add");
  if (numberAddBtn) {
    e.preventDefault();
    const list = document.getElementById(`f_${numberAddBtn.dataset.key}_list`);
    if (!list) return;
    const row = document.createElement("div");
    row.className = "multi-ip-row";
    row.innerHTML = `<input type="number" class="multi-ip-input" data-key="${numberAddBtn.dataset.key}" value="" placeholder="${numberAddBtn.dataset.placeholder || ""}" min="0">
      <button type="button" class="icon-btn multi-ip-remove" aria-label="Remove this entry">−</button>`;
    list.appendChild(row);
    row.querySelector("input").focus();
    return;
  }
  const selectAddBtn = e.target.closest(".multi-select-add");
  if (selectAddBtn) {
    e.preventDefault();
    const key = selectAddBtn.dataset.key;
    const list = document.getElementById(`f_${key}_list`);
    if (!list) return;
    const cfg = TABLES[state.editing.tableKey];
    const field = cfg.fields.find(f => f.key === key);
    const opts = field && field.dynamicOptions ? field.dynamicOptions() : [];
    const row = document.createElement("div");
    row.className = "multi-ip-row";
    row.innerHTML = `<select class="multi-select-input" data-key="${key}">
        <option value="">-- Select --</option>
        ${opts.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("")}
      </select>
      <button type="button" class="icon-btn multi-ip-remove" aria-label="Remove this entry">−</button>`;
    list.appendChild(row);
    return;
  }
  const removeBtn = e.target.closest(".multi-ip-remove");
  if (removeBtn) {
    e.preventDefault();
    const row = removeBtn.closest(".multi-ip-row");
    if (row) row.remove();
    return;
  }

  const nodeAddBtn = e.target.closest(".node-add");
  if (nodeAddBtn) {
    e.preventDefault();
    const list = document.getElementById(`f_${nodeAddBtn.dataset.key}_list`);
    if (!list) return;
    const idx = list.querySelectorAll(".node-row").length;
    const alreadyPicked = new Set(Array.from(list.querySelectorAll('[data-node-key="hardware_id"]')).map(s => s.value).filter(Boolean));
    const row = document.createElement("div");
    row.innerHTML = nodeRowMarkup({}, idx, alreadyPicked);
    const newRow = row.firstElementChild;
    list.appendChild(newRow);
    newRow.querySelectorAll('[data-ip-field="1"]').forEach(filterIpKeystroke);
    return;
  }

  const nodeRemoveBtn = e.target.closest(".node-remove");
  if (nodeRemoveBtn) {
    e.preventDefault();
    const row = nodeRemoveBtn.closest(".node-row");
    const list = row ? row.parentElement : null;
    if (row) row.remove();
    if (list) {
      Array.from(list.querySelectorAll(".node-row")).forEach((r, i) => {
        r.querySelector(".node-row-title").textContent = `Host ${i + 1}`;
      });
      refreshNodeHardwareOptions(list);
    }
  }
});
document.getElementById("panelBody").addEventListener("change", (e) => {
  const hwSelect = e.target.closest(".node-hw-select");
  if (!hwSelect) return;
  const list = hwSelect.closest(".node-list");
  if (list) refreshNodeHardwareOptions(list);
});
document.getElementById("nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-item");
  if (btn && btn.dataset.table) switchTable(btn.dataset.table);
  closeSidebarDrawer(); // no-op on desktop; on mobile a nav pick should close the drawer
});

/* ---------------- Mobile sidebar drawer ---------------- */
function openSidebarDrawer() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarBackdrop").hidden = false;
  document.getElementById("hamburgerBtn").setAttribute("aria-expanded", "true");
}
function closeSidebarDrawer() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").hidden = true;
  document.getElementById("hamburgerBtn").setAttribute("aria-expanded", "false");
}
document.getElementById("hamburgerBtn").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) closeSidebarDrawer();
  else openSidebarDrawer();
});
document.getElementById("sidebarBackdrop").addEventListener("click", closeSidebarDrawer);

/* ---------------- User menu (top-right) ---------------- */
document.getElementById("userMenuTrigger").addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = document.getElementById("userChip");
  const panel = document.getElementById("userMenuPanel");
  const willOpen = panel.hidden;
  panel.hidden = !willOpen;
  menu.classList.toggle("open", willOpen);
  document.getElementById("userMenuTrigger").setAttribute("aria-expanded", String(willOpen));
});
document.addEventListener("click", (e) => {
  const menu = document.getElementById("userChip");
  if (!menu.contains(e.target)) {
    document.getElementById("userMenuPanel").hidden = true;
    menu.classList.remove("open");
  }
});
document.getElementById("customView").addEventListener("change", (e) => {
  if (state.activeTable !== "access_check") return;
  if (e.target.id === "accessLookupMode") { state.accessLookup.mode = e.target.value; state.accessLookup.query = ""; }
  renderCustomView("access_check");
});
document.getElementById("customView").addEventListener("input", (e) => {
  if (state.activeTable !== "access_check" || e.target.id !== "accessLookupQuery") return;
  state.accessLookup.query = e.target.value;
  renderCustomView("access_check");
  document.getElementById("accessLookupQuery").focus();
  const el = document.getElementById("accessLookupQuery");
  el.setSelectionRange(el.value.length, el.value.length);
});
document.getElementById("customView").addEventListener("click", async (e) => {
  if (state.activeTable !== "recycle_bin") return;
  const restoreBtn = e.target.closest('[data-action="restore"]');
  if (restoreBtn) { await restoreFromRecycleBin(restoreBtn.dataset.trash); renderCustomView("recycle_bin"); return; }
  const purgeBtn = e.target.closest('[data-action="purge"]');
  if (purgeBtn) {
    if (purgeBtn.dataset.armed === "1") {
      await purgeFromRecycleBin(purgeBtn.dataset.trash);
      renderCustomView("recycle_bin");
    } else {
      purgeBtn.dataset.armed = "1";
      purgeBtn.textContent = "Confirm purge?";
      setTimeout(() => { if (purgeBtn.isConnected) { purgeBtn.dataset.armed = "0"; purgeBtn.textContent = "Delete forever"; } }, 3000);
    }
  }
});
document.getElementById("addBtn").addEventListener("click", () => openForm(state.activeTable, null));
document.getElementById("closePanelBtn").addEventListener("click", closeForm);
document.getElementById("cancelBtn").addEventListener("click", closeForm);
document.getElementById("closeHistoryPanelBtn").addEventListener("click", closeHistoryPanel);
document.getElementById("closeHistoryBtn2").addEventListener("click", closeHistoryPanel);
document.getElementById("closeRenewPanelBtn").addEventListener("click", closeRenewModal);
document.getElementById("renewCancelBtn").addEventListener("click", closeRenewModal);
wireDateMaskInput(document.getElementById("renewExpiryDisplay"), document.getElementById("renewExpiry"));
document.getElementById("renewForm").addEventListener("submit", (e) => { e.preventDefault(); submitRenew(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("modalBackdrop").classList.contains("open")) closeForm();
  if (e.key === "Escape" && document.getElementById("historyModalBackdrop").classList.contains("open")) closeHistoryPanel();
  if (e.key === "Escape" && document.getElementById("renewModalBackdrop").classList.contains("open")) closeRenewModal();
});
document.getElementById("dataForm").addEventListener("submit", (e) => { e.preventDefault(); saveForm(); });

/* ---------------- Init ---------------- */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  const errBox = document.getElementById("loginError");
  const u = state.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  const passwordHash = await sha256Hex(password);
  if (!u || u.password !== passwordHash) { errBox.textContent = "Invalid username or password."; errBox.hidden = false; return; }
  if (u.status !== "Active") { errBox.textContent = "This account is disabled."; errBox.hidden = false; return; }
  errBox.hidden = true;
  document.getElementById("loginPass").value = "";
  state.session = { user_id: u.user_id, username: u.username, role: u.role, full_name: u.full_name };
  saveSession();
  showApp();
});
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  showLogin();
});

(async function init() {
  renderNav();
  await loadAll();
  await loadCatalogs();
  document.getElementById("bootOverlay").hidden = true;
  if (restoreSession()) showApp();
  else showLogin();
})();
