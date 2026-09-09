// Bosh dashboard hisobotlarini ranglangan jadvalli Word (.docx) faylga eksport
// qiladi — export-excel.ts bilan bir xil ma'lumot, lekin Word hujjati sifatida.
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  ShadingType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
} from "docx";
import { downloadBlob } from "@/lib/download-blob";
import { BRAND, GOLD_SOFT, SILVER_SOFT, BRONZE_SOFT, WHITE, INK, BORDER, LEAGUE_COLOR } from "@/lib/report-colors";
import type {
  YillikSheetRow,
  ScoreboardSheetRow,
  LeagueTopSheetRow,
  AgentSheetRow,
  MonthlyAgentSheet,
  RankedSheetRow,
} from "@/lib/export-excel";

const cellBorder = { style: BorderStyle.SINGLE, size: 2, color: BORDER };
const tableBorders = {
  top: cellBorder,
  bottom: cellBorder,
  left: cellBorder,
  right: cellBorder,
  insideHorizontal: cellBorder,
  insideVertical: cellBorder,
};

// A4 landscape (twips) minus 720twip (0.5") margins har tarafdan — Word bu qiymatlarni
// bermasa har ustunga standart 100twip beradi: kompyuterda avtomatik kengayadi, lekin
// telefondagi ko'p Word/ko'ruvchilarda so'zma-so'z olinib, jadval chap chetga siqilib qoladi.
// Shuning uchun har jadvalga aniq (twips) ustun kengligi beriladi — ikkalasida ham bir xil.
const PAGE_MARGIN = 720;
const CONTENT_WIDTH = 16838 - PAGE_MARGIN * 2;

function colWidths(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((w / sum) * CONTENT_WIDTH));
}

function placeSoftFill(place: number): string | undefined {
  if (place === 1) return GOLD_SOFT;
  if (place === 2) return SILVER_SOFT;
  if (place === 3) return BRONZE_SOFT;
  return undefined;
}

function cell(
  text: string,
  opts: { bold?: boolean | undefined; fill?: string | undefined; color?: string | undefined; width?: number | undefined } = {},
): TableCell {
  return new TableCell({
    ...(opts.fill ? { shading: { fill: opts.fill, type: ShadingType.CLEAR, color: "auto" } } : {}),
    ...(opts.width !== undefined ? { width: { size: opts.width, type: WidthType.DXA } } : {}),
    verticalAlign: "center",
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            ...(opts.bold !== undefined ? { bold: opts.bold } : {}),
            ...(opts.color !== undefined ? { color: opts.color } : {}),
          }),
        ],
      }),
    ],
  });
}

function headerRow(labels: string[], widths: number[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) => cell(l, { bold: true, fill: BRAND, color: WHITE, width: widths[i] })),
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 160 }, children: [new TextRun(text)] });
}

