import ExcelJS from "exceljs";

import type { TimesheetReport } from "@/lib/timesheets-report";
import { TIMESHEET_THEME } from "@/lib/timesheets-theme";

function colLetter(colIndex1Based: number): string {
  let n = colIndex1Based;
  let s = "";
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const thin = { style: "thin" as const, color: { argb: "FF000000" } };
  return { top: thin, left: thin, bottom: thin, right: thin };
}

export async function timesheetReportToWorkbookBuffer(report: TimesheetReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Timesheets", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 3 }],
  });

  const nDates = report.dateColumns.length;
  const totalCols = 1 + nDates * 2;
  const lastColLetter = colLetter(totalCols);

  sheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = report.periodLabel;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.getCell("A2").value = "";
  sheet.getCell("A3").value = "Employee";
  sheet.getCell("A3").font = { bold: true };
  sheet.getCell("A3").alignment = { horizontal: "left", vertical: "middle" };

  for (let i = 0; i < nDates; i++) {
    const startCol = 2 + i * 2;
    const c1 = colLetter(startCol);
    const c2 = colLetter(startCol + 1);
    sheet.mergeCells(`${c1}2:${c2}2`);
    const h = sheet.getCell(`${c1}2`);
    h.value = report.dateColumns[i].headerLabel;
    h.font = { bold: true };
    h.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getCell(`${c1}3`).value = "In";
    sheet.getCell(`${c2}3`).value = "Out";
    sheet.getCell(`${c1}3`).font = { bold: true };
    sheet.getCell(`${c2}3`).font = { bold: true };
    sheet.getCell(`${c1}3`).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getCell(`${c2}3`).alignment = { horizontal: "center", vertical: "middle" };
  }

  let rowIdx = 4;
  const applyCellStyle = (
    cell: ExcelJS.Cell,
    text: string | null,
    opts?: { fillArgb?: string; fontArgb?: string },
  ) => {
    cell.value = text ?? "";
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder();
    if (opts?.fillArgb) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: opts.fillArgb },
      };
    }
    if (opts?.fontArgb) {
      cell.font = { color: { argb: opts.fontArgb } };
    }
  };

  for (const row of report.rows) {
    const nameCell = sheet.getCell(rowIdx, 1);
    nameCell.value = row.name;
    nameCell.alignment = { horizontal: "left", vertical: "middle" };
    nameCell.border = thinBorder();

    for (let i = 0; i < nDates; i++) {
      const c = row.cells[i] ?? { kind: "empty" as const };
      const inCol = 2 + i * 2;
      const outCol = inCol + 1;

      if (c.kind === "leave") {
        sheet.mergeCells(`${colLetter(inCol)}${rowIdx}:${colLetter(outCol)}${rowIdx}`);
        const mc = sheet.getCell(rowIdx, inCol);
        applyCellStyle(mc, c.code, { fillArgb: TIMESHEET_THEME.leaveBlue.argb });
      } else if (c.kind === "work") {
        const inCell = sheet.getCell(rowIdx, inCol);
        const outCell = sheet.getCell(rowIdx, outCol);
        applyCellStyle(inCell, c.inTime, {
          fillArgb: c.inLate ? TIMESHEET_THEME.lateGreen.argb : undefined,
          fontArgb: c.inLate ? "FF111827" : undefined,
        });
        applyCellStyle(outCell, c.outTime);
      } else {
        applyCellStyle(sheet.getCell(rowIdx, inCol), null);
        applyCellStyle(sheet.getCell(rowIdx, outCol), null);
      }
    }
    rowIdx++;
  }

  const legendRow = rowIdx + 2;
  const legends: [string, string][] = [
    ["Late (In)", TIMESHEET_THEME.lateGreen.argb],
    ["Leave", TIMESHEET_THEME.leaveBlue.argb],
    ["Onsite", TIMESHEET_THEME.onsiteYellow.argb],
    ["Holiday", TIMESHEET_THEME.holidayOrange.argb],
  ];
  sheet.getCell(legendRow, 1).value = "Legend";
  sheet.getCell(legendRow, 1).font = { bold: true };

  legends.forEach(([label, argb], j) => {
    const r = legendRow + j + 1;
    const sample = sheet.getCell(r, 1);
    sample.value = "";
    sample.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    sample.border = thinBorder();
    sample.alignment = { horizontal: "center", vertical: "middle" };

    const txt = sheet.getCell(r, 2);
    txt.value = label;
    txt.alignment = { horizontal: "left", vertical: "middle" };
  });

  sheet.getColumn(1).width = 28;
  for (let c = 2; c <= totalCols; c++) {
    sheet.getColumn(c).width = 12;
  }

  sheet.getRow(1).height = 22;
  sheet.getRow(3).height = 18;

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
