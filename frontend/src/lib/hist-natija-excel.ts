// Jamoa sahifasidagi "Tarixiy ball/foiz kiritish" modali uchun Excel eksport/import —
// supervayzer/menejerlarning ID'si bilan birga chiqariladi, shu ID orqali qaytib import
// qilinganda to'g'ri qatorga mos tushadi (ism/familiya faqat o'qish uchun, import'da e'tiborga olinmaydi).
import ExcelJS from "exceljs";
import { downloadBlob } from "@/lib/download-blob";

export type HistNatijaExcelRow = { id: number; ism: string; familiya: string; percent: number; ball: number };

export async function exportHistNatijaExcel(input: { tabLabel: string; oy: string; rows: HistNatijaExcelRow[] }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MICCO";
  wb.created = new Date();
  const ws = wb.addWorksheet(input.tabLabel.slice(0, 31));
  ws.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Ism", key: "ism", width: 20 },
    { header: "Familiya", key: "familiya", width: 20 },
    { header: "Foiz (%)", key: "percent", width: 12 },
    { header: "Ball", key: "ball", width: 10 },
  ];
  input.rows.forEach((r) => ws.addRow(r));
  const header = ws.getRow(1);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E9F0" } };
  });
  ws.getColumn("id").protection = { locked: true };

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${input.tabLabel}-${input.oy}.xlsx`,
  );
}

export async function importHistNatijaExcel(file: File): Promise<{ id: number; percent: number; ball: number }[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const result: { id: number; percent: number; ball: number }[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // sarlavha qatori
    const id = Number(row.getCell(1).value);
    if (!Number.isFinite(id) || id <= 0) return;
    const percentRaw = Number(row.getCell(4).value);
    const ballRaw = Number(row.getCell(5).value);
    result.push({
      id,
      percent: Number.isFinite(percentRaw) ? percentRaw : 0,
      ball: Number.isFinite(ballRaw) ? ballRaw : 0,
    });
  });
  return result;
}
