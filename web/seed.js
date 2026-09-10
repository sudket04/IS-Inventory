/**
 * Demo data — `npm run seed` fills an empty database with a realistic IT
 * estate so every screen has something to show.
 *
 * It writes through the same db.insertRecord() the forms use, so ids, audit
 * log and version history behave exactly as they do in the UI.
 * Records already present are left alone — safe to run twice.
 */

const db = require("./db");
const { ENTITIES } = require("./entities");

const TODAY = new Date();
const d = (days) => new Date(TODAY.getTime() + days * 86400000)
  .toISOString().slice(0, 10);
const ACTOR = { user_id: "USR-001", username: "seed", role: "admin",
                display_name: "Seed script" };

async function add(key, rows, match) {
  const ent = ENTITIES[key];
  const existing = Object.fromEntries((await db.query(
    `SELECT * FROM ${ent.table}`)).map(r => [r[match], r[ent.idField]]));
  const out = { ...existing };
  let made = 0;
  for (const row of rows) {
    if (out[row[match]]) continue;
    out[row[match]] = await db.insertRecord(ent, row, ACTOR);
    made++;
  }
  console.log(`  ${ent.plural.padEnd(24)} +${made} (total ${Object.keys(out).length})`);
  return out;
}

async function seed() {
  console.log("[seed] locations");
  const loc = {};
  Object.assign(loc, await add("locations", [
    { level: "Site", name: "HQ Bangkok" }], "name"));
  Object.assign(loc, await add("locations", [
    { level: "Factory", name: "Factory 1", parent_id: loc["HQ Bangkok"] },
    { level: "Factory", name: "DR Site Chonburi", parent_id: loc["HQ Bangkok"] },
  ], "name"));
  Object.assign(loc, await add("locations", [
    { level: "Floor", name: "Floor 2", parent_id: loc["Factory 1"] },
    { level: "Floor", name: "DR Floor 1", parent_id: loc["DR Site Chonburi"] },
  ], "name"));
  Object.assign(loc, await add("locations", [
    { level: "Area", name: "Rack A-01", parent_id: loc["Floor 2"], rack_units: 42 },
    { level: "Area", name: "Rack A-02", parent_id: loc["Floor 2"], rack_units: 42 },
    { level: "Area", name: "Rack A-03", parent_id: loc["Floor 2"], rack_units: 42 },
    { level: "Area", name: "Rack DR-01", parent_id: loc["DR Floor 1"], rack_units: 42 },
  ], "name"));

  console.log("[seed] server hardware");
  const hwRows = [
    ["CN7412001", "Dell", "PowerEdge R750", "Rack A-01", 10, 2, "IS0101", 480000, 420],
    ["CN7412002", "Dell", "PowerEdge R750", "Rack A-01", 12, 2, "IS0102", 480000, 420],
    ["CN7412003", "Dell", "PowerEdge R750", "Rack A-01", 14, 2, "IS0103", 480000, 420],
    ["SGH301X4A1", "HPE", "ProLiant DL380 Gen10", "Rack A-02", 8, 2, "IS0121", 395000, 61],
    ["SGH301X4A2", "HPE", "ProLiant DL380 Gen10", "Rack A-02", 10, 2, "IS0122", 395000, 61],
    ["LNV88A0031", "Lenovo", "ThinkSystem SR650", "Rack A-02", 20, 2, "IS0141", 350000, -45],
    ["NTX55B0090", "Nutanix", "NX-3170-G8", "Rack A-03", 6, 2, "IS0161", 890000, 900],
    ["DRP99C0011", "Dell", "PowerEdge R650", "Rack DR-01", 12, 1, "IS0181", 320000, 210],
  ];
  const hw = await add("hardware", hwRows.map(
    ([serial, man, model, rack, u, h, asset, price, warranty], i) => ({
      asset_type: "Server", manufacturer: man, model, serial_number: serial,
      status: "In Use", location_id: loc[rack], u_start: u, u_height: h,
      fixed_asset: asset, purchase_price: price,
      commission_date: d(warranty > 300 ? -600 : -900),
      warranty_start: d(warranty > 300 ? -600 : -900),
      warranty_expiry: d(warranty), eol_date: d(warranty + 730),
      owner: "IT Infrastructure", cost_center: "IT-CC-1001",
      port_no: `Gi1/0/${i + 1}`, port_name: "SW-Core-01",
    })), "serial_number");

  Object.assign(hw, await add("hardware", [
    { asset_type: "Storage", storage_name: "SAN-PROD-01", storage_array_type: "SAN",
      capacity_gb: 122880, manufacturer: "Dell", model: "PowerStore 3200T",
      serial_number: "PS3200T0001", status: "In Use", location_id: loc["Rack A-03"],
      u_start: 20, u_height: 4, fixed_asset: "IS0201", purchase_price: 2400000,
      commission_date: d(-540), warranty_start: d(-540), warranty_expiry: d(555),
      eol_date: d(1650), owner: "IT Infrastructure", cost_center: "IT-CC-1001" },
    { asset_type: "Storage", storage_name: "NAS-BACKUP-01", storage_array_type: "NAS",
      capacity_gb: 61440, manufacturer: "Other", model: "Synology RS4021xs+",
      serial_number: "SYN4021X001", status: "In Use", location_id: loc["Rack DR-01"],
      u_start: 20, u_height: 3, fixed_asset: "IS0202", purchase_price: 420000,
      commission_date: d(-800), warranty_start: d(-800), warranty_expiry: d(-30),
      eol_date: d(400), owner: "IT Infrastructure", cost_center: "IT-CC-1001" },
  ], "serial_number"));

  console.log("[seed] clusters and hosts");
  const clu = await add("clusters", [
    { cluster_name: "CL-PROD-VMW", hypervisor_platform: "Vmware",
      infrastructure_type: "3-Tier (SAN-based)", management_console: "10.10.10.5",
      criticality: "Tier 1 (High)", environment: "Production", status: "Active",
      owner: "IT Infrastructure" },
    { cluster_name: "CL-DEV-HV", hypervisor_platform: "Hyper-V",
      infrastructure_type: "HCI - Azure Stack HCI", management_console: "10.10.30.5",
      criticality: "Tier 3 (Low)", environment: "Development", status: "Active",
      owner: "IT Infrastructure" },
  ], "cluster_name");

  const nodes = await add("cluster_nodes", [
    { cluster_id: clu["CL-PROD-VMW"], host_name: "ESX-PROD-01",
      hardware_id: hw.CN7412001, ip_host: "10.10.10.11", ip_management: "10.10.99.11" },
    { cluster_id: clu["CL-PROD-VMW"], host_name: "ESX-PROD-02",
      hardware_id: hw.CN7412002, ip_host: "10.10.10.12", ip_management: "10.10.99.12" },
    { cluster_id: clu["CL-PROD-VMW"], host_name: "ESX-PROD-03",
      hardware_id: hw.CN7412003, ip_host: "10.10.10.13", ip_management: "10.10.99.13" },
    { cluster_id: clu["CL-DEV-HV"], host_name: "HV-DEV-01",
      hardware_id: hw.SGH301X4A1, ip_host: "10.10.30.11", ip_management: "10.10.99.31" },
  ], "host_name");

  console.log("[seed] server list");
  const srvRows = [
    ["FS-PROD-01", "File Server", nodes["ESX-PROD-01"], "10.10.20.21", "Windows Server 2022", "Trust", "Production", 8, 32, 4096],
    ["FS-HQ-02", "File Server", nodes["ESX-PROD-02"], "10.10.20.22", "Windows Server 2022", "Trust", "Production", 8, 32, 8192],
    ["FS-ENG-01", "File Server", nodes["ESX-PROD-03"], "10.10.20.23", "Windows Server 2019", "Trust", "Production", 4, 16, 2048],
    ["DC-HQ-01", "Domain Controller", nodes["ESX-PROD-01"], "10.10.20.11", "Windows Server 2022", "Trust", "Production", 4, 16, 200],
    ["SQL-ERP-01", "Database Server", nodes["ESX-PROD-02"], "10.10.20.31", "Windows Server 2022", "Trust", "Production", 16, 128, 2048],
    ["APP-ERP-01", "Application Server", nodes["ESX-PROD-03"], "10.10.20.41", "Windows Server 2022", "Trust", "Production", 8, 32, 500],
    ["WEB-PORTAL-01", "Web Server", nodes["ESX-PROD-01"], "10.10.60.21", "Ubuntu 22.04 LTS", "DMZ Server", "Production", 4, 8, 200],
    ["DEV-APP-01", "Application Server", nodes["HV-DEV-01"], "10.10.30.41", "Windows Server 2019", "Trust", "Development", 4, 8, 200],
  ];
  const srv = await add("servers", srvRows.map(
    ([name, role, node, ip, os, zone, env, cores, ram, disk]) => ({
      hosting_type: "Virtual", server_role: role, node_id: node,
      system_group: name.includes("ERP") ? "ERP" : "Infrastructure",
      system_name: name, operating_system: os,
      fqdn: `${name.toLowerCase()}.company.co.th`, ip_address: ip,
      service_port: role === "File Server" ? "445" : "443", server_zone: zone,
      cpu_cores: cores, ram_gb: ram, storage_gb: disk,
      criticality: env === "Production" ? "Tier 1 (High)" : "Tier 3 (Low)",
      environment: env, status: "Active", owner: "IT Infrastructure",
    })), "system_name");

  Object.assign(srv, await add("servers", [
    { hosting_type: "Physical", server_role: "Backup Server", hardware_id: hw.LNV88A0031,
      system_group: "Infrastructure", system_name: "BKP-HQ-01",
      operating_system: "Windows Server 2022", fqdn: "bkp-hq-01.company.co.th",
      ip_address: "10.10.20.51", ip_management: "10.10.99.51", service_port: "9392",
      server_zone: "Management", cpu_cores: 24, ram_gb: 128, storage_gb: 40960,
      storage_type: "SAN", criticality: "Tier 2 (Medium)", environment: "Production",
      status: "Active", owner: "IT Infrastructure" },
    { hosting_type: "Physical", server_role: "File Server", hardware_id: hw.DRP99C0011,
      system_group: "Infrastructure", system_name: "FS-DR-01",
      operating_system: "Windows Server 2022", fqdn: "fs-dr-01.company.co.th",
      ip_address: "10.20.20.21", ip_management: "10.20.99.21", service_port: "445",
      server_zone: "Trust", cpu_cores: 16, ram_gb: 64, storage_gb: 20480,
      storage_type: "SAN", criticality: "Tier 2 (Medium)", environment: "DR",
      status: "Standby", owner: "IT Infrastructure" },
  ], "system_name"));

  console.log("[seed] network");
  await add("network_devices", [
    { category: "Network Device", subcategory: "Core Switch", device_name: "SW-Core-01",
      brand: "Cisco", model: "C9500-24Y4C", serial_number: "FCW2345A0A1", status: "Use",
      description: "Core switch server room A", network_zone: "Trust", role: "L3",
      detail: "Core Switch Server Farm", stack_id: "ST001", stack_role: "Active",
      mac_address: "aa:bb:cc:00:01:01", ip_management: "10.10.99.1",
      location_id: loc["Rack A-01"], u_start: 40, u_height: 1, fixed_asset: "IS0301",
      purchase_price: 1200000, commission_date: d(-720), warranty_start: d(-720),
      warranty_expiry: d(370), eol_date: d(1460), owner: "IT Infrastructure" },
    { category: "Network Device", subcategory: "Access Switch", device_name: "SW-ACC-F2-01",
      brand: "HPE", model: "Aruba 6300M", serial_number: "SG99K1A0B2", status: "Use",
      description: "Access switch floor 2", network_zone: "Trust", role: "L2",
      detail: "Access Switch Office", stack_id: "ST002", stack_role: "Member",
      mac_address: "aa:bb:cc:00:02:01", ip_management: "10.10.99.21",
      location_id: loc["Rack A-02"], u_start: 40, u_height: 1, fixed_asset: "IS0321",
      purchase_price: 260000, commission_date: d(-500), warranty_start: d(-500),
      warranty_expiry: d(75), eol_date: d(1100), owner: "IT Infrastructure" },
    { category: "Network Security Device", subcategory: "NGFW", device_name: "FW-EDGE-01",
      brand: "Fortinet", model: "FortiGate 600F", serial_number: "FG6H1A0C3", status: "Use",
      description: "Internet edge firewall", network_zone: "Untrust", role: "L3",
      detail: "Edge NGFW HA active", stack_id: "ST010", stack_role: "Active",
      mac_address: "aa:bb:cc:00:03:01", ip_management: "10.10.99.41",
      location_id: loc["Rack A-01"], u_start: 38, u_height: 1, fixed_asset: "IS0341",
      purchase_price: 950000, commission_date: d(-400), warranty_start: d(-400),
      warranty_expiry: d(-15), eol_date: d(900), owner: "IT Security" },
    { category: "Network Security Device", subcategory: "NGFW", device_name: "FW-EDGE-02",
      brand: "Fortinet", model: "FortiGate 600F", serial_number: "FG6H1A0C4",
      status: "Standby", description: "Internet edge firewall HA peer",
      network_zone: "Untrust", role: "L3", detail: "Edge NGFW HA standby",
      stack_id: "ST010", stack_role: "Standby", mac_address: "aa:bb:cc:00:03:02",
      ip_management: "10.10.99.42", location_id: loc["Rack A-01"], u_start: 37,
      u_height: 1, fixed_asset: "IS0342", purchase_price: 950000,
      commission_date: d(-400), warranty_start: d(-400), warranty_expiry: d(-15),
      eol_date: d(900), owner: "IT Security" },
    { category: "Network Device", subcategory: "Wireless Controller", device_name: "WLC-HQ-01",
      brand: "Cisco", model: "C9800-40-K9", serial_number: "FCW9800A0D5", status: "Use",
      description: "Wireless controller HQ", network_zone: "Management", role: "L3",
      detail: "WLC 300 APs", stack_id: "ST020", stack_role: "Active",
      mac_address: "aa:bb:cc:00:04:01", ip_management: "10.10.99.61",
      location_id: loc["Rack A-02"], u_start: 36, u_height: 1, fixed_asset: "IS0361",
      purchase_price: 780000, commission_date: d(-300), warranty_start: d(-300),
      warranty_expiry: d(430), eol_date: d(1500), owner: "IT Infrastructure" },
  ], "device_name");

  await add("vlans", [
    { vlan_number: 10, vlan_name: "VL10-MGMT", purpose: "Management network",
      network_address: "10.10.99.0", subnet_mask: "255.255.255.0", gateway: "10.10.99.254",
      gateway_device: "Core Switch", firewall_zone: "Management",
      routing: "Core → Firewall", dhcp_enabled: "No",
      static_start: "10.10.99.1", static_end: "10.10.99.200" },
    { vlan_number: 20, vlan_name: "VL20-SERVER", purpose: "Server network",
      network_address: "10.10.20.0", subnet_mask: "255.255.255.0", gateway: "10.10.20.254",
      gateway_device: "Core Switch", firewall_zone: "Trust", routing: "Core → Firewall",
      dhcp_enabled: "No", static_start: "10.10.20.1", static_end: "10.10.20.240" },
    { vlan_number: 30, vlan_name: "VL30-OFFICE", purpose: "Office clients",
      network_address: "10.10.40.0", subnet_mask: "255.255.252.0", gateway: "10.10.40.1",
      gateway_device: "Core Switch", firewall_zone: "Trust", routing: "Core → Firewall",
      dhcp_enabled: "Yes", dhcp_server: "10.10.20.11", dhcp_start: "10.10.40.50",
      dhcp_end: "10.10.43.200", static_start: "10.10.40.2", static_end: "10.10.40.49" },
    { vlan_number: 60, vlan_name: "VL60-DMZ", purpose: "DMZ servers",
      network_address: "10.10.60.0", subnet_mask: "255.255.255.0", gateway: "10.10.60.254",
      gateway_device: "Firewall", firewall_zone: "DMZ Server", routing: "Firewall only",
      dhcp_enabled: "No", static_start: "10.10.60.1", static_end: "10.10.60.200" },
    { vlan_number: 90, vlan_name: "VL90-GUEST", purpose: "Guest wifi",
      network_address: "172.20.0.0", subnet_mask: "255.255.0.0", gateway: "172.20.0.1",
      gateway_device: "Firewall", firewall_zone: "Guest", routing: "Firewall → Internet",
      dhcp_enabled: "Yes", dhcp_server: "172.20.0.1", dhcp_start: "172.20.1.1",
      dhcp_end: "172.20.9.254" },
  ], "vlan_name");

  console.log("[seed] software and licences");
  const sw = await add("software", [
    { software_name: "Windows Server 2022 Datacenter", publisher: "Microsoft",
      category: "Operating System", version: "2022", status: "Active",
      support_contact: "SoftDeal Co., Ltd · 02-123-4567", eos_date: d(1800),
      owner: "IT Infrastructure" },
    { software_name: "VMware vSphere", publisher: "Broadcom", category: "Virtualization",
      version: "8.0u2", status: "Active", support_contact: "VMware partner · 02-222-3333",
      eos_date: d(900), owner: "IT Infrastructure" },
    { software_name: "Microsoft SQL Server", publisher: "Microsoft", category: "Database",
      version: "2022", status: "Active", support_contact: "SoftDeal Co., Ltd",
      eos_date: d(1500), owner: "IT Applications" },
    { software_name: "Veeam Backup & Replication", publisher: "Veeam", category: "Backup",
      version: "12.1", status: "Active", support_contact: "Backup partner · 02-444-5555",
      eos_date: d(700), owner: "IT Infrastructure" },
    { software_name: "Microsoft 365 E3", publisher: "Microsoft",
      category: "Office / Productivity", version: "E3", status: "Active",
      support_contact: "CSP partner", owner: "IT Service Desk" },
    { software_name: "Trend Micro Apex One", publisher: "Trend Micro", category: "Security",
      version: "2019", status: "Active", support_contact: "Security partner · 02-666-7777",
      eos_date: d(420), owner: "IT Security" },
  ], "software_name");

  await add("licenses", [
    { software_id: sw["Windows Server 2022 Datacenter"], license_type: "Perpetual",
      license_model: "Core", license_edition: "Datacenter", status: "Active",
      license_quantity: 256, used_quantity: 208, license_key: "WSDC-2022-AAAA-0001",
      agreement_no: "AGR-2024-0011", po_no: "PO-2024-0231", vendor: "SoftDeal Co., Ltd",
      purchase_date: d(-700), start_date: d(-700), auto_renewal: "No", cost: 1850000,
      currency: "THB", cost_center: "IT-CC-1001", owner: "IT Infrastructure" },
    { software_id: sw["VMware vSphere"], license_type: "Subscription",
      license_model: "Core", license_edition: "Enterprise", status: "Active",
      license_quantity: 96, used_quantity: 96, license_key: "VMW-VSPH-8888-0002",
      agreement_no: "AGR-2025-0042", po_no: "PO-2025-0118", vendor: "VMware partner",
      purchase_date: d(-330), start_date: d(-330), expiry_date: d(35),
      auto_renewal: "Yes", renewal_period: "1 Year", cost: 2600000, currency: "THB",
      cost_center: "IT-CC-1001", owner: "IT Infrastructure" },
    { software_id: sw["Microsoft SQL Server"], license_type: "Perpetual",
      license_model: "Core", license_edition: "Enterprise", status: "Active",
      license_quantity: 16, used_quantity: 16, license_key: "SQL-2022-ENT-0003",
      agreement_no: "AGR-2023-0007", po_no: "PO-2023-0090", vendor: "SoftDeal Co., Ltd",
      purchase_date: d(-1100), start_date: d(-1100), auto_renewal: "No", cost: 4200000,
      currency: "THB", cost_center: "IT-CC-1002", owner: "IT Applications" },
    { software_id: sw["Veeam Backup & Replication"], license_type: "Subscription",
      license_model: "Server", license_edition: "Enterprise", status: "Expiring",
      license_quantity: 40, used_quantity: 44, license_key: "VEEAM-12-1-0004",
      agreement_no: "AGR-2025-0055", po_no: "PO-2025-0201", vendor: "Backup partner",
      purchase_date: d(-300), start_date: d(-300), expiry_date: d(58),
      auto_renewal: "No", cost: 890000, currency: "THB", cost_center: "IT-CC-1001",
      owner: "IT Infrastructure",
      remarks: "Over-allocated — 4 more workloads than licensed" },
    { software_id: sw["Microsoft 365 E3"], license_type: "Subscription",
      license_model: "User", license_edition: "Standard", status: "Active",
      license_quantity: 1200, used_quantity: 1147, license_key: "M365-E3-0005",
      agreement_no: "AGR-2026-0002", po_no: "PO-2026-0014", vendor: "CSP partner",
      purchase_date: d(-120), start_date: d(-120), expiry_date: d(245),
      auto_renewal: "Yes", renewal_period: "1 Year", cost: 9600000, currency: "THB",
      cost_center: "IT-CC-1003", owner: "IT Service Desk" },
    { software_id: sw["Trend Micro Apex One"], license_type: "Subscription",
      license_model: "Device", license_edition: "Standard", status: "Expired",
      license_quantity: 1400, used_quantity: 1362, license_key: "TM-APEX-0006",
      agreement_no: "AGR-2024-0088", po_no: "PO-2024-0402", vendor: "Security partner",
      purchase_date: d(-760), start_date: d(-760), expiry_date: d(-26),
      auto_renewal: "No", cost: 1120000, currency: "THB", cost_center: "IT-CC-1004",
      owner: "IT Security", remarks: "Renewal quote requested 2 weeks ago" },
  ], "license_key");

  console.log("[seed] AD users, groups and folder permissions");
  const people = [
    ["somchai.p", "Somchai Pattana", "Somchai", "Pattana", "System Engineer",
     "IT Infrastructure", "Enabled",
     ["IT Infra_Modify", "All Staff_Read Only", "VPN Users", "Domain Admins"]],
    ["nutthapong", "Nutthapong Sri", "Nutthapong", "Sri", "Network Engineer",
     "IT Infrastructure", "Enabled",
     ["IT Infra_Modify", "All Staff_Read Only", "VPN Users"]],
    ["sudket.i", "Sudket Innuput", "Sudket", "Innuput", "Staff", "Production Control",
     "Enabled", ["Production Control_Modify", "PC Common_Modify",
                 "PU Secret_Read Only", "All Staff_Read Only"]],
    ["wanida.k", "Wanida Kaewkla", "Wanida", "Kaewkla", "Accounting Supervisor",
     "Finance", "Enabled",
     ["Finance_Modify", "Finance Report_Read Only", "All Staff_Read Only"]],
    ["pisit.t", "Pisit Thongdee", "Pisit", "Thongdee", "Operator", "Production",
     "Disabled", ["All Staff_Read Only"]],
    ["kanya.s", "Kanya Suwan", "Kanya", "Suwan", "Purchasing Officer", "Purchasing",
     "Enabled", ["PU Secret_Modify", "PU Common_Modify", "All Staff_Read Only"]],
    ["thanit.r", "Thanit Rakchai", "Thanit", "Rakchai", "Design Engineer", "Engineering",
     "Enabled", ["Engineering_Modify", "Drawing_Read Only", "All Staff_Read Only"]],
    ["viewer.qa", "QA Viewer", "QA", "Viewer", "QA Inspector", "Quality Assurance",
     "Enabled", ["QA Common_Read Only", "All Staff_Read Only"]],
  ];
  await add("ad_users", people.map(([logon, name, first, last, title, dept, status]) => ({
    user_logon: logon, display_name: name, first_name: first, surname: last,
    status, job_title: title, department: dept,
    email: status === "Enabled" ? `${logon}@company.co.th` : "",
    source_file: "AD_AllGroups_seed.csv", imported_at: db.now(),
  })), "user_logon");

  const mem = ENTITIES.ad_memberships;
  const have = new Set((await db.query(`SELECT * FROM ${mem.table}`))
    .map(r => r.user_logon + "||" + r.group_name));
  let made = 0;
  for (const [logon, , , , , , , groups] of people) {
    for (const g of groups) {
      if (have.has(logon + "||" + g)) continue;
      await db.insertRecord(mem, { user_logon: logon, group_name: g,
                                   source_file: "AD_AllGroups_seed.csv" }, ACTOR);
      have.add(logon + "||" + g);
      made++;
    }
  }
  console.log(`  ${mem.plural.padEnd(24)} +${made}`);

  const folders = [
    ["FS-PROD-01", "Production Control", "\\\\FS-PROD-01\\Share\\ProductionControl",
     "Level 1", "Production Control", "Production Control_Modify", null, 500, "sudket.i"],
    ["FS-PROD-01", "PC Common", "\\\\FS-PROD-01\\Share\\PC_Common", "Level 2",
     "Production Control", "PC Common_Modify", "All Staff_Read Only", 200, "sudket.i"],
    ["FS-PROD-01", "QA Common", "\\\\FS-PROD-01\\Share\\QA_Common", "Level 2",
     "Quality Assurance", null, "QA Common_Read Only", 150, "viewer.qa"],
    ["FS-HQ-02", "PU Secret", "\\\\FS-HQ-02\\Secret\\Purchasing", "Level 1", "Purchasing",
     "PU Secret_Modify", "PU Secret_Read Only", 120, "kanya.s"],
    ["FS-HQ-02", "Finance", "\\\\FS-HQ-02\\Share\\Finance", "Level 1", "Finance",
     "Finance_Modify", "Finance Report_Read Only", 300, "wanida.k"],
    ["FS-HQ-02", "All Staff", "\\\\FS-HQ-02\\Share\\AllStaff", "Level 3", "Company",
     null, "All Staff_Read Only", null, "somchai.p"],
    ["FS-HQ-02", "IT Infra", "\\\\FS-HQ-02\\Share\\IT", "Level 1", "IT Infrastructure",
     "IT Infra_Modify", null, 400, "somchai.p"],
    ["FS-ENG-01", "Engineering", "\\\\FS-ENG-01\\Share\\Engineering", "Level 1",
     "Engineering", "Engineering_Modify", "Drawing_Read Only", 2000, "thanit.r"],
    ["FS-ENG-01", "Mold Shop", "\\\\FS-ENG-01\\Share\\MoldShop", "Level 2", "Engineering",
     null, "Mold Shop_Read Only", 800, "thanit.r"],
    ["FS-ENG-01", "Scan Drop", "\\\\FS-ENG-01\\Share\\ScanDrop", "Level 3", "Engineering",
     null, null, null, "thanit.r"],
    ["FS-DR-01", "DR Replica", "\\\\FS-DR-01\\Replica\\HQ", "Level 1",
     "IT Infrastructure", "IT Infra_Modify", null, 4000, "somchai.p"],
  ];
  await add("server_permissions", folders.map(
    ([server, name, path, level, dept, rw, ro, quota, owner]) => ({
      server_id: srv[server], folder_name: name, folder_path: path, level,
      department: dept, rw_group: rw, ro_group: ro, quota_gb: quota, owner,
      source_file: "Master_server_seed.csv",
    })), "folder_name");

  console.log("[seed] accounts");
  if (!(await db.findUser("viewer"))) {
    const { salt, hash } = db.hashPassword("viewer123");
    await db.execute(
      "INSERT INTO dbo.users (user_id, username, display_name, email, role, status," +
      " password_hash, password_salt, created_at, created_by, updated_at, updated_by)" +
      " VALUES (@p0,@p1,@p2,@p3,'viewer','Active',@p4,@p5,@p6,'seed',@p6,'seed')",
      [await db.nextUserId(), "viewer", "Read-only Viewer", "viewer@company.co.th",
       hash, salt, db.now()]);
    console.log("  viewer / viewer123 (read-only)");
  } else {
    console.log("  viewer account already there");
  }
}

(async function main() {
  try {
    await db.initDb();
    await seed();
    console.log("\n[seed] done — start the site with:  npm start");
    console.log("[seed] sign in as admin / admin123  (or viewer / viewer123)");
    process.exit(0);
  } catch (err) {
    console.error("\n[seed] failed:", err.message);
    process.exit(1);
  }
})();
