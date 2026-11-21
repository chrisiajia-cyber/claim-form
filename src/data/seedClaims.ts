import { ClaimCategory, ClaimRecord, CurrencyCode, LaunchChecklistItem } from '../types/claim';

export const CLAIM_CATEGORIES: ClaimCategory[] = [
  'Damaged Item',
  'Missing Parcel',
  'Expense Reimbursement',
  'Warranty / Defect',
  'Other',
];

export const CURRENCY_CODES: CurrencyCode[] = ['MYR', 'USD', 'SGD', 'EUR', 'GBP'];

export const INITIAL_CLAIMS: ClaimRecord[] = [
  {
    id: 'CLM-2026-1041',
    submittedAt: '2026-11-19T09:42:00.000Z',
    claimantName: 'Aina Nurul Huda',
    claimantEmail: 'aina.huda@meridianops.my',
    referenceNumber: 'INV-884210',
    incidentDate: '2026-11-17',
    claimCategory: 'Damaged Item',
    claimAmount: 485.5,
    currency: 'MYR',
    description:
      'Outer shipping carton arrived crushed along the right corner; ceramic carafe shattered inside protective sleeve.',
    status: 'Pending',
    extractedByAI: true,
  },
  {
    id: 'CLM-2026-1042',
    submittedAt: '2026-11-18T14:15:00.000Z',
    claimantName: 'Marcus Chen',
    claimantEmail: 'm.chen@harborfreight.sg',
    referenceNumber: 'TRK-SG-90214',
    incidentDate: '2026-11-14',
    claimCategory: 'Missing Parcel',
    claimAmount: 219.0,
    currency: 'SGD',
    description:
      'Carrier marked consignment delivered at loading bay B, but warehouse CCTV confirms no courier arrival during the window.',
    status: 'Approved',
    extractedByAI: true,
  },
  {
    id: 'CLM-2026-1043',
    submittedAt: '2026-11-17T11:08:00.000Z',
    claimantName: 'Rachel Lim',
    claimantEmail: 'rachel.lim@kestrelstudio.com',
    referenceNumber: 'EXP-2026-391',
    incidentDate: '2026-11-15',
    claimCategory: 'Expense Reimbursement',
    claimAmount: 164.8,
    currency: 'USD',
    description:
      'Client site travel: airport express rail tickets and regional conference parking receipt for quarterly review.',
    status: 'Approved',
    extractedByAI: false,
  },
  {
    id: 'CLM-2026-1044',
    submittedAt: '2026-11-16T16:30:00.000Z',
    claimantName: 'Daniel Rajendran',
    claimantEmail: 'daniel.r@northernlogistics.my',
    referenceNumber: 'ORD-551923',
    incidentDate: '2026-11-10',
    claimCategory: 'Warranty / Defect',
    claimAmount: 1290.0,
    currency: 'MYR',
    description:
      'Handheld barcode scanner battery fails to hold charge beyond 25 minutes within the 12-month hardware warranty period.',
    status: 'Pending',
    extractedByAI: true,
  },
  {
    id: 'CLM-2026-1045',
    submittedAt: '2026-11-14T08:50:00.000Z',
    claimantName: 'Siti Farhana Yusof',
    claimantEmail: 'farhana@northstarretail.com',
    referenceNumber: 'INV-771042',
    incidentDate: '2026-11-02',
    claimCategory: 'Other',
    claimAmount: 92.4,
    currency: 'USD',
    description:
      'Duplicate customs brokerage surcharge billed on commercial invoice INV-771042 after duties were already settled.',
    status: 'Rejected',
    extractedByAI: false,
  },
];

