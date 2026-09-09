// Bosh dashboard hisobotlarini (yillik statistika, supervayzerlar reytingi,
// ligalar bo'yicha top-3) ranglangan, chiroyli jadvalli Excel faylga (bir
// nechta varaq) eksport qiladi. Rang uchun ExcelJS ishlatiladi — `xlsx`
// (SheetJS community) hujayra ranglarini qo'llab-quvvatlamaydi.
import ExcelJS from "exceljs";
import { downloadBlob } from "@/lib/download-blob";
import { BRAND, BRAND_SOFT, WHITE, INK, BORDER, LEAGUE_COLOR, placeRowColor } from "@/lib/report-colors";

export type YillikSheetRow = { oy: string; plan: number; fakt: number };

export type ScoreboardSheetRow = {
  name: string;
  place: number;
  months: { month: string; percent: number; points: number }[];
  avgPercent: number;
  totalPoints: number;
};

export type LeagueTopSheetRow = {
  league: { key: string; name: string };
  rows: { place: number; fullName: string; supervisor: string; percent: number }[];
};

export type AgentSheetRow = {
  fullName: string;
  menejer: string;
  supervisor: string;
  league: string;
  place: number;
  percent: number;
  points: number;
  today: number;
  yesterday: number;
  trophies: number;
  yearsActive: number;
};

/** Bitta oy uchun agentlar ro'yxati — "Barcha agentlar" varag'i endi tanlangan yilning
 * barcha 12 oyini alohida bo'lim qilib ko'rsatadi (bitta oy suratlanmasi o'rniga). */
export type MonthlyAgentSheet = { month: string; rows: AgentSheetRow[] };

export type RankedSheetRow = {
  place: number;
  fullName: string;
  percent: number;
  yesterday: number;
  monthPoints: number;
};

const thinBorder = { style: "thin" as const, color: { argb: `FF${BORDER}` } };
const allBorders = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

function styleHeaderRow(row: ExcelJS.Row, fillHex: string = BRAND) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${fillHex}` } };
    cell.font = { bold: true, color: { argb: `FF${WHITE}` } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = allBorders;
  });
  row.height = 22;
}

function fillCell(cell: ExcelJS.Cell, hex: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${hex}` } };
}

function addYillikSheet(wb: ExcelJS.Workbook, rows: YillikSheetRow[]) {
  const ws = wb.addWorksheet("Yillik statistika");
  ws.columns = [
    { header: "Oy", key: "oy", width: 14 },
    { header: "Plan", key: "plan", width: 14 },
    { header: "Fakt", key: "fakt", width: 14 },
    { header: "Bajarilish %", key: "bajarilish", width: 16 },
  ];
  rows.forEach((r) => {
    ws.addRow({
      oy: r.oy,
      plan: r.plan,
      fakt: r.fakt,
      bajarilish: r.plan === 0 ? 0 : Math.round((r.fakt / r.plan) * 1000) / 10,
    });
  });
  styleHeaderRow(ws.getRow(1));
  ws.eachRow((row, i) => {
    if (i === 1) return;
    row.eachCell((cell) => {
      cell.border = allBorders;
      cell.alignment = { horizontal: "center" };
    });
    if (i % 2 === 0) row.eachCell((cell) => fillCell(cell, "F5F8FC"));
  });
}

function addScoreboardSheet(wb: ExcelJS.Workbook, rows: ScoreboardSheetRow[]) {
  const ws = wb.addWorksheet("Supervayzerlar reytingi");
  const months = rows[0]?.months.map((m) => m.month) ?? [];
  const columns: Partial<ExcelJS.Column>[] = [
    { header: "O'rin", key: "place", width: 8 },
    { header: "Supervayzer", key: "name", width: 24 },
  ];
  months.forEach((m, i) => {
    columns.push({ header: `${m} — %`, key: `m${i}p`, width: 12 });
    columns.push({ header: `${m} — ball`, key: `m${i}b`, width: 10 });
  });
  columns.push({ header: "O'rtacha %", key: "avg", width: 12 });
  columns.push({ header: "Jami ball", key: "total", width: 12 });
  ws.columns = columns;

  rows.forEach((r) => {
    const data: Record<string, string | number> = { place: r.place, name: r.name };
    r.months.forEach((m, i) => {
      data[`m${i}p`] = m.percent;
      data[`m${i}b`] = m.points;
    });
    data["avg"] = r.avgPercent;
    data["total"] = r.totalPoints;
    ws.addRow(data);
  });

  styleHeaderRow(ws.getRow(1));
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const place = rows[i - 2]?.place ?? 0;
    row.eachCell((cell) => {
      cell.border = allBorders;
      cell.alignment = { horizontal: "center" };
    });
    const tint = placeRowColor(place);
    if (tint) row.eachCell((cell) => fillCell(cell, tint));
    else if (i % 2 === 0) row.eachCell((cell) => fillCell(cell, "F5F8FC"));
    row.getCell("name").alignment = { horizontal: "left" };
    row.getCell("place").font = { bold: place <= 3 };
  });
}

