import Papa from "papaparse";

export type SpreadsheetRow = Record<string, string>;

function normalizeHeader(h: string) {
  return String(h || "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function rowFromValues(headers: string[], values: unknown[]): SpreadsheetRow {
  const out: SpreadsheetRow = {};
  headers.forEach((h, i) => {
    if (!h) return;
    const v = values[i];
    out[h] = v == null ? "" : String(v).trim();
  });
  return out;
}

function isEmptyRow(row: SpreadsheetRow) {
  return Object.values(row).every((v) => !String(v ?? "").trim());
}

async function parseCsvFile(file: File): Promise<SpreadsheetRow[]> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });
  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    throw new Error(first?.message || "Could not read this CSV");
  }
  return (parsed.data || [])
    .map((raw) => {
      const out: SpreadsheetRow = {};
      for (const [k, v] of Object.entries(raw || {})) {
        const key = normalizeHeader(k);
        if (!key) continue;
        out[key] = v == null ? "" : String(v).trim();
      }
      return out;
    })
    .filter((row) => !isEmptyRow(row));
}

async function parseXlsxFile(file: File): Promise<SpreadsheetRow[]> {
  const ExcelJS = (await import("exceljs")).default;
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("This Excel file has no sheets");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = normalizeHeader(
      cell.text || (cell.value != null ? String(cell.value) : "")
    );
  });
  if (!headers.some(Boolean)) {
    throw new Error("The first row must have column names");
  }

  const rows: SpreadsheetRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const values: unknown[] = [];
    headers.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      values[i] = cell.text || (cell.value != null ? String(cell.value) : "");
    });
    const out = rowFromValues(headers, values);
    if (!isEmptyRow(out)) rows.push(out);
  });
  return rows;
}

/** Parse a CSV or Excel (.xlsx) spreadsheet into row objects. */
export async function parseSpreadsheetFile(file: File): Promise<SpreadsheetRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (name.endsWith(".xls") && !name.endsWith(".xlsx")) {
      throw new Error("Save as .xlsx or CSV. Old .xls is not supported.");
    }
    return parseXlsxFile(file);
  }
  if (name.endsWith(".csv") || name.endsWith(".txt") || file.type.includes("csv")) {
    return parseCsvFile(file);
  }
  // Fallback: try CSV text, then Excel
  try {
    return await parseCsvFile(file);
  } catch {
    return parseXlsxFile(file);
  }
}

export const SPREADSHEET_ACCEPT = ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
