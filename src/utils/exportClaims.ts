import {
  ClaimRecord,
  CsvDelimiter,
  CurrencyCode,
  ExportColumnDef,
  ExportColumnKey,
} from '../types/claim';

export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { key: 'id', label: 'Claim ID', defaultEnabled: true },
  { key: 'submittedAt', label: 'Submitted Date', defaultEnabled: true },
  { key: 'claimantName', label: 'Claimant Name', defaultEnabled: true },
  { key: 'claimantEmail', label: 'Claimant Email', defaultEnabled: false },
  { key: 'referenceNumber', label: 'Reference No', defaultEnabled: true },
  { key: 'incidentDate', label: 'Incident Date', defaultEnabled: true },
  { key: 'claimCategory', label: 'Category', defaultEnabled: true },
  { key: 'claimAmount', label: 'Amount', defaultEnabled: true },
  { key: 'currency', label: 'Currency', defaultEnabled: true },
  { key: 'status', label: 'Status', defaultEnabled: true },
  { key: 'description', label: 'Description', defaultEnabled: false },
];

export const DEFAULT_EXPORT_COLUMNS: ExportColumnKey[] = EXPORT_COLUMNS.filter(
  (c) => c.defaultEnabled
).map((c) => c.key);

function escapeCsvCell(value: string, delimiter: CsvDelimiter): string {
  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  if (!needsQuoting) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

function getColumnValue(claim: ClaimRecord, key: ExportColumnKey): string {
  switch (key) {
    case 'id':
      return claim.id;
    case 'submittedAt':
      return claim.submittedAt.slice(0, 10);
    case 'claimantName':
      return claim.claimantName;
    case 'claimantEmail':
      return claim.claimantEmail;
    case 'referenceNumber':
      return claim.referenceNumber;
    case 'incidentDate':
      return claim.incidentDate;
    case 'claimCategory':
      return claim.claimCategory;
    case 'claimAmount':
      return claim.claimAmount.toFixed(2);
    case 'currency':
      return claim.currency;
    case 'status':
      return claim.status;
    case 'description':
      return claim.description;
  }
}

export function buildDelimitedContent(
  claims: ClaimRecord[],
  columns: ExportColumnKey[] = DEFAULT_EXPORT_COLUMNS,
  delimiter: CsvDelimiter = ','
): string {
  const activeCols = columns.length > 0 ? columns : DEFAULT_EXPORT_COLUMNS;
  const headerMap = new Map(EXPORT_COLUMNS.map((c) => [c.key, c.label]));
  const headers = activeCols.map((key) =>
    escapeCsvCell(headerMap.get(key) ?? key, delimiter)
  );

  const rows = claims.map((claim) =>
    activeCols.map((key) => escapeCsvCell(getColumnValue(claim, key), delimiter))
  );

  return [headers.join(delimiter), ...rows.map((row) => row.join(delimiter))].join('\r\n');
}

function triggerDownload(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportClaimsToCSV(
  claims: ClaimRecord[],
  options?: {
    columns?: ExportColumnKey[];
    delimiter?: CsvDelimiter;
    includeBom?: boolean;
    filenamePrefix?: string;
  }
) {
  const columns = options?.columns ?? DEFAULT_EXPORT_COLUMNS;
  const delimiter = options?.delimiter ?? ',';
  const includeBom = options?.includeBom ?? true;
  const prefix = options?.filenamePrefix ?? 'claims_export';
  const dateStamp = new Date().toISOString().slice(0, 10);
  const ext = delimiter === '\t' ? 'tsv' : 'csv';

  const body = buildDelimitedContent(claims, columns, delimiter);
  const payload = includeBom ? `\uFEFF${body}` : body;
  const mime =
    delimiter === '\t'
      ? 'text/tab-separated-values;charset=utf-8'
      : 'text/csv;charset=utf-8';

  triggerDownload(payload, mime, `${prefix}_${dateStamp}.${ext}`);
}

export function buildClaimsJson(claims: ClaimRecord[], includeAttachmentMeta = false): string {
  const sanitized = claims.map((c) => {
    const base = {
      id: c.id,
      submittedAt: c.submittedAt,
      claimantName: c.claimantName,
      claimantEmail: c.claimantEmail,
      referenceNumber: c.referenceNumber,
      incidentDate: c.incidentDate,
      claimCategory: c.claimCategory,
      claimAmount: Number(c.claimAmount.toFixed(2)),
      currency: c.currency,
      description: c.description,
      status: c.status,
    };
    if (includeAttachmentMeta && c.attachment) {
      return {
        ...base,
        attachment: {
          fileName: c.attachment.fileName,
          mimeType: c.attachment.mimeType,
          sizeBytes: c.attachment.sizeBytes,
        },
      };
    }
    return base;
  });

  return JSON.stringify(sanitized, null, 2);
}

export function exportClaimsToJSON(claims: ClaimRecord[], filenamePrefix = 'claims_export') {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const content = buildClaimsJson(claims, true);
  triggerDownload(content, 'application/json;charset=utf-8', `${filenamePrefix}_${dateStamp}.json`);
}

export function exportSingleClaimToJSON(claim: ClaimRecord) {
  const content = JSON.stringify(
    {
      id: claim.id,
      submittedAt: claim.submittedAt,
      claimantName: claim.claimantName,
      claimantEmail: claim.claimantEmail,
      referenceNumber: claim.referenceNumber,
      incidentDate: claim.incidentDate,
      claimCategory: claim.claimCategory,
      claimAmount: Number(claim.claimAmount.toFixed(2)),
      currency: claim.currency,
      description: claim.description,
      status: claim.status,
    },
    null,
    2
  );
  triggerDownload(content, 'application/json;charset=utf-8', `${claim.id.toLowerCase()}_receipt.json`);
}

export async function copyClaimsAsTSV(
  claims: ClaimRecord[],
  columns: ExportColumnKey[] = DEFAULT_EXPORT_COLUMNS
): Promise<boolean> {
  try {
    const tsv = buildDelimitedContent(claims, columns, '\t');
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}

export function formatMoney(amount: number, currency: CurrencyCode | string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export function formatShortDate(isoString: string): string {
  if (!isoString) return '—';
  const datePart = isoString.slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return datePart;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function generateNextClaimId(existing: ClaimRecord[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 1040;
  for (const item of existing) {
    const match = item.id.match(/CLM-\d{4}-(\d+)/);
    if (match) {
      const seq = Number.parseInt(match[1], 10);
      if (!Number.isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  return `CLM-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
}