function yillikTable(rows: YillikSheetRow[]): Table {
  const widths = colWidths([1, 1, 1, 1]);
  const body = rows.map((r) => {
    const pct = r.plan === 0 ? 0 : Math.round((r.fakt / r.plan) * 1000) / 10;
    return new TableRow({
      children: [
        cell(r.oy, { width: widths[0] }),
        cell(String(r.plan), { width: widths[1] }),
        cell(String(r.fakt), { width: widths[2] }),
        cell(`${pct}%`, { width: widths[3] }),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders: tableBorders,
    rows: [headerRow(["Oy", "Plan", "Fakt", "Bajarilish %"], widths), ...body],
  });
}

function scoreboardTable(rows: ScoreboardSheetRow[]): Table {
  const months = rows[0]?.months.map((m) => m.month) ?? [];
  const labels = ["O'rin", "Supervayzer"];
  months.forEach((m) => labels.push(`${m} — %`, `${m} — ball`));
  labels.push("O'rtacha %", "Jami ball");
  const weights = [0.6, 2.2, ...months.flatMap(() => [1, 1]), 1, 1];
  const widths = colWidths(weights);

  const body = rows.map((r) => {
    const fill = placeSoftFill(r.place);
    const values = [
      r.place.toString(),
      r.name,
      ...r.months.flatMap((m) => [`${m.percent}%`, String(m.points)]),
      `${r.avgPercent}%`,
      String(r.totalPoints),
    ];
    const boldCols = new Set([0, 1, values.length - 1]);
    return new TableRow({
      children: values.map((text, i) => cell(text, { bold: boldCols.has(i), fill, width: widths[i] })),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders: tableBorders,
    rows: [headerRow(labels, widths), ...body],
  });
}

function leagueTable(top: LeagueTopSheetRow): Table {
  const leagueHex = LEAGUE_COLOR[top.league.key.toLowerCase()] ?? BRAND;
  const widths = colWidths([0.6, 2, 1.6, 1]);
  const rows = top.rows.map((r) => {
    const fill = placeSoftFill(r.place);
    return new TableRow({
      children: [
        cell(String(r.place), { bold: true, fill, width: widths[0] }),
        cell(r.fullName, { fill, width: widths[1] }),
        cell(r.supervisor, { fill, width: widths[2] }),
        cell(`${r.percent}%`, { fill, width: widths[3] }),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders: tableBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: ["O'rin", "F.I.Sh.", "Supervayzer", "Bajarilish %"].map((l, i) =>
          cell(l, { bold: true, fill: leagueHex, color: INK, width: widths[i] }),
        ),
      }),
      ...rows,
    ],
  });
}

function menejerTable(rows: RankedSheetRow[]): Table {
  const widths = colWidths([0.6, 2, 1, 1, 1]);
  const body = rows.map((r) => {
    const fill = placeSoftFill(r.place);
    return new TableRow({
      children: [
        cell(String(r.place), { bold: true, fill, width: widths[0] }),
        cell(r.fullName, { fill, width: widths[1] }),
        cell(`${r.percent}%`, { fill, width: widths[2] }),
        cell(String(r.yesterday), { fill, width: widths[3] }),
        cell(String(r.monthPoints), { bold: true, fill, width: widths[4] }),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders: tableBorders,
    rows: [headerRow(["O'rin", "F.I.Sh.", "Bajarilish %", "Kecha (o'rin)", "Oylik ball"], widths), ...body],
  });
}

function agentsTable(rows: AgentSheetRow[]): Table {
  const widths = colWidths([0.8, 0.6, 1.9, 1.4, 1.4, 1, 0.8, 0.8, 0.8, 0.8, 0.8]);
  const body = rows.map((r) => {
    const fill = placeSoftFill(r.place);
    const leagueHex = LEAGUE_COLOR[r.league.toLowerCase()] ?? BRAND;
    return new TableRow({
      children: [
        cell(r.league.toUpperCase(), { bold: true, fill: leagueHex, color: INK, width: widths[0] }),
        cell(String(r.place), { bold: true, fill, width: widths[1] }),
        cell(r.fullName, { fill, width: widths[2] }),
        cell(r.menejer, { fill, width: widths[3] }),
        cell(r.supervisor, { fill, width: widths[4] }),
        cell(`${r.percent}%`, { fill, width: widths[5] }),
        cell(String(r.points), { fill, width: widths[6] }),
        cell(String(r.today), { fill, width: widths[7] }),
        cell(String(r.yesterday), { fill, width: widths[8] }),
        cell(String(r.trophies), { fill, width: widths[9] }),
        cell(String(r.yearsActive), { fill, width: widths[10] }),
      ],
    });
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders: tableBorders,
    rows: [
      headerRow(
        ["Liga", "O'rin", "F.I.Sh.", "Menejer", "Supervayzer", "Bajarilish %", "Ball", "Bugun", "Kecha", "Kubok", "Ish staji"],
        widths,
      ),
      ...body,
    ],
  });
}

export async function exportDashboardToWord(input: {
  fileName: string;
  oyLabel: string;
  yillik: YillikSheetRow[];
  scoreboard: ScoreboardSheetRow[];
  tops: LeagueTopSheetRow[];
  monthlyAgents: MonthlyAgentSheet[];
  menejerlar: RankedSheetRow[];
}) {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: "MICCO — Hisobot", bold: true })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: `Davr: ${input.oyLabel}`, italics: true })],
    }),
    heading("Yillik statistika — 12 oy"),
    yillikTable(input.yillik),
    heading("Menejerlar reytingi"),
    menejerTable(input.menejerlar),
    heading("Supervayzerlar reytingi — oylik ball"),
    scoreboardTable(input.scoreboard),
    heading("Ligalar bo'yicha top-3"),
  ];

  input.tops.forEach((t) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: t.league.name, bold: true })],
      }),
    );
    children.push(leagueTable(t));
  });

  children.push(heading("Barcha agentlar — 12 oy"));
  input.monthlyAgents.forEach((block) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: block.month, bold: true })],
      }),
    );
    if (block.rows.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Ma'lumot yo'q", italics: true })] }));
    } else {
      children.push(agentsTable(block.rows));
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN },
          },
        },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, input.fileName);
}
