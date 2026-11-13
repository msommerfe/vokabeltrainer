import { importFromCsv } from '../import/csv';
import { importFromJson } from '../import/json';
import { ImportError, type ImportOutcome } from '../import/validate';

/** Leitet den Listennamen aus dem Dateinamen ab. */
export function nameFromFile(fileName: string): string {
  const withoutExtension = fileName.replace(/\.(json|csv)$/i, '');
  return withoutExtension.trim().length > 0 ? withoutExtension.trim() : 'Importierte Liste';
}

/** Wählt den Importer anhand der Dateiendung. */
export function importFileContent(
  fileName: string,
  text: string,
  nameOverride?: string,
): ImportOutcome {
  const fallbackName = nameOverride ?? nameFromFile(fileName);

  if (/\.json$/i.test(fileName)) {
    return importFromJson(text, fallbackName);
  }
  if (/\.csv$/i.test(fileName)) {
    return importFromCsv(text, fallbackName);
  }
  throw new ImportError('Es werden nur Dateien mit der Endung .json oder .csv unterstützt.');
}
