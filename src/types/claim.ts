export type ClaimCategory =
  | 'Damaged Item'
  | 'Missing Parcel'
  | 'Expense Reimbursement'
  | 'Warranty / Defect'
  | 'Other';

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected';

export type CurrencyCode = 'MYR' | 'USD' | 'SGD' | 'EUR' | 'GBP';

export interface ClaimAttachment {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
}

export interface ClaimRecord {
  id: string;
  submittedAt: string;
  claimantName: string;
  claimantEmail: string;
  referenceNumber: string;
  incidentDate: string;
  claimCategory: ClaimCategory;
  claimAmount: number;
  currency: CurrencyCode;
  description: string;
  status: ClaimStatus;
  attachment?: ClaimAttachment;
  extractedByAI?: boolean;
}

export interface ExtractedClaimFields {
  claimantName: string | null;
  referenceNumber: string | null;
  incidentDate: string | null;
  claimCategory: ClaimCategory;
  claimAmount: number | null;
  currency: string | null;
  description: string | null;
}

export type ExportColumnKey =
  | 'id'
  | 'submittedAt'
  | 'claimantName'
  | 'claimantEmail'
  | 'referenceNumber'
  | 'incidentDate'
  | 'claimCategory'
  | 'claimAmount'
  | 'currency'
  | 'status'
  | 'description';

export interface ExportColumnDef {
  key: ExportColumnKey;
  label: string;
  defaultEnabled: boolean;
}

export type CsvDelimiter = ',' | ';' | '\t';

export interface LaunchChecklistItem {
  id: string;
  title: string;
  summary: string;
  category: 'Security' | 'Database' | 'Storage' | 'Notifications';
  completed: boolean;
}