function addLeagueTopSheet(wb: ExcelJS.Workbook, tops: LeagueTopSheetRow[]) {
  const ws = wb.addWorksheet("Ligalar top-3");
  ws.columns = [
    { header: "Liga", key: "liga", width: 14 },
    { header: "O'rin", key: "place", width: 8 },
    { header: "F.I.Sh.", key: "fullName", width: 26 },
    { header: "Supervayzer", key: "supervisor", width: 22 },
    { header: "Bajarilish %", key: "percent", width: 14 },
  ];
  styleHeaderRow(ws.getRow(1));

  let rowIndex = 1;
  tops.forEach((t) => {
    t.rows.forEach((r) => {
      rowIndex += 1;
      const row = ws.addRow({
        liga: t.league.name,
        place: r.place,
        fullName: r.fullName,
        supervisor: r.supervisor,
        percent: r.percent,
      });
      row.eachCell((cell) => {
        cell.border = allBorders;
        cell.alignment = { horizontal: "center" };
      });
      row.getCell("fullName").alignment = { horizontal: "left" };
      row.getCell("supervisor").alignment = { horizontal: "left" };
      const legueHex = LEAGUE_COLOR[t.league.key.toLowerCase()] ?? BRAND_SOFT;
      const ligaCell = row.getCell("liga");
      fillCell(ligaCell, legueHex);
      ligaCell.font = { bold: true, color: { argb: `FF${INK}` } };
      const tint = placeRowColor(r.place);
      if (tint) {
        ["place", "fullName", "supervisor", "percent"].forEach((key) => fillCell(row.getCell(key), tint));
      }
    });
  });
}

const AGENT_HEADERS = [
  "Liga",
  "O'rin",
  "F.I.Sh.",
  "Menejer",
  "Supervayzer",
  "Bajarilish %",
  "Ball",
  "Bugun",
  "Kecha",
  "Kubok",
  "Ish staji (yil)",
];
const AGENT_COL_COUNT = AGENT_HEADERS.length;

function addAgentsSheet(wb: ExcelJS.Workbook, monthly: MonthlyAgentSheet[]) {
  const ws = wb.addWorksheet("Barcha agentlar");
  ws.columns = [12, 8, 26, 22, 22, 14, 10, 10, 10, 10, 14].map((width) => ({ width }));

  monthly.forEach((block) => {
    const titleRow = ws.addRow([block.month]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, AGENT_COL_COUNT);
    titleRow.height = 24;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { bold: true, size: 12, color: { argb: `FF${WHITE}` } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${INK}` } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    titleCell.border = allBorders;

    styleHeaderRow(ws.addRow(AGENT_HEADERS));

    if (block.rows.length === 0) {
      const emptyRow = ws.addRow(["Ma'lumot yo'q"]);
      ws.mergeCells(emptyRow.number, 1, emptyRow.number, AGENT_COL_COUNT);
      emptyRow.getCell(1).alignment = { horizontal: "center" };
      emptyRow.getCell(1).font = { italic: true, color: { argb: `FF${INK}` } };
      emptyRow.getCell(1).border = allBorders;
    } else {
      block.rows.forEach((r, i) => {
        const row = ws.addRow([
          r.league.toUpperCase(),
          r.place,
          r.fullName,
          r.menejer,
          r.supervisor,
          r.percent,
          r.points,
          r.today,
          r.yesterday,
          r.trophies,
          r.yearsActive,
        ]);
        row.eachCell((cell) => {
          cell.border = allBorders;
          cell.alignment = { horizontal: "center" };
        });
        row.getCell(3).alignment = { horizontal: "left" };
        row.getCell(4).alignment = { horizontal: "left" };
        row.getCell(5).alignment = { horizontal: "left" };
        const legueHex = LEAGUE_COLOR[r.league.toLowerCase()] ?? BRAND_SOFT;
        const leagueCell = row.getCell(1);
        fillCell(leagueCell, legueHex);
        leagueCell.font = { bold: true, color: { argb: `FF${INK}` } };
        const tint = placeRowColor(r.place);
        const otherCols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (tint) {
          otherCols.forEach((c) => fillCell(row.getCell(c), tint));
        } else if (i % 2 === 0) {
          otherCols.forEach((c) => fillCell(row.getCell(c), "F5F8FC"));
        }
      });
    }

    ws.addRow([]);
  });
}

function addMenejerSheet(wb: ExcelJS.Workbook, rows: RankedSheetRow[]) {
  const ws = wb.addWorksheet("Menejerlar reytingi");
  ws.columns = [
    { header: "O'rin", key: "place", width: 8 },
    { header: "F.I.Sh.", key: "fullName", width: 26 },
    { header: "Bajarilish %", key: "percent", width: 14 },
    { header: "Kecha (o'rin)", key: "yesterday", width: 14 },
    { header: "Oylik ball", key: "monthPoints", width: 12 },
  ];
  rows.forEach((r) => ws.addRow(r));
  styleHeaderRow(ws.getRow(1));
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const place = rows[i - 2]?.place ?? 0;
    row.eachCell((cell) => {
      cell.border = allBorders;
      cell.alignment = { horizontal: "center" };
    });
    row.getCell("fullName").alignment = { horizontal: "left" };
    const tint = placeRowColor(place);
    if (tint) row.eachCell((cell) => fillCell(cell, tint));
    else if (i % 2 === 0) row.eachCell((cell) => fillCell(cell, "F5F8FC"));
  });
}

export async function exportDashboardToExcel(input: {
  fileName: string;
  yillik: YillikSheetRow[];
  scoreboard: ScoreboardSheetRow[];
  tops: LeagueTopSheetRow[];
  monthlyAgents: MonthlyAgentSheet[];
  menejerlar: RankedSheetRow[];
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MICCO";
  wb.created = new Date();
  addYillikSheet(wb, input.yillik);
  addMenejerSheet(wb, input.menejerlar);
  addScoreboardSheet(wb, input.scoreboard);
  addLeagueTopSheet(wb, input.tops);
  addAgentsSheet(wb, input.monthlyAgents);
  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    input.fileName,
  );
}
