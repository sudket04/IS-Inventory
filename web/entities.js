/**
 * Entity configuration — the single source of truth for the whole app.
 *
 * Every table, form, list column, filter chip and history diff is generated
 * from what is declared here, so adding a field means editing ONE list.
 * The API routes and the browser renderer are generic; this file is the schema.
 *
 * Field types map to both a SQL Server column type and a form control:
 *   text money int date select ip mac textarea ref bool
 */

const LOOKUPS = {
  AssetType: ["Server", "Storage"],
  HardwareStatus: ["In Stock", "In Use", "Maintenance", "Decommissioned"],
  Manufacturer: ["Dell", "HPE", "Lenovo", "Nutanix", "Other"],
  StorageArrayType: ["SAN", "NAS", "DAS", "Other"],
  HostingType: ["Virtual", "Physical"],
  HypervisorPlatform: ["Vmware", "Hyper-V", "Nutanix", "N/A"],
  InfrastructureType: [
    "3-Tier (SAN-based)", "HCI - Nutanix", "HCI - VMware vSAN",
    "HCI - Dell VxRail", "HCI - Cisco HyperFlex", "HCI - HPE SimpliVity",
    "HCI - Azure Stack HCI", "Other",
  ],
  Criticality: ["Tier 1 (High)", "Tier 2 (Medium)", "Tier 3 (Low)"],
  Environment: ["Production", "UAT", "Development", "DR"],
  Status: ["Active", "Maintenance", "Decommissioned", "Standby"],
  StorageType: ["SSD", "HDD", "SAN", "NAS"],
  NetworkZone: ["Trust", "Untrust", "DMZ", "DMZ Internet", "DMZ Server",
                "Management", "Guest"],
  LocationLevel: ["Site", "Factory", "Floor", "Area", "Rack"],
  DhcpEnabled: ["Yes", "No"],
  GatewayDevice: ["Core Switch", "Firewall", "Router", "Other"],
  DeviceStatus: ["Use", "Standby", "Decommissioned"],
  StackRole: ["Member", "Active", "Standby"],
  DeviceRole: ["L2", "L3"],
  NetworkBrand: ["Cisco", "HPE", "Huawei", "Fortinet", "Other"],
  UserRole: ["admin", "viewer"],
  UserStatus: ["Active", "Inactive"],
  SoftwareCategory: ["Operating System", "Database", "Virtualization", "Backup",
                     "Security", "Middleware", "Monitoring",
                     "Business Application", "Office / Productivity", "Other"],
  SoftwareStatus: ["Active", "Evaluation", "Retired"],
  LicenseType: ["Perpetual", "Subscription"],
  LicenseModel: ["User", "Device", "Core", "Server", "Concurrent"],
  LicenseEdition: ["Standard", "Professional", "Enterprise", "Datacenter", "Other"],
  LicenseStatus: ["Active", "Expiring", "Expired", "Suspended", "Terminated"],
  AutoRenewal: ["Yes", "No"],
  RenewalPeriod: ["1 Month", "3 Months", "6 Months", "1 Year", "2 Years", "3 Years"],
  Currency: ["THB", "USD", "EUR", "JPY"],
  AttachmentType: ["Agreement", "Invoice", "License Certificate", "Photo", "Other"],
  ServerRole: ["File Server", "Application Server", "Database Server",
               "Web Server", "Domain Controller", "Backup Server", "Other"],
  AdStatus: ["Enabled", "Disabled"],
  ImportSource: ["AD_AllGroups", "Master_server", "Manual"],
};

const NETWORK_CATEGORIES = {
  "Network Device": ["Router", "Switch", "Core Switch", "Distribution Switch",
                     "Access Switch", "Access Point (AP)", "Wireless Controller",
                     "SD-WAN"],
  "Network Security Device": ["Firewall", "NGFW", "IDS", "IPS", "TippingPoint",
                              "WAF", "NAC", "DDoS Protection"],
  "VPN / Remote Access": ["Ivanti Connect Secure (VPN)"],
  "Network Service / Server": ["DNS Server", "DHCP Server", "Proxy Server",
                               "NTP Server", "RADIUS Server", "LDAP/AD"],
  "Network Management": ["SolarWinds"],
  "Monitoring & Logging": ["ArcSight"],
};

const STACK_IDS = Array.from({ length: 100 },
  (_, i) => "ST" + String(i + 1).padStart(3, "0"));

const SQL_TYPES = {
  text: "NVARCHAR(200)", textarea: "NVARCHAR(MAX)", select: "NVARCHAR(80)",
  ref: "NVARCHAR(32)", ip: "NVARCHAR(45)", mac: "NVARCHAR(24)",
  date: "DATE", int: "INT", money: "DECIMAL(18,2)", bool: "BIT",
};

