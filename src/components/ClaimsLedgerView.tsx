import { useMemo, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  Download,
  FileJson,
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
} from 'lucide-react';
import { CLAIM_CATEGORIES } from '../data/seedClaims';
import { ClaimCategory, ClaimRecord, ClaimStatus } from '../types/claim';
import {
  copyClaimsAsTSV,
  exportClaimsToCSV,
  exportClaimsToJSON,
  formatMoney,
  formatShortDate,
} from '../utils/exportClaims';
import { StatusIndicator } from './StatusIndicator';

interface ClaimsLedgerViewProps {
  claims: ClaimRecord[];
  onInspectClaim: (claim: ClaimRecord) => void;
  onStatusChange: (id: string, status: ClaimStatus) => void;
  onNewClaim: () => void;
}

type StatusFilter = 'All' | ClaimStatus;

const STATUS_TABS: StatusFilter[] = ['All', 'Pending', 'Approved', 'Rejected'];

export function ClaimsLedgerView({
  claims,
  onInspectClaim,
  onStatusChange,
  onNewClaim,
}: ClaimsLedgerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ClaimCategory>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedTsv, setCopiedTsv] = useState(false);

  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return claims.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && c.claimCategory !== categoryFilter) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.claimantName.toLowerCase().includes(q) ||
        c.referenceNumber.toLowerCase().includes(q) ||
        c.claimCategory.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [claims, searchQuery, statusFilter, categoryFilter]);

  const exportTargetClaims = useMemo(() => {
    if (selectedIds.size === 0) return filteredClaims;
    return filteredClaims.filter((c) => selectedIds.has(c.id));
  }, [filteredClaims, selectedIds]);

  const metrics = useMemo(() => {
    const pendingCount = claims.filter((c) => c.status === 'Pending').length;
    const approvedCount = claims.filter((c) => c.status === 'Approved').length;
    const byCurrency = new Map<string, number>();
    for (const c of claims) {
      if (c.status === 'Approved') {
        byCurrency.set(c.currency, (byCurrency.get(c.currency) ?? 0) + c.claimAmount);
      }
    }
    const currencySummary =
      byCurrency.size > 0
        ? Array.from(byCurrency.entries())
            .map(([curr, sum]) => formatMoney(sum, curr))
            .join(' · ')
        : 'No approved payouts yet';

    return {
      total: claims.length,
      pendingCount,
      approvedCount,
      currencySummary,
    };
  }, [claims]);

  const allFilteredSelected =
    filteredClaims.length > 0 && filteredClaims.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClaims.map((c) => c.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyTsv = async () => {
    if (exportTargetClaims.length === 0) return;
    const ok = await copyClaimsAsTSV(exportTargetClaims);
    if (ok) {
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2000);
    }
  };

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Formal Ledger Header */}
      <div className="hidden print-only pb-4 mb-4 border-b border-slate-300">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ClearClaim — Claims Ledger Export</h1>
            <p className="text-xs text-slate-600 mt-1">
              Scope: {statusFilter} status · {categoryFilter} category · {exportTargetClaims.length}{' '}
              records
            </p>
          </div>
          <p className="text-xs font-mono text-slate-600">
            Printed {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
      </div>

      {/* Page Heading & Quick Export Strip - hidden on print */}
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Claims Ledger
          </h1>
          <p className="text-sm text-slate-600">
            Review submitted claims, update approval status, and export filtered datasets to CSV, JSON, or PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportClaimsToCSV(exportTargetClaims)}
            disabled={exportTargetClaims.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>
              Export CSV{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => exportClaimsToJSON(exportTargetClaims)}
            disabled={exportTargetClaims.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-600" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => void handleCopyTsv()}
            disabled={exportTargetClaims.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedTsv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-700">Copied Sheets TSV</span>
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy TSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrintLedger}
            disabled={exportTargetClaims.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* 4-Column Flat Metric Strip - hidden on print */}
      <section className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Total Claims</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {metrics.total}
          </p>
          <p className="mt-1 text-xs text-slate-500">Stored in workspace ledger</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Pending Review</p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-700 font-mono tabular-nums">
            {metrics.pendingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Awaiting verification</p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Approved Claims</p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-700 font-mono tabular-nums">
            {metrics.approvedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums truncate" title={metrics.currencySummary}>
            {metrics.currencySummary}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Export Set</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {exportTargetClaims.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedIds.size > 0 ? 'Selected rows ready' : 'All filtered rows'}
          </p>
        </div>
      </section>

      {/* Filter Toolbar - hidden on print */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Status Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-md">
            {STATUS_TABS.map((tab) => {
              const count =
                tab === 'All'
                  ? claims.length
                  : claims.filter((c) => c.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab} <span className="font-mono text-slate-400 ml-1">{count}</span>
                </button>
              );
            })}
          </div>

          <select
            aria-label="Filter by claim category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | ClaimCategory)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          >
            <option value="All">All Categories</option>
            {CLAIM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, claimant, reference..."
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* High-Density Claims Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">
              {claims.length === 0
                ? 'No claims have been submitted yet'
                : 'No claims match the active filters'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {claims.length === 0
                ? 'Create your first claim using the intake form or upload a receipt photo to extract details automatically.'
                : 'Adjust your status tab, category filter, or search query to view records.'}
            </p>
            <div className="pt-2">
              {claims.length === 0 ? (
                <button
                  type="button"
                  onClick={onNewClaim}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Claim</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="print-ledger-table w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="no-print w-10 py-3 pl-4 pr-2">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all visible claims"
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Claim ID</th>
                  <th className="py-3 px-3 whitespace-nowrap">Claimant</th>
                  <th className="py-3 px-3 whitespace-nowrap">Reference No</th>
                  <th className="py-3 px-3 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3 whitespace-nowrap">Incident Date</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Amount</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="no-print py-3 pl-3 pr-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredClaims.map((claim) => {
                  const isSelected = selectedIds.has(claim.id);
                  return (
                    <tr
                      key={claim.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="no-print py-3 pl-4 pr-2 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(claim.id)}
                          aria-label={`Select ${claim.id}`}
                          className="rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onInspectClaim(claim)}
                          className="font-mono text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                        >
                          {claim.id}
                        </button>
                      </td>
                      <td className="py-3 px-3 align-middle min-w-[170px]">
                        <div className="font-medium text-slate-900 text-xs leading-snug">
                          {claim.claimantName}
                        </div>
                        {claim.claimantEmail && (
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {claim.claimantEmail}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 align-middle font-mono text-xs text-slate-700 whitespace-nowrap">
                        {claim.referenceNumber}
                      </td>
                      <td className="py-3 px-3 align-middle text-xs text-slate-700 whitespace-nowrap">
                        {claim.claimCategory}
                      </td>
                      <td className="py-3 px-3 align-middle font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                        {formatShortDate(claim.incidentDate)}
                      </td>
                      <td className="py-3 px-3 align-middle text-right font-mono text-xs font-medium tabular-nums text-slate-900 whitespace-nowrap">
                        {formatMoney(claim.claimAmount, claim.currency)}
                      </td>
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <StatusIndicator status={claim.status} />
                      </td>
                      <td className="no-print py-3 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <select
                            aria-label={`Update status for ${claim.id}`}
                            value={claim.status}
                            onChange={(e) =>
                              onStatusChange(claim.id, e.target.value as ClaimStatus)
                            }
                            className="px-2 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:border-slate-300 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => onInspectClaim(claim)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded transition-colors cursor-pointer"
                          >
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {filteredClaims.length > 0 && (
          <div className="no-print px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-mono tabular-nums">
              Showing {filteredClaims.length} of {claims.length} claims
            </span>
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-700">
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={() => exportClaimsToCSV(exportTargetClaims)}
                  className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Selected CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span>Click any Claim ID to view or save an A4 PDF receipt</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
