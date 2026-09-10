/**
 * โหลดผังอาคารจริง (Site / Factory / Floor) เข้าตาราง dbo.locations
 * ให้ dropdown แบบ cascade ในหน้า Locations & areas มีข้อมูลให้เลือกทันที —
 * เพิ่ม Area เองทีหลังผ่านหน้าเว็บ (เป็น free text ต่อจาก Floor)
 *
 *   node load-locations.js
 *
 * รันซ้ำได้อย่างปลอดภัย — แถวที่มีอยู่แล้ว (ชื่อ + ชั้นบน เดียวกัน) จะถูกข้าม
 * แก้ผังอาคารได้โดยตรงที่ตัวแปร DATA ด้านล่าง
 */

const db = require("./db");
const { ENTITIES } = require("./entities");

const DATA = {
  "1st Site": {
    "Main Office": ["Floor 1", "Floor 2"],
    "HDC": ["Floor 1", "Floor 2", "Floor 3", "Floor 4"],
    "Factory 1": ["Floor 1", "Floor 2"],
    "Factory 2": ["Floor 1", "Floor 2"],
    "Canteen 1": ["Floor 1"],
    "Canteen 2": ["Floor 1"],
    "Guard House 1": ["Floor 1"],
    "Guard House 2": ["Floor 1"],
    "Shop Factory": ["Floor 1"],
    "Multi Purpose": ["Floor 1", "Floor 2"],
    "Anechoic 1": ["Floor 1"],
    "Anechoic 2": ["Floor 1"],
    "Anechoic 3": ["Floor 1"],
  },
  "2nd Site": {
    "Canteen 1": ["Floor 1", "Floor 2"],
    "Canteen 2": ["Floor 1", "Floor 2"],
    "Shop Factory": ["Floor 1"],
    "Shop Forklift": ["Floor 1"],
    "Shop Recycle": ["Floor 1"],
    "Guard House 2": ["Floor 1"],
    "Guard House 3": ["Floor 1"],
    "Warehouse 3": ["Floor 1"],
    "Factory 3": ["Floor 1", "Floor 2"],
  },
};

const ACTOR = { user_id: "USR-001", username: "load-locations", role: "admin",
                display_name: "Location loader" };

async function main() {
  const ent = ENTITIES.locations;
  const existing = await db.query(
    `SELECT location_id, level, name, parent_id FROM ${ent.table} WHERE is_deleted = 0`);
  const byKey = new Map(existing.map(r =>
    [r.level + "||" + r.name + "||" + (r.parent_id || ""), r.location_id]));
  const before = byKey.size;

  const findOrCreate = async (level, name, parentId) => {
    const key = level + "||" + name + "||" + (parentId || "");
    if (byKey.has(key)) return byKey.get(key);
    const id = await db.insertRecord(ent, { level, name, parent_id: parentId || null }, ACTOR);
    byKey.set(key, id);
    return id;
  };

  for (const [siteName, factories] of Object.entries(DATA)) {
    const siteId = await findOrCreate("Site", siteName, null);
    for (const [factoryName, floors] of Object.entries(factories)) {
      const factoryId = await findOrCreate("Factory", factoryName, siteId);
      for (const floorName of floors) await findOrCreate("Floor", floorName, factoryId);
    }
  }

  console.log(`[load-locations] +${byKey.size - before} new location(s) — ${byKey.size} total`);
}

main().then(() => process.exit(0)).catch(err => {
  console.error("\n[load-locations] failed:", err.message);
  process.exit(1);
});
