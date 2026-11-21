import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
  ScanText,
  Upload,
  X,
} from 'lucide-react';
import { CLAIM_CATEGORIES, CURRENCY_CODES } from '../data/seedClaims';
import {
  ClaimAttachment,
  ClaimCategory,
  ClaimRecord,
  CurrencyCode,
  ExtractedClaimFields,
} from '../types/claim';

interface ClaimFormViewProps {
  onSubmitClaim: (
    payload: Omit<ClaimRecord, 'id' | 'submittedAt' | 'status'>
  ) => ClaimRecord;
}

interface FormState {
  claimantName: string;
  claimantEmail: string;
  referenceNumber: string;
  incidentDate: string;
  claimCategory: ClaimCategory;
  claimAmount: string;
  currency: CurrencyCode;
  description: string;
}

const INITIAL_FORM: FormState = {
  claimantName: '',
  claimantEmail: '',
  referenceNumber: '',
  incidentDate: new Date().toISOString().slice(0, 10),
  claimCategory: 'Damaged Item',
  claimAmount: '',
  currency: 'MYR',
  description: '',
};

/**
 * Generates a realistic high-resolution commercial invoice PNG in-browser so users
 * can test real server-side multimodal extraction even without a local receipt on disk.
 */
function generateSampleInvoiceImage(): ClaimAttachment {
  const canvas = document.createElement('canvas');
  canvas.width = 880;
  canvas.height = 1040;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top rule
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, 12);

  // Vendor header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('KINETIC SUPPLY CO.', 56, 84);
  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  ctx.fillText('42 Jalan Tun Razak, 50400 Kuala Lumpur, Malaysia', 56, 114);
  ctx.fillText('support@kineticsupply.my  |  Tax ID: MY-9941208-W', 56, 138);

  // Invoice Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('TAX INVOICE', 640, 84);
  ctx.fillStyle = '#334155';
  ctx.font = '16px monospace';
  ctx.fillText('Invoice No: INV-2026-44918', 560, 118);
  ctx.fillText('Date:       2026-11-18', 560, 144);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(56, 178);
  ctx.lineTo(824, 178);
  ctx.stroke();

  // Bill To
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('BILLED TO', 56, 218);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Nadia Tan Mei Ling', 56, 248);
  ctx.fillStyle = '#334155';
  ctx.font = '16px sans-serif';
  ctx.fillText('Operations Lead, Verve Logistics Sdn Bhd', 56, 274);
  ctx.fillText('Tracking Ref: KSC-MY-78412', 56, 298);

  // Table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(56, 344, 768, 44);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('ITEM DESCRIPTION', 72, 371);
  ctx.fillText('QTY', 540, 371);
  ctx.fillText('UNIT (MYR)', 615, 371);
  ctx.fillText('TOTAL', 745, 371);

  // Line items
  const rows = [
    ['Thermal Label Printer — Model TP-420 (Transit Impact Damage)', '1', '320.00', '320.00'],
    ['Replacement Printhead Assembly & Protective Kit', '1', '64.50', '64.50'],
    ['Express Courier Handling Surcharge', '1', '18.00', '18.00'],
  ];

  let y = 428;
  ctx.font = '15px sans-serif';
  for (const [desc, qty, unit, total] of rows) {
    ctx.fillStyle = '#0f172a';
    ctx.fillText(desc, 72, y);
    ctx.font = '15px monospace';
    ctx.fillText(qty, 548, y);
    ctx.fillText(unit, 622, y);
    ctx.fillText(total, 742, y);
    ctx.font = '15px sans-serif';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(56, y + 20);
    ctx.lineTo(824, y + 20);
    ctx.stroke();
    y += 56;
  }

  // Totals
  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  ctx.fillText('Subtotal', 570, 640);
  ctx.font = '16px monospace';
  ctx.fillText('MYR 402.50', 710, 640);

  ctx.font = '16px sans-serif';
  ctx.fillText('SST (6%)', 570, 672);
  ctx.font = '16px monospace';
  ctx.fillText('MYR 24.15', 710, 672);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(560, 692);
  ctx.lineTo(824, 692);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('TOTAL DUE', 570, 728);
  ctx.font = 'bold 22px monospace';
  ctx.fillText('MYR 426.65', 694, 728);

  // Incident stamp note
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 788, 768, 128);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('DELIVERY INSPECTION NOTE', 76, 822);
  ctx.fillStyle = '#334155';
  ctx.font = '15px sans-serif';
  ctx.fillText('Parcel received with crushed housing on Thermal Label Printer TP-420.', 76, 854);
  ctx.fillText('Claim submitted under Damaged Item coverage for full invoice amount MYR 426.65.', 76, 880);

  const dataUrl = canvas.toDataURL('image/png');
  const base64Length = dataUrl.split(',')[1]?.length ?? 0;
  return {
    fileName: 'sample_invoice_INV-2026-44918.png',
    mimeType: 'image/png',
    dataUrl,
    sizeBytes: Math.round((base64Length * 3) / 4),
  };
}