/** Field(name, label, type, group, extras) */
function F(name, label, type = "text", group = "Details", extra = {}) {
  return {
    name, label, type, group,
    required: false, options: null, ref: null, refFilter: null,
    onlyFor: null, placeholder: "", help: "", unique: false,
    sqlType: SQL_TYPES[type] || "NVARCHAR(200)",
    ...extra,
  };
}

/** Column(name, label, kind, width, filterOn) */
function C(name, label, kind = "text", width = "", filterOn = "") {
  return { name, label, kind, width, filterOn };
}

/** Chip(key, label, where, params, counts) */
function K(key, label, where = "", params = [], counts = false) {
  return { key, label, where, params, counts };
}

const locationFields = (required = false) => [
  F("location_id", "Rack", "ref", "Location", {
    required, ref: "locations", refFilter: "level = 'Rack'",
    help: "Pick the rack — Site › Factory › Floor › Area › Rack comes with it",
  }),
  F("u_start", "Start U", "int", "Location", { placeholder: "e.g. 10" }),
  F("u_height", "Height (U)", "int", "Location", { placeholder: "e.g. 2" }),
];

const warrantyFields = (priceHint = "e.g. 350000") => [
  F("fixed_asset", "Fixed Asset No.", "text", "Warranty & asset",
    { required: true, placeholder: "e.g. IS001" }),
  F("purchase_price", "Asset value (THB)", "money", "Warranty & asset",
    { placeholder: priceHint }),
  F("commission_date", "Commission date", "date", "Warranty & asset"),
  F("warranty_start", "Warranty start", "date", "Warranty & asset"),
  F("warranty_expiry", "Warranty expiry", "date", "Warranty & asset", { required: true }),
  F("eol_date", "EOL / EOS date", "date", "Warranty & asset"),
];

const WARRANTY_CHIPS = [
  K("all", "All"),
  K("warranty90", "Warranty <90d",
    "warranty_expiry IS NOT NULL AND warranty_expiry <= DATEADD(day, 90, CAST(GETDATE() AS date))",
    [], true),
  K("expired", "Expired",
    "warranty_expiry IS NOT NULL AND warranty_expiry < CAST(GETDATE() AS date)", [], true),
  K("nodata", "Missing asset data",
    "(fixed_asset IS NULL OR fixed_asset = '' OR warranty_expiry IS NULL)", [], true),
];

const LICENSE_CHIPS = [
  K("all", "All"),
  K("subscription", "Subscription", "license_type = @p0", ["Subscription"]),
  K("perpetual", "Perpetual", "license_type = @p0", ["Perpetual"]),
  K("expiring90", "Expiring <90d",
    "expiry_date IS NOT NULL AND expiry_date >= CAST(GETDATE() AS date)" +
    " AND expiry_date <= DATEADD(day, 90, CAST(GETDATE() AS date))", [], true),
  K("expired", "Expired",
    "expiry_date IS NOT NULL AND expiry_date < CAST(GETDATE() AS date)", [], true),
  K("overused", "Over-allocated",
    "ISNULL(used_quantity, 0) > ISNULL(license_quantity, 0)", [], true),
  K("norenewal", "Subscription, no auto-renew",
    "license_type = 'Subscription' AND (auto_renewal IS NULL OR auto_renewal = 'No')",
    [], true),
];

