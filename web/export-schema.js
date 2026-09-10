/**
 * สร้างไฟล์ schema.sql (T-SQL) จาก entities.js เพื่อนำไปรันใน SSMS เอง
 * กรณีที่ DBA ไม่อนุญาตให้แอปสร้างตาราง (ไม่ต้องให้สิทธิ์ db_ddladmin)
 *
 *   node export-schema.js            -> schema.sql
 *   node export-schema.js out.sql    -> out.sql
 *
 * ไม่ต้องต่อฐานข้อมูล — แค่ generate ข้อความ SQL ออกมา
 */

const fs = require("fs");
const db = require("./db");
const { ENTITY_LIST } = require("./entities");

const out = process.argv[2] || "schema.sql";
const parts = [
  "-- IT Infrastructure Inventory — schema สำหรับ SQL Server 2016+",
  "-- generate จาก entities.js ด้วย: node export-schema.js",
  "-- รันในฐานข้อมูลเปล่าที่สร้างไว้แล้ว เช่น: CREATE DATABASE ITInventory;",
  "-- ทุกคำสั่งเป็น IF NOT EXISTS จึงรันซ้ำได้อย่างปลอดภัย",
  "", "SET ANSI_NULLS ON;", "SET QUOTED_IDENTIFIER ON;", "GO", "",
  "-- ===== ตารางระบบ (ผู้ใช้ ประวัติ audit ตั้งค่า) =====",
];
db.SYSTEM_TABLES.forEach(s => parts.push(s.trim(), "GO", ""));

parts.push("-- ===== ตารางข้อมูล (generate จาก ENTITIES) =====");
ENTITY_LIST.forEach(ent => {
  parts.push(`-- ${ent.plural} (${ent.key})`, db.entityDdl(ent).trim(), "GO", "");
});

parts.push(
  "-- ===== บัญชีผู้ดูแลคนแรก =====",
  "-- password hash สร้างด้วย PBKDF2 ใน Node จึงต้องรันคำสั่งนี้แทน:",
  "--   npm run init-db",
  "-- (จะข้ามตารางที่มีอยู่แล้ว และสร้างเฉพาะ admin/admin123 ถ้ายังไม่มีผู้ใช้)", "");

fs.writeFileSync(out, parts.join("\n"), "utf8");
console.log(`เขียน ${out} แล้ว — ${ENTITY_LIST.length + 4} ตาราง`);
console.log("นำไปรันใน SSMS จากนั้น npm run init-db เพื่อสร้างบัญชี admin");
process.exit(0);
