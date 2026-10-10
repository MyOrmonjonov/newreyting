// "Ommaviy/tarixiy natija kiritish" oynasi uchun Excel shablon eksport/import —
// operator ekrandagi jadvalni to'ldirish o'rniga, shablonni yuklab olib, Excel'da
// to'ldirib, qayta yuklab, saqlashdan oldin ko'rib chiqishi mumkin.
import ExcelJS from "exceljs";
import { downloadBlob } from "@/lib/download-blob";
import { BRAND, WHITE, BORDER } from "@/lib/report-colors";

export type BulkNatijaDraft = Record<string, { plan: number; bajarildi: number }>;

type AgentRef = { id: number; fullName: string };
type MahsulotRef = { id: number; nomi: string };

const ID_HEADER = "ID";
const NAME_HEADER = "F.I.Sh.";
const DATA_START_ROW = 3;
const FIXED_COL_COUNT = 2;

export async function exportBulkNatijaTemplate(input: {
  oy: string;
  agents: AgentRef[];
  mahsulotlar: MahsulotRef[];
  draft: BulkNatijaDraft;
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MICCO";
  wb.created = new Date();
  const ws = wb.addWorksheet("Natija");

  const colCount = FIXED_COL_COUNT + input.mahsulotlar.length * 2;
  ws.columns = [
    { width: 8 },
    { width: 26 },
    // "— Bajarildi" header (uzunrog'i) to'liq sig'ishi uchun ustun kengligi
    // mahsulot nomi uzunligiga qarab moslashadi (qisqa/uzun nomlar bir xilda
    // siqilib/cho'zilib qolmasligi uchun).
    ...input.mahsulotlar.flatMap((m) => {
      const w = Math.min(22, Math.max(13, m.nomi.length + 9));
      return [{ width: w }, { width: w }];
    }),
  ];

  const noteRow = ws.addRow([
    `${input.oy.slice(0, 7)} oyi uchun natija shablon — "${ID_HEADER}" va "${NAME_HEADER}" ustunlarini o'zgartirmang, faqat Plan/Bajarildi qiymatlarini to'ldiring, so'ng saytga qayta yuklang.`,
  ]);
  ws.mergeCells(noteRow.number, 1, noteRow.number, colCount);
  noteRow.height = 20;
  const noteCell = noteRow.getCell(1);
  noteCell.font = { italic: true, size: 10, color: { argb: `FF${BORDER}` } };
  noteCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

  const headerCells = [ID_HEADER, NAME_HEADER];
  for (const m of input.mahsulotlar) {
    headerCells.push(`${m.nomi} — Plan`, `${m.nomi} — Bajarildi`);
  }
  const headerRow = ws.addRow(headerCells);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND}` } };
    cell.font = { bold: true, color: { argb: `FF${WHITE}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  headerRow.height = 42;

  input.agents.forEach((a, i) => {
    const cells: (string | number)[] = [a.id, a.fullName];
    for (const m of input.mahsulotlar) {
      const v = input.draft[`${a.id}-${m.id}`] ?? { plan: 0, bajarildi: 0 };
      cells.push(v.plan, v.bajarildi);
    }
    const row = ws.addRow(cells);
    row.eachCell((cell) => {
      cell.alignment = { horizontal: "center" };
    });
    row.getCell(2).alignment = { horizontal: "left" };
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FC" } };
      });
    }
  });

  ws.views = [{ state: "frozen", xSplit: FIXED_COL_COUNT, ySplit: DATA_START_ROW - 1 }];

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `micco-natija-shablon-${input.oy.slice(0, 7)}.xlsx`,
  );
}

/** Oldin eksport qilingan shablonni o'qib, draft qaytaradi. Ustunlar soni
 * joriy mahsulotlar ro'yxatiga mos kelmasa (masalan orada mahsulot
 * qo'shilgan/o'chirilgan bo'lsa) `null` qaytaradi — chaqiruvchi xato ko'rsatishi kerak. */
export async function importBulkNatijaExcel(
  file: File,
  mahsulotlar: MahsulotRef[],
): Promise<BulkNatijaDraft | null> {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return null;

  const headerRow = ws.getRow(2);
  const expectedCols = FIXED_COL_COUNT + mahsulotlar.length * 2;
  if (
    String(headerRow.getCell(1).value ?? "").trim() !== ID_HEADER ||
    headerRow.actualCellCount < expectedCols
  ) {
    return null;
  }

  const draft: BulkNatijaDraft = {};
  for (let r = DATA_START_ROW; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const agentId = Number(row.getCell(1).value);
    if (!agentId || Number.isNaN(agentId)) continue;
    mahsulotlar.forEach((m, i) => {
      const planCol = FIXED_COL_COUNT + 1 + i * 2;
      const bajarildiCol = planCol + 1;
      const plan = Number(row.getCell(planCol).value) || 0;
      const bajarildi = Number(row.getCell(bajarildiCol).value) || 0;
      draft[`${agentId}-${m.id}`] = { plan, bajarildi };
    });
  }
  return draft;
}