const HARDWARE = {
  key: "hardware", table: "dbo.hardware", label: "Server hardware",
  plural: "Server hardware", idField: "hardware_id", idPrefix: "HW", idWidth: 3,
  route: "/server/hardware", navGroup: "Server", navOrder: 1,
  desc: "Physical servers and storage arrays — the boxes that carry a serial number, a rack position and a warranty",
  discriminator: "asset_type", titleField: "serial_number",
  fields: [
    F("asset_type", "Asset type", "select", "Identity",
      { required: true, options: LOOKUPS.AssetType }),
    F("storage_name", "Storage name", "text", "Identity",
      { required: true, onlyFor: "Storage", unique: true }),
    F("storage_array_type", "Storage array type", "select", "Identity",
      { onlyFor: "Storage", options: LOOKUPS.StorageArrayType }),
    F("capacity_gb", "Total capacity (GB)", "int", "Identity", { onlyFor: "Storage" }),
    F("manufacturer", "Manufacturer", "select", "Identity",
      { required: true, options: LOOKUPS.Manufacturer }),
    F("model", "Model", "text", "Identity", { placeholder: "e.g. PowerEdge R740" }),
    F("serial_number", "Serial number", "text", "Identity",
      { required: true, unique: true }),
    F("status", "Status", "select", "Identity",
      { required: true, options: LOOKUPS.HardwareStatus }),
    F("port_no", "Switch port", "text", "Network",
      { onlyFor: "Server", placeholder: "e.g. Gi1/0/1" }),
    F("port_name", "Switch name", "text", "Network",
      { onlyFor: "Server", placeholder: "e.g. SW-Core-01" }),
    ...locationFields(),
    ...warrantyFields(),
    F("owner", "Owner", "text", "Other", { placeholder: "e.g. IT Infrastructure" }),
    F("cost_center", "Cost center", "text", "Other", { placeholder: "e.g. IT-CC-1001" }),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("asset_type", "Type", "type", "84px"),
    C("serial_number", "Serial", "mono"),
    C("identity", "Model / name", "text", "", "model"),
    C("location_id", "Location", "ref"),
    C("warranty_expiry", "Warranty", "warranty", "170px"),
    C("status", "Status", "badge", "120px"),
  ],
  search: ["serial_number", "model", "storage_name", "fixed_asset", "owner", "manufacturer"],
  chips: [K("all", "All"), K("server", "Server", "asset_type = @p0", ["Server"]),
          K("storage", "Storage", "asset_type = @p0", ["Storage"]), ...WARRANTY_CHIPS.slice(1)],
};

const CLUSTERS = {
  key: "clusters", table: "dbo.clusters", label: "Cluster", plural: "Clusters",
  idField: "cluster_id", idPrefix: "CLU", idWidth: 3, route: "/server/clusters",
  navGroup: "Server", navOrder: 2, titleField: "cluster_name",
  desc: "Hypervisor clusters — each host/node points at a hardware record, so a node inherits its warranty",
  fields: [
    F("cluster_name", "Cluster name", "text", "Identity", { required: true, unique: true }),
    F("hypervisor_platform", "Hypervisor", "select", "Identity",
      { required: true, options: LOOKUPS.HypervisorPlatform }),
    F("infrastructure_type", "Architecture", "select", "Identity",
      { required: true, options: LOOKUPS.InfrastructureType }),
    F("management_console", "Management console IP", "ip", "Identity",
      { placeholder: "e.g. 192.168.1.5" }),
    F("criticality", "Criticality", "select", "Lifecycle",
      { required: true, options: LOOKUPS.Criticality }),
    F("environment", "Environment", "select", "Lifecycle",
      { required: true, options: LOOKUPS.Environment }),
    F("status", "Status", "select", "Lifecycle",
      { required: true, options: LOOKUPS.Status }),
    F("owner", "Owner", "text", "Other"),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("cluster_name", "Cluster", "mono"),
    C("hypervisor_platform", "Hypervisor"),
    C("infrastructure_type", "Architecture"),
    C("node_count", "Hosts", "text", "80px"),
    C("criticality", "Criticality"),
    C("status", "Status", "badge", "120px"),
  ],
  search: ["cluster_name", "hypervisor_platform", "owner"],
  chips: [K("all", "All")],
};

const CLUSTER_NODES = {
  key: "cluster_nodes", table: "dbo.cluster_nodes", label: "Host / Node",
  plural: "Hosts / Nodes", idField: "node_id", idPrefix: "NODE", idWidth: 3,
  route: "/server/clusters/nodes", parent: "clusters", parentKey: "cluster_id",
  hiddenInNav: true, titleField: "host_name",
  fields: [
    F("cluster_id", "Cluster", "ref", "Identity", { required: true, ref: "clusters" }),
    F("host_name", "Host name", "text", "Identity", { required: true, unique: true }),
    F("hardware_id", "Hardware", "ref", "Identity", {
      required: true, ref: "hardware", refFilter: "asset_type = 'Server'", unique: true,
      help: "One physical box can only be one host",
    }),
    F("ip_host", "IP host", "ip", "Network", { unique: true }),
    F("ip_management", "IP management (iDRAC/iLO)", "ip", "Network", { unique: true }),
  ],
  columns: [
    C("host_name", "Host", "mono"),
    C("hardware_id", "Hardware", "ref"),
    C("ip_host", "IP host", "mono"),
    C("ip_management", "IP mgmt", "mono"),
  ],
  search: ["host_name", "ip_host", "ip_management"],
  chips: [K("all", "All")],
};

