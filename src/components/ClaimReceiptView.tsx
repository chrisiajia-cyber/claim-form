import { ArrowLeft, Download, FileText, Plus, Printer, Trash2 } from 'lucide-react';
import { ClaimRecord, ClaimStatus } from '../types/claim';
import { exportSingleClaimToJSON, formatMoney, formatShortDate } from '../utils/exportClaims';
import { StatusIndicator } from './StatusIndicator';

interface ClaimReceiptViewProps {
  claim: ClaimRecord;
  mode: 'confirmation' | 'detail';
  onBack: () => void;
  onStatusChange: (id: string, status: ClaimStatus) => void;
  onDelete?: (id: string) => void;
  onCreateAnother?: () => void;
}

const STATUS_OPTIONS: ClaimStatus[] = ['Pending', 'Approved', 'Rejected'];

export function ClaimReceiptView({
  claim,
  mode,
  onBack,
  onStatusChange,
  onDelete,
  onCreateAnother,
}: ClaimReceiptViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Toolbar - hidden on print */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Claims Ledger</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {mode === 'confirmation' && onCreateAnother && (
            <button
              type="button"
              onClick={onCreateAnother}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Another</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => exportSingleClaimToJSON(claim)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Save as PDF / Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Confirmation Banner - hidden on print */}
      {mode === 'confirmation' && (
        <div className="no-print flex items-start justify-between gap-4 px-5 py-4 bg-white border border-slate-200 rounded-lg">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              Claim recorded in ledger
            </h2>
            <p className="text-sm text-slate-600">
              Reference <span className="font-mono font-medium text-slate-900">{claim.id}</span> is saved.
              Use <span className="font-medium text-slate-800">Save as PDF / Print Receipt</span> above to archive an A4 copy.
            </p>
          </div>
          <StatusIndicator status={claim.status} />
        </div>
      )}

      {/* Printable A4 Claim Receipt Card */}
      <article className="claim-receipt-card bg-white border border-slate-200 rounded-lg p-8 space-y-8">
        {/* Document Header */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Official Claim Submission Receipt</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {claim.id}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Submitted {formatShortDate(claim.submittedAt)}</span>
              <span aria-hidden="true">·</span>
              <span>{claim.claimCategory}</span>
              {claim.extractedByAI && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Auto-filled from document</span>
                </>
              )}
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <p className="text-xs font-medium text-slate-500">Claimed Amount</p>
            <p className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
              {formatMoney(claim.claimAmount, claim.currency)}
            </p>
            <div className="pt-1 sm:flex sm:justify-end">
              <StatusIndicator status={claim.status} />
            </div>
          </div>
        </header>

        {/* Structured Details Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
          <div>
            <dt className="text-xs font-medium text-slate-500">Claimant Name</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{claim.claimantName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Contact Email</dt>
            <dd className="mt-1 text-sm text-slate-900">{claim.claimantEmail || 'Not provided'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Order / Invoice Reference</dt>
            <dd className="mt-1 text-sm font-mono font-medium text-slate-900">
              {claim.referenceNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Incident / Purchase Date</dt>
            <dd className="mt-1 text-sm font-mono tabular-nums text-slate-900">
              {formatShortDate(claim.incidentDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Claim Category</dt>
            <dd className="mt-1 text-sm text-slate-900">{claim.claimCategory}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Settlement Currency</dt>
            <dd className="mt-1 text-sm font-mono text-slate-900">{claim.currency}</dd>
          </div>
        </section>

        {/* Summary Description */}
        <section className="pt-6 border-t border-slate-200 space-y-2">
          <h3 className="text-xs font-medium text-slate-500">Claim Summary & Itemized Reason</h3>
          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {claim.description}
          </p>
        </section>

        {/* Supporting Evidence Attachment */}
        {claim.attachment && (
          <section className="pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Supporting Document</span>
              <span className="font-mono">
                {claim.attachment.fileName} · {(claim.attachment.sizeBytes / 1024).toFixed(1)} KB
              </span>
            </div>

            {claim.attachment.mimeType.startsWith('image/') ? (
              <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-3">
                <img
                  src={claim.attachment.dataUrl}
                  alt={`Supporting receipt for ${claim.id}`}
                  referrerPolicy="no-referrer"
                  className="max-h-72 mx-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-md bg-slate-50">
                <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {claim.attachment.fileName}
                  </p>
                  <p className="text-xs text-slate-500">{claim.attachment.mimeType}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Print Footer */}
        <footer className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>ClearClaim Claims Intake Ledger</span>
          <span className="font-mono tabular-nums">
            Generated {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
          </span>
        </footer>
      </article>

      {/* Reviewer Status Controls - hidden on print */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-white border border-slate-200 rounded-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-600">Review Status</span>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-md">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onStatusChange(claim.id, option)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  claim.status === option
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(claim.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Record</span>
          </button>
        )}
      </div>
    </div>
  );
}
