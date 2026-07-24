export const MAX_LAB_CSV_BYTES = 1024 * 1024;

export function sanitizeLabImportFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() ?? "";
  const sanitized = baseName
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 255);

  return sanitized || "lab-results.csv";
}