const SERVERS = {
  key: "servers", table: "dbo.servers", label: "Server list", plural: "Server list",
  idField: "server_id", idPrefix: "SRV", idWidth: 3, route: "/server/list",
  navGroup: "Server", navOrder: 3, discriminator: "hosting_type",
  titleField: "system_name",
  desc: "Every running system — virtual machines on a cluster host, and physical servers on a hardware record",
  fields: [
    F("hosting_type", "Hosting type", "select", "Identity",
      { required: true, options: LOOKUPS.HostingType }),
    F("server_role", "Server role", "select", "Identity", {
      options: LOOKUPS.ServerRole,
      help: "File Server rows are the ones Permission control can map folders to",
    }),
    F("node_id", "Host", "ref", "Identity",
      { required: true, onlyFor: "Virtual", ref: "cluster_nodes" }),
    F("hardware_id", "Hardware", "ref", "Identity", {
      required: true, onlyFor: "Physical", ref: "hardware",
      refFilter: "asset_type = 'Server'", unique: true,
    }),
    F("system_group", "System group", "text", "Identity"),
    F("system_name", "System name", "text", "Identity", { required: true, unique: true }),
    F("operating_system", "Operating system", "text", "Identity"),
    F("fqdn", "FQDN", "text", "Network"),
    F("ip_address", "IP address", "ip", "Network", { required: true, unique: true }),
    F("ip_management", "IP (iDRAC/iLO)", "ip", "Network", { onlyFor: "Physical" }),
    F("service_port", "Service port (TCP)", "text", "Network",
      { placeholder: "e.g. 443, 8080" }),
    F("server_zone", "Server zone", "select", "Network",
      { required: true, options: LOOKUPS.NetworkZone }),
    F("cpu_cores", "CPU cores", "int", "Capacity"),
    F("ram_gb", "RAM (GB)", "int", "Capacity"),
    F("storage_gb", "Storage (GB)", "int", "Capacity"),
    F("storage_type", "Storage type", "select", "Capacity",
      { onlyFor: "Physical", options: LOOKUPS.StorageType }),
    F("criticality", "Criticality", "select", "Lifecycle", { options: LOOKUPS.Criticality }),
    F("environment", "Environment", "select", "Lifecycle",
      { required: true, options: LOOKUPS.Environment }),
    F("status", "Status", "select", "Lifecycle",
      { required: true, options: LOOKUPS.Status }),
    F("owner", "Owner", "text", "Other"),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("hosting_type", "Type", "type", "84px"),
    C("system_name", "System", "mono"),
    C("ip_address", "IP address", "mono"),
    C("context", "Runs on"),
    C("environment", "Env"),
    C("status", "Status", "badge", "120px"),
  ],
  search: ["system_name", "ip_address", "fqdn", "operating_system", "owner"],
  chips: [K("all", "All"), K("virtual", "Virtual", "hosting_type = @p0", ["Virtual"]),
          K("physical", "Physical", "hosting_type = @p0", ["Physical"]),
          K("fileserver", "File Server", "server_role = @p0", ["File Server"], true)],
};

const NETWORK = {
  key: "network_devices", table: "dbo.network_devices", label: "Network hardware",
  plural: "Network hardware", idField: "device_id", idPrefix: "NET", idWidth: 3,
  route: "/network/hardware", navGroup: "Network", navOrder: 1,
  discriminator: "category", titleField: "device_name",
  desc: "Switches, firewalls and everything else with a management IP — same location and warranty model as server hardware",
  fields: [
    F("category", "Category", "select", "Identity",
      { required: true, options: Object.keys(NETWORK_CATEGORIES) }),
    F("subcategory", "Sub-category", "select", "Identity", {
      required: true,
      options: [...new Set(Object.values(NETWORK_CATEGORIES).flat())].sort(),
    }),
    F("device_name", "Device name", "text", "Identity", { required: true, unique: true }),
    F("brand", "Brand", "select", "Identity",
      { required: true, options: LOOKUPS.NetworkBrand }),
    F("model", "Model", "text", "Identity"),
    F("serial_number", "Serial number", "text", "Identity",
      { required: true, unique: true }),
    F("status", "Status", "select", "Identity",
      { required: true, options: LOOKUPS.DeviceStatus }),
    F("description", "Description", "text", "Identity"),
    F("network_zone", "Network zone", "select", "Role & stack",
      { options: LOOKUPS.NetworkZone }),
    F("role", "Role", "select", "Role & stack", { options: LOOKUPS.DeviceRole }),
    F("detail", "Detail", "text", "Role & stack",
      { placeholder: "e.g. Core Switch Wifi" }),
    F("stack_id", "Stack ID", "select", "Role & stack", { options: STACK_IDS }),
    F("stack_role", "Stack role", "select", "Role & stack",
      { options: LOOKUPS.StackRole }),
    F("mac_address", "MAC address", "mac", "Network",
      { required: true, placeholder: "aa:bb:cc:dd:ee:01", unique: true }),
    F("ip_management", "IP management", "ip", "Network",
      { required: true, unique: true }),
    ...locationFields(),
    ...warrantyFields("e.g. 120000"),
    F("owner", "Owner", "text", "Other"),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("subcategory", "Type", "type", "110px"),
    C("device_name", "Name", "mono"),
    C("ip_management", "IP mgmt", "mono"),
    C("location_id", "Location", "ref"),
    C("warranty_expiry", "Warranty", "warranty", "170px"),
    C("status", "Status", "badge", "110px"),
  ],
  search: ["device_name", "serial_number", "ip_management", "mac_address",
           "fixed_asset", "model"],
  chips: [K("all", "All"),
          K("switch", "Switches", "subcategory LIKE @p0", ["%Switch%"]),
          K("security", "Security", "category = @p0", ["Network Security Device"]),
          ...WARRANTY_CHIPS.slice(1)],
};