export const INITIAL_CHECKLIST: LaunchChecklistItem[] = [
  {
    id: 'env-secrets',
    title: 'Move API keys to server environment variables',
    summary:
      'Store GEMINI_API_KEY in .env.local or cloud secret manager and never commit .env files to version control.',
    category: 'Security',
    completed: true,
  },
  {
    id: 'persistent-db',
    title: 'Connect persistent database storage',
    summary:
      'Replace browser localStorage with PostgreSQL, Firestore, or Supabase so submitted claims sync across reviewers and devices.',
    category: 'Database',
    completed: false,
  },
  {
    id: 'object-storage',
    title: 'Route uploaded evidence to cloud object storage',
    summary:
      'Upload receipt images and PDFs to Cloud Storage, S3, or R2 and save signed URLs on each claim record.',
    category: 'Storage',
    completed: false,
  },
  {
    id: 'email-receipts',
    title: 'Configure automated claim confirmation emails',
    summary:
      'Trigger a confirmation email containing the generated Claim ID and PDF receipt link upon form submission.',
    category: 'Notifications',
    completed: false,
  },
];

export const CODE_SNIPPETS = {
  csvExporter: `export interface ClaimRecord {
  id: string;
  submittedAt: string;
  claimantName: string;
  referenceNumber: string;
  claimCategory: string;
  claimAmount: number;
  currency: string;
  status: "Pending" | "Approved" | "Rejected";
}

export function exportClaimsToCSV(claims: ClaimRecord[]) {
  const headers = [
    "Claim ID",
    "Submitted Date",
    "Claimant Name",
    "Reference No",
    "Category",
    "Amount",
    "Currency",
    "Status",
  ];

  const escapeCell = (val: string) =>
    /[",\\n\\r]/.test(val) ? \`"\${val.replace(/"/g, '""')}"\` : val;

  const rows = claims.map((c) => [
    c.id,
    c.submittedAt.slice(0, 10),
    escapeCell(c.claimantName),
    escapeCell(c.referenceNumber),
    escapeCell(c.claimCategory),
    c.claimAmount.toFixed(2),
    c.currency,
    c.status,
  ]);

  const csv = "\\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\\r\\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = \`claims_export_\${new Date().toISOString().slice(0, 10)}.csv\`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}`,

  printCss: `@media print {
  @page {
    size: A4 portrait;
    margin: 14mm;
  }

  /* Hide navigation, filters, and action buttons when exporting to PDF */
  .no-print {
    display: none !important;
  }

  /* Format the claim summary card cleanly on A4 paper */
  .claim-receipt-card {
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 24px !important;
    break-inside: avoid;
  }
}`,

  jsonSchema: `{
  "type": "OBJECT",
  "properties": {
    "claimantName": {
      "type": "STRING",
      "description": "Full name of the customer or employee submitting the claim"
    },
    "referenceNumber": {
      "type": "STRING",
      "description": "Order ID, invoice number, or tracking number"
    },
    "incidentDate": {
      "type": "STRING",
      "description": "Date of purchase or incident in YYYY-MM-DD format"
    },
    "claimCategory": {
      "type": "STRING",
      "enum": [
        "Damaged Item",
        "Missing Parcel",
        "Expense Reimbursement",
        "Warranty / Defect",
        "Other"
      ]
    },
    "claimAmount": {
      "type": "NUMBER",
      "description": "Total numeric amount being claimed"
    },
    "currency": {
      "type": "STRING",
      "description": "3-letter currency code (e.g., MYR, USD, SGD)"
    },
    "description": {
      "type": "STRING",
      "description": "Concise summary of the items or reason for the claim"
    }
  },
  "required": ["referenceNumber", "claimCategory", "claimAmount", "description"]
}`,

  serverRoute: `import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractClaimFromDocument(base64Data: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-4-hydrogen",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Extract the claim details from this document." },
      ],
    },
    config: {
      systemInstruction:
        "Extract claim details accurately. Format dates as YYYY-MM-DD. Return null for illegible fields.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          claimantName: { type: Type.STRING, nullable: true },
          referenceNumber: { type: Type.STRING, nullable: true },
          incidentDate: { type: Type.STRING, nullable: true },
          claimCategory: { type: Type.STRING },
          claimAmount: { type: Type.NUMBER, nullable: true },
          currency: { type: Type.STRING, nullable: true },
          description: { type: Type.STRING, nullable: true },
        },
        required: ["claimCategory", "description"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}`,
};
