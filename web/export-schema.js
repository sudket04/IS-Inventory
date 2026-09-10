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

const dbName = process.env.MSSQL_DATABASE || "ITInventory";
const dbUser = process.env.MSSQL_USER || "inventory_app";
const dbPass = process.env.MSSQL_PASSWORD || "ChangeMe#2026";
const trusted = process.env.MSSQL_TRUSTED === "1";

const out = process.argv[2] || "schema.sql";
const parts = [
  "-- IT Infrastructure Inventory — schema สำหรับ SQL Server 2016+",
  "-- generate จาก entities.js ด้วย: node export-schema.js",
  "-- (อ่านชื่อ database/login จาก .env ถ้ามี ไม่งั้นใช้ค่าเริ่มต้น)",
  "-- ทุกคำสั่งเป็น IF NOT EXISTS จึงรันซ้ำได้อย่างปลอดภัย — รันทั้งไฟล์นี้ใน SSMS ได้เลย",
  "", "-- ===== Database =====",
  `IF DB_ID(N'${dbName}') IS NULL`,
  `  CREATE DATABASE [${dbName}];`, "GO", "",
  `USE [${dbName}];`, "GO", "",
];
if (trusted) {
  parts.push(
    "-- MSSQL_TRUSTED=1 — แอปใช้ Windows Authentication (NTLM) ไม่ใช้ SQL login",
    `-- ให้ DBA เพิ่มสิทธิ์บัญชี AD ที่แอปรันด้วยเอง เช่น:`,
    `--   CREATE USER [DOMAIN\\${dbUser}] FOR LOGIN [DOMAIN\\${dbUser}];`,
    `--   ALTER ROLE db_datareader ADD MEMBER [DOMAIN\\${dbUser}];`,
    `--   ALTER ROLE db_datawriter ADD MEMBER [DOMAIN\\${dbUser}];`,
    `--   ALTER ROLE db_ddladmin   ADD MEMBER [DOMAIN\\${dbUser}]; -- ถอดออกได้หลังสร้าง schema`,
    "");
} else {
  parts.push(
    "-- ===== Application login =====",
    `IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'${dbUser}')`,
    `  CREATE LOGIN [${dbUser}] WITH PASSWORD = N'${dbPass.replace(/'/g, "''")}';`, "GO",
    `IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'${dbUser}')`,
    `  CREATE USER [${dbUser}] FOR LOGIN [${dbUser}];`, "GO",
    `ALTER ROLE db_datareader ADD MEMBER [${dbUser}];`,
    `ALTER ROLE db_datawriter ADD MEMBER [${dbUser}];`,
    `ALTER ROLE db_ddladmin   ADD MEMBER [${dbUser}]; -- ถอดออกได้หลังสร้าง schema`,
    "GO", "");
}
parts.push("SET ANSI_NULLS ON;", "SET QUOTED_IDENTIFIER ON;", "GO", "",
  "-- ===== ตารางระบบ (ผู้ใช้ ประวัติ audit ตั้งค่า) =====");
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