const VLANS = {
  key: "vlans", table: "dbo.vlans", label: "VLAN / subnet", plural: "VLANs",
  idField: "vlan_pk", idPrefix: "VLA", idWidth: 3, route: "/network/vlans",
  navGroup: "Network", navOrder: 2, titleField: "vlan_name",
  desc: "VLAN register with subnet maths — gateway, DHCP pool and static range are checked against the network address",
  fields: [
    F("vlan_number", "VLAN ID", "int", "Identity", { required: true, unique: true }),
    F("vlan_name", "VLAN name", "text", "Identity", { required: true, unique: true }),
    F("purpose", "Purpose", "text", "Identity", { placeholder: "e.g. Server Network" }),
    F("network_address", "Network address", "ip", "Subnet",
      { required: true, placeholder: "e.g. 10.10.20.0", unique: true }),
    F("subnet_mask", "Subnet mask", "ip", "Subnet",
      { required: true, placeholder: "e.g. 255.255.255.0" }),
    F("gateway", "Gateway", "ip", "Routing", { placeholder: "e.g. 10.10.20.1" }),
    F("gateway_device", "Gateway device", "select", "Routing",
      { options: LOOKUPS.GatewayDevice }),
    F("firewall_zone", "Firewall zone", "select", "Routing",
      { options: LOOKUPS.NetworkZone }),
    F("routing", "Routing", "text", "Routing", { placeholder: "e.g. Core → Firewall" }),
    F("dhcp_enabled", "DHCP", "select", "DHCP",
      { required: true, options: LOOKUPS.DhcpEnabled }),
    F("dhcp_server", "DHCP server", "ip", "DHCP"),
    F("dhcp_start", "DHCP start", "ip", "DHCP"),
    F("dhcp_end", "DHCP end", "ip", "DHCP"),
    F("static_start", "Static range start", "ip", "Static range"),
    F("static_end", "Static range end", "ip", "Static range"),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("vlan_number", "VLAN", "mono", "80px"),
    C("vlan_name", "Name", "mono"),
    C("purpose", "Purpose"),
    C("subnet", "Network", "mono"),
    C("gateway", "Gateway", "mono"),
    C("firewall_zone", "Zone"),
  ],
  search: ["vlan_name", "purpose", "network_address", "gateway"],
  chips: [K("all", "All"), K("dhcp", "DHCP on", "dhcp_enabled = @p0", ["Yes"])],
};

const LOCATIONS = {
  key: "locations", table: "dbo.locations", label: "Locations & racks",
  plural: "Locations & racks", idField: "location_id", idPrefix: "LOC", idWidth: 3,
  route: "/reference/locations", navGroup: "Reference", navOrder: 1,
  discriminator: "level", titleField: "name",
  desc: "Site › Factory › Floor › Area › Rack — one vocabulary for every form, so “what is in Rack 01” has an answer",
  fields: [
    F("level", "Level", "select", "Identity",
      { required: true, options: LOOKUPS.LocationLevel }),
    F("name", "Name", "text", "Identity", { required: true }),
    F("parent_id", "Parent", "ref", "Identity", {
      ref: "locations",
      help: "Site has no parent; everything else sits under the level above it",
    }),
    F("rack_units", "Rack height (U)", "int", "Identity",
      { onlyFor: "Rack", placeholder: "e.g. 42" }),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("level", "Level", "type", "90px"),
    C("path", "Path", "mono"),
    C("occupancy", "Occupancy", "text", "140px"),
  ],
  search: ["name"],
  chips: [K("all", "All"),
          ...LOOKUPS.LocationLevel.map(l => K(l.toLowerCase(), l, "level = @p0", [l]))],
};

