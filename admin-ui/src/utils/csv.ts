/**
 * RFC 4180-compliant CSV encoder.
 * Handles commas, quotes, and newlines in field values.
 */

export interface CsvRow {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Escapes a single field value per RFC 4180:
 * - Fields containing commas, quotes, or newlines are wrapped in double quotes
 * - Double quotes inside a field are doubled (" → "")
 */
export function escapeCsvField(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects to a CSV string.
 * Uses the keys of the first row as headers.
 */
export function toCsv(rows: CsvRow[], headers?: string[]): string {
  if (rows.length === 0) return '';
  const keys = headers ?? Object.keys(rows[0]);
  const lines = [
    keys.join(','),
    ...rows.map((row) => keys.map((k) => escapeCsvField(row[k])).join(',')),
  ];
  return lines.join('\n');
}