export function ClaimFormView({ onSubmitClaim }: ClaimFormViewProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [attachment, setAttachment] = useState<ClaimAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedFieldNames, setExtractedFieldNames] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readFileAsAttachment = (file: File) => {
    setExtractError(null);
    setExtractedFieldNames([]);

    if (file.size > 10 * 1024 * 1024) {
      setExtractError('File exceeds 10 MB limit. Choose a smaller image or PDF receipt.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        setExtractError('Failed to read selected file.');
        return;
      }
      setAttachment({
        fileName: file.name,
        mimeType: file.type || 'image/png',
        dataUrl,
        sizeBytes: file.size,
      });
    };
    reader.onerror = () => {
      setExtractError('Unable to read the uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileAsAttachment(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFileAsAttachment(file);
    }
  };

  const runExtraction = async (targetAttachment: ClaimAttachment) => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractedFieldNames([]);

    try {
      const base64Data = targetAttachment.dataUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Document payload could not be encoded.');
      }

      const response = await fetch('/api/extract-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: targetAttachment.mimeType,
          fileName: targetAttachment.fileName,
        }),
      });

      const payload = (await response.json()) as ExtractedClaimFields & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Document extraction failed.');
      }

      const filled: string[] = [];

      setForm((prev) => {
        const next = { ...prev };
        if (payload.claimantName) {
          next.claimantName = payload.claimantName;
          filled.push('Claimant Name');
        }
        if (payload.referenceNumber) {
          next.referenceNumber = payload.referenceNumber;
          filled.push('Reference No');
        }
        if (payload.incidentDate && /^\d{4}-\d{2}-\d{2}$/.test(payload.incidentDate)) {
          next.incidentDate = payload.incidentDate;
          filled.push('Incident Date');
        }
        if (payload.claimCategory && CLAIM_CATEGORIES.includes(payload.claimCategory)) {
          next.claimCategory = payload.claimCategory;
          filled.push('Category');
        }
        if (typeof payload.claimAmount === 'number' && !Number.isNaN(payload.claimAmount)) {
          next.claimAmount = payload.claimAmount.toFixed(2);
          filled.push('Claim Amount');
        }
        if (
          payload.currency &&
          CURRENCY_CODES.includes(payload.currency as CurrencyCode)
        ) {
          next.currency = payload.currency as CurrencyCode;
          filled.push('Currency');
        }
        if (payload.description) {
          next.description = payload.description;
          filled.push('Description');
        }
        return next;
      });

      setExtractedFieldNames(filled);
      if (filled.length === 0) {
        setExtractError(
          'No structured claim details could be read from this file. Enter the fields manually.'
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to extract claim fields from this document.';
      setExtractError(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleLoadSampleAndExtract = () => {
    try {
      const sample = generateSampleInvoiceImage();
      setAttachment(sample);
      void runExtraction(sample);
    } catch {
      setExtractError('Unable to generate sample invoice image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const amount = Number.parseFloat(form.claimAmount);
    if (!form.claimantName.trim()) {
      setValidationError('Enter the claimant full name.');
      return;
    }
    if (!form.referenceNumber.trim()) {
      setValidationError('Enter an order ID, invoice number, or tracking reference.');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setValidationError('Enter a valid claim amount greater than 0.');
      return;
    }
    if (!form.description.trim()) {
      setValidationError('Provide a concise description of the claim.');
      return;
    }

    onSubmitClaim({
      claimantName: form.claimantName.trim(),
      claimantEmail: form.claimantEmail.trim(),
      referenceNumber: form.referenceNumber.trim(),
      incidentDate: form.incidentDate || new Date().toISOString().slice(0, 10),
      claimCategory: form.claimCategory,
      claimAmount: Number(amount.toFixed(2)),
      currency: form.currency,
      description: form.description.trim(),
      attachment: attachment ?? undefined,
      extractedByAI: extractedFieldNames.length > 0,
    });
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setAttachment(null);
    setExtractError(null);
    setExtractedFieldNames([]);
    setValidationError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            New Claim Intake
          </h1>
          <p className="text-sm text-slate-600">
            Upload a receipt, invoice, or damage photo to auto-fill claim details, or enter fields directly.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Receipt Upload & Structured Auto-Fill */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Receipt & Evidence Auto-Fill
            </h2>
            <p className="text-xs text-slate-500">
              Supports PNG, JPG, WEBP, and PDF up to 10 MB. Extracted values map directly into the form.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {!attachment ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
              }`}
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-800">
                Drop receipt or invoice here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP, or PDF document
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Choose File
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleAndExtract}
                  disabled={isExtracting}
                  className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Test with Sample Invoice
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                {attachment.mimeType.startsWith('image/') ? (
                  <img
                    src={attachment.dataUrl}
                    alt="Uploaded receipt preview"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-64 object-contain p-3 bg-slate-50"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-5">
                    <FileText className="w-8 h-8 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        PDF · {(attachment.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0 text-slate-700">
                    <FileImage className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono">{attachment.fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      setExtractError(null);
                      setExtractedFieldNames([]);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Remove uploaded file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void runExtraction(attachment)}
                  disabled={isExtracting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting Fields...</span>
                    </>
                  ) : (
                    <>
                      <ScanText className="w-4 h-4" />
                      <span>Extract Claim Fields</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  className="px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Replace
                </button>
              </div>
            </div>
          )}

          {/* Extraction Feedback */}
          {extractError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{extractError}</p>
            </div>
          )}

          {extractedFieldNames.length > 0 && !isExtracting && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">
                  Auto-filled {extractedFieldNames.length} fields from document
                </p>
                <p className="text-emerald-800">
                  {extractedFieldNames.join(' · ')}. Verify accuracy before submitting.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Extraction Schema Mapping</p>
            <p className="leading-relaxed">
              Dates normalize to <span className="font-mono text-slate-700">YYYY-MM-DD</span>, amounts parse as clean decimals without symbols, and missing fields remain blank for manual confirmation.
            </p>
          </div>
        </section>

        {/* Right Column: Structured Claim Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-6"
        >
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Claim Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All submitted records are immediately available for CSV, JSON, and A4 PDF receipt export.
            </p>
          </div>

          {validationError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="claimantName" className="block text-xs font-medium text-slate-700">
                Claimant Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="claimantName"
                type="text"
                required
                value={form.claimantName}
                onChange={(e) => setForm({ ...form, claimantName: e.target.value })}
                placeholder="e.g., Nadia Tan Mei Ling"
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="claimantEmail" className="block text-xs font-medium text-slate-700">
                Contact Email
              </label>
              <input
                id="claimantEmail"
                type="email"
                value={form.claimantEmail}
                onChange={(e) => setForm({ ...form, claimantEmail: e.target.value })}
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="referenceNumber" className="block text-xs font-medium text-slate-700">
                Order / Invoice / Tracking No <span className="text-red-600">*</span>
              </label>
              <input
                id="referenceNumber"
                type="text"
                required
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                placeholder="e.g., INV-2026-44918"
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="incidentDate" className="block text-xs font-medium text-slate-700">
                Purchase / Incident Date <span className="text-red-600">*</span>
              </label>
              <input
                id="incidentDate"
                type="date"
                required
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="claimCategory" className="block text-xs font-medium text-slate-700">
                Claim Category <span className="text-red-600">*</span>
              </label>
              <select
                id="claimCategory"
                value={form.claimCategory}
                onChange={(e) =>
                  setForm({ ...form, claimCategory: e.target.value as ClaimCategory })
                }
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {CLAIM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="claimAmount" className="block text-xs font-medium text-slate-700">
                Claim Amount <span className="text-red-600">*</span>
              </label>
              <div className="flex">
                <select
                  aria-label="Currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value as CurrencyCode })
                  }
                  className="px-2.5 py-2 text-sm font-mono text-slate-800 bg-slate-50 border border-r-0 border-slate-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  {CURRENCY_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <input
                  id="claimAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.claimAmount}
                  onChange={(e) => setForm({ ...form, claimAmount: e.target.value })}
                  placeholder="0.00"
                  className="flex-1 min-w-0 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-medium text-slate-700">
              Incident Summary & Itemized Details <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Summarize damaged items, missing parcel tracking notes, or expense line items..."
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-y"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Generates a formatted A4 receipt immediately upon submission.
            </p>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Submit Claim & Generate Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