const SOFTWARE = {
  key: "software", table: "dbo.software", label: "Software",
  plural: "Software catalogue", idField: "software_id", idPrefix: "SW", idWidth: 4,
  route: "/software/catalogue", navGroup: "Software", navOrder: 1,
  titleField: "software_name",
  desc: "What is installed and paid for — one row per product, with its licences hanging off it",
  fields: [
    F("software_name", "Software name", "text", "Identity",
      { required: true, unique: true, placeholder: "e.g. Windows Server 2022" }),
    F("publisher", "Publisher", "text", "Identity",
      { required: true, placeholder: "e.g. Microsoft" }),
    F("category", "Category", "select", "Identity",
      { required: true, options: LOOKUPS.SoftwareCategory }),
    F("version", "Version", "text", "Identity", { placeholder: "e.g. 2022 / 8.0u2" }),
    F("status", "Status", "select", "Identity",
      { required: true, options: LOOKUPS.SoftwareStatus }),
    F("support_contact", "Support contact", "text", "Other",
      { placeholder: "e.g. reseller name / phone" }),
    F("eos_date", "End of support", "date", "Other"),
    F("owner", "Owner", "text", "Other", { placeholder: "e.g. IT Infrastructure" }),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("software_name", "Software", "mono"),
    C("publisher", "Publisher"),
    C("category", "Category"),
    C("version", "Version", "text", "110px"),
    C("license_count", "Licences", "text", "90px"),
    C("status", "Status", "badge", "110px"),
  ],
  search: ["software_name", "publisher", "category", "version", "owner"],
  chips: [K("all", "All"), K("active", "Active", "status = @p0", ["Active"]),
          K("retired", "Retired", "status = @p0", ["Retired"])],
};

const LICENSES = {
  key: "licenses", table: "dbo.licenses", label: "Licence",
  plural: "License control", idField: "license_id", idPrefix: "LIC", idWidth: 5,
  route: "/software/licenses", navGroup: "Software", navOrder: 2,
  titleField: "software_label",
  desc: "Entitlements per product — how many were bought, how many are in use, when cover ends and which paperwork proves it",
  fields: [
    F("software_id", "Software", "ref", "Licence",
      { required: true, ref: "software", help: "Pick the product this entitlement belongs to" }),
    F("license_type", "License type", "select", "Licence", {
      required: true, options: LOOKUPS.LicenseType,
      help: "Subscription needs an expiry date; perpetual does not",
    }),
    F("license_model", "License model", "select", "Licence",
      { required: true, options: LOOKUPS.LicenseModel, help: "What the count is measured in" }),
    F("license_edition", "Edition", "select", "Licence",
      { options: LOOKUPS.LicenseEdition }),
    F("status", "Status", "select", "Licence",
      { required: true, options: LOOKUPS.LicenseStatus }),
    F("license_quantity", "License quantity", "int", "Entitlement",
      { required: true, placeholder: "e.g. 100" }),
    F("used_quantity", "Used quantity", "int", "Entitlement",
      { placeholder: "e.g. 85", help: "Available is calculated — quantity minus used" }),
    F("license_key", "License key", "text", "Entitlement",
      { unique: true, placeholder: "XXXXX-XXXXX", help: "Leave blank if the key lives in a vault" }),
    F("agreement_no", "Agreement No.", "text", "Agreement",
      { placeholder: "e.g. AGR-2026-001" }),
    F("po_no", "PO No.", "text", "Agreement", { placeholder: "e.g. PO-2026-001" }),
    F("vendor", "Vendor", "text", "Agreement",
      { required: true, placeholder: "e.g. Microsoft" }),
    F("purchase_date", "Purchase date", "date", "Agreement"),
    F("start_date", "Start date", "date", "Term"),
    F("expiry_date", "Expiry date", "date", "Term"),
    F("auto_renewal", "Auto renewal", "select", "Term", { options: LOOKUPS.AutoRenewal }),
    F("renewal_period", "Renewal period", "select", "Term",
      { options: LOOKUPS.RenewalPeriod }),
    F("cost", "Cost", "money", "Cost", { placeholder: "e.g. 500000" }),
    F("currency", "Currency", "select", "Cost", { options: LOOKUPS.Currency }),
    F("cost_center", "Cost center", "text", "Cost", { placeholder: "e.g. IT-CC-1001" }),
    F("owner", "Owner", "text", "Other"),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("license_id", "License ID", "mono", "112px"),
    C("software_label", "Software", "text", "", "software_id"),
    C("license_type", "Type", "type", "116px"),
    C("license_model", "Model", "text", "96px"),
    C("seats", "Used / bought", "seats", "162px"),
    C("expiry_date", "Expiry", "expiry", "172px"),
    C("status", "Status", "badge", "110px"),
  ],
  search: ["license_id", "license_key", "agreement_no", "po_no", "vendor",
           "license_edition", "owner"],
  chips: LICENSE_CHIPS,
};

