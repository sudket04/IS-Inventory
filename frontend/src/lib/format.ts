// วันที่ทั้งหมดในระบบแสดงผลแบบ dd/mm/yyyy (NFR-10 ส่วนหนึ่ง) — ใช้ฟังก์ชันเหล่านี้แทนการเรียก toLocaleString/toLocaleDateString ตรงๆ
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(value)} ${hh}:${min}`;
}