const AD_USERS = {
  key: "ad_users", table: "dbo.ad_users", label: "AD user", plural: "AD Users",
  idField: "ad_user_id", idPrefix: "AD", idWidth: 5, route: "/permission/ad-users",
  navGroup: "Permission Control", navOrder: 2, titleField: "display_name",
  noAdd: true,
  desc: "Accounts and group membership imported from Active Directory — the source of truth for who can be granted access",
  fields: [
    F("user_logon", "User logon", "text", "Account",
      { required: true, unique: true, placeholder: "e.g. somchai.p" }),
    F("display_name", "Display name", "text", "Account"),
    F("first_name", "Name", "text", "Account"),
    F("surname", "Surname", "text", "Account"),
    F("status", "Status", "select", "Account", { options: LOOKUPS.AdStatus }),
    F("job_title", "Job title", "text", "Organisation"),
    F("department", "Department", "text", "Organisation"),
    F("email", "Email", "text", "Organisation"),
    F("source_file", "Imported from", "text", "Import",
      { help: "Filled in by the AD import; edit by hand only to fix a mistake" }),
    F("imported_at", "Imported at", "text", "Import"),
    F("remarks", "Remarks", "textarea", "Import"),
  ],
  columns: [
    C("user_logon", "User", "mono", "170px"),
    C("display_name", "Display name"),
    C("department", "Department / title", "dept"),
    C("group_count", "Groups", "text", "90px"),
    C("email", "Email"),
    C("status", "Status", "badge", "110px"),
  ],
  search: ["user_logon", "display_name", "email", "department", "job_title"],
  chips: [K("all", "All"),
          K("enabled", "Enabled", "(status IS NULL OR status = @p0)", ["Enabled"]),
          K("disabled", "Disabled", "status = @p0", ["Disabled"], true),
          K("nogroup", "No AD group",
            "NOT EXISTS (SELECT 1 FROM dbo.ad_memberships m" +
            " WHERE m.user_logon = dbo.ad_users.user_logon)", [], true)],
};

const AD_MEMBERSHIPS = {
  key: "ad_memberships", table: "dbo.ad_memberships", label: "AD group membership",
  plural: "AD group membership", idField: "membership_id", idPrefix: "MEM",
  idWidth: 6, route: "/permission/ad-groups", hiddenInNav: true,
  titleField: "group_name",
  desc: "One row per user × AD group, exactly as the AD export delivers it",
  fields: [
    F("user_logon", "User logon", "text", "Membership", { required: true }),
    F("group_name", "AD group", "text", "Membership", { required: true }),
    F("source_file", "Imported from", "text", "Membership"),
  ],
  columns: [C("user_logon", "User", "mono", "180px"), C("group_name", "AD group")],
  search: ["user_logon", "group_name"],
  chips: [K("all", "All")],
};

const SERVER_PERMISSIONS = {
  key: "server_permissions", table: "dbo.server_permissions",
  label: "Server permission", plural: "Server Permission",
  idField: "permission_id", idPrefix: "PRM", idWidth: 5,
  route: "/permission/server", navGroup: "Permission Control", navOrder: 3,
  titleField: "folder_name",
  desc: "Shared folders on File Servers and the AD groups that hold read/write or read-only access — servers come from the Server list",
  fields: [
    F("server_id", "File Server", "ref", "Folder", {
      required: true, ref: "servers", refFilter: "server_role = 'File Server'",
      help: "Only servers marked Server role = File Server in the Server list",
    }),
    F("folder_name", "Folder name", "text", "Folder",
      { required: true, placeholder: "e.g. Production Control" }),
    F("folder_path", "Path", "text", "Folder",
      { placeholder: "e.g. \\\\FS-01\\Share\\Production" }),
    F("level", "Level", "text", "Folder", { placeholder: "e.g. Level 1" }),
    F("department", "Department", "text", "Folder"),
    F("rw_group", "AD group — Read/Write", "text", "Access",
      { placeholder: "e.g. PU Secret_Modify" }),
    F("ro_group", "AD group — Read only", "text", "Access",
      { placeholder: "e.g. PU Secret_Read Only" }),
    F("quota_gb", "Quota (GB)", "int", "Access", { placeholder: "e.g. 500" }),
    F("owner", "Folder owner", "text", "Other"),
    F("source_file", "Imported from", "text", "Other"),
    F("remarks", "Remarks", "textarea", "Other"),
  ],
  columns: [
    C("folder_name", "Folder / path", "folder", "", "folder_name"),
    C("server_id", "Server", "ref", "190px"),
    C("level", "Level", "text", "110px"),
    C("access_groups", "AD groups (RW / RO)", "groups", "", "rw_group"),
    C("department", "Department", "text", "150px"),
    C("quota_gb", "Quota", "gb", "100px"),
  ],
  search: ["folder_name", "folder_path", "rw_group", "ro_group", "department", "level"],
  chips: [K("all", "All"),
          K("rw", "Has Read/Write", "rw_group IS NOT NULL AND rw_group <> ''"),
          K("roonly", "Read-only only",
            "(rw_group IS NULL OR rw_group = '') AND ro_group IS NOT NULL AND ro_group <> ''"),
          K("nogroup", "No AD group",
            "(rw_group IS NULL OR rw_group = '') AND (ro_group IS NULL OR ro_group = '')",
            [], true),
          K("noquota", "No quota", "quota_gb IS NULL", [], true)],
};

const ENTITY_LIST = [HARDWARE, CLUSTERS, CLUSTER_NODES, SERVERS, NETWORK, VLANS,
                     SOFTWARE, LICENSES, AD_USERS, AD_MEMBERSHIPS,
                     SERVER_PERMISSIONS, LOCATIONS];
const ENTITIES = Object.fromEntries(ENTITY_LIST.map(e => [e.key, e]));

const NAV = [
  ["Overview", [["Dashboard", "/", "dashboard"]]],
  ["Server", [[HARDWARE.plural, HARDWARE.route, "hardware"],
              [CLUSTERS.plural, CLUSTERS.route, "clusters"],
              [SERVERS.plural, SERVERS.route, "servers"]]],
  ["Network", [[NETWORK.plural, NETWORK.route, "network_devices"],
               [VLANS.plural, VLANS.route, "vlans"]]],
  ["Software", [[SOFTWARE.plural, SOFTWARE.route, "software"],
                [LICENSES.plural, LICENSES.route, "licenses"]]],
  ["Permission Control", [["Permission dashboard", "/permission", "permission"],
                          ["Access check", "/permission/access-check", "permaccess"],
                          [AD_USERS.plural, AD_USERS.route, "ad_users"],
                          [SERVER_PERMISSIONS.plural, SERVER_PERMISSIONS.route,
                           "server_permissions"]]],
  ["Governance", [["Warranty & assets", "/governance/warranty", "warranty"],
                  ["Change history", "/governance/history", "history"],
                  ["Recycle bin", "/governance/recycle-bin", "recycle"]]],
  ["Reference", [[LOCATIONS.plural, LOCATIONS.route, "locations"]]],
  ["Administration", [["Users", "/admin/users", "users"]]],
];

const WARRANTY_ENTITIES = ["hardware", "network_devices"];
const ATTACHMENT_ENTITIES = ["licenses", "software"];

const AD_IMPORT_MAP = {
  userlogon: "user_logon", samaccountname: "user_logon", logon: "user_logon",
  displayname: "display_name", name: "first_name", givenname: "first_name",
  surname: "surname", sn: "surname",
  jobtitle: "job_title", title: "job_title", department: "department",
  emailaddress: "email", email: "email", mail: "email",
  status: "status", enabled: "status",
  groupname: "group_name", group: "group_name",
};

const PERM_IMPORT_MAP = {
  foldername: "folder_name", folder: "folder_name",
  path: "folder_path", folderpath: "folder_path", unc: "folder_path",
  servername: "server_name", server: "server_name",
  level: "level", department: "department",
  readwrite: "rw_group", rw: "rw_group", modify: "rw_group",
  readonly: "ro_group", ro: "ro_group", read: "ro_group",
  quotagb: "quota_gb", quota: "quota_gb", owner: "owner",
};

module.exports = {
  LOOKUPS, NETWORK_CATEGORIES, STACK_IDS, SQL_TYPES,
  ENTITIES, ENTITY_LIST, NAV, WARRANTY_ENTITIES, ATTACHMENT_ENTITIES,
  AD_IMPORT_MAP, PERM_IMPORT_MAP,
};
