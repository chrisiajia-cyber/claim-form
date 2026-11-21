import { useMemo, useState } from 'react';
import { Check, CheckSquare, Copy, Download, Square } from 'lucide-react';
import { CODE_SNIPPETS } from '../data/seedClaims';
import {
  ClaimRecord,
  ClaimStatus,
  CsvDelimiter,
  ExportColumnKey,
  LaunchChecklistItem,
} from '../types/claim';
import {
  buildClaimsJson,
  buildDelimitedContent,
  DEFAULT_EXPORT_COLUMNS,
  EXPORT_COLUMNS,
  exportClaimsToCSV,
  exportClaimsToJSON,
} from '../utils/exportClaims';

interface ExportCenterViewProps {
  claims: ClaimRecord[];
  checklist: LaunchChecklistItem[];
  onToggleChecklist: (id: string) => void;
}

type ExportFormat = 'csv' | 'json';
type SnippetKey = keyof typeof CODE_SNIPPETS;

const SNIPPET_TABS: { key: SnippetKey; label: string }[] = [
  { key: 'csvExporter', label: 'CSV Exporter Utility' },
  { key: 'printCss', label: 'A4 PDF Print CSS' },
  { key: 'jsonSchema', label: 'Extraction Schema' },
  { key: 'serverRoute', label: 'Server API Route' },
];

export function ExportCenterView({
  claims,
  checklist,
  onToggleChecklist,
}: ExportCenterViewProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(',');
  const [includeBom, setIncludeBom] = useState(true);
  const [statusScope, setStatusScope] = useState<'All' | ClaimStatus>('All');
  const [selectedColumns, setSelectedColumns] = useState<ExportColumnKey[]>(
    DEFAULT_EXPORT_COLUMNS
  );
  const [copiedPayload, setCopiedPayload] = useState(false);

  const [activeSnippet, setActiveSnippet] = useState<SnippetKey>('csvExporter');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const scopedClaims = useMemo(() => {
    if (statusScope === 'All') return claims;
    return claims.filter((c) => c.status === statusScope);
  }, [claims, statusScope]);

  const previewOutput = useMemo(() => {
    if (scopedClaims.length === 0) {
      return format === 'json' ? '[]' : '# No matching claim records for current filter.';
    }
    if (format === 'json') {
      return buildClaimsJson(scopedClaims, true);
    }
    return buildDelimitedContent(scopedClaims, selectedColumns, delimiter);
  }, [scopedClaims, format, selectedColumns, delimiter]);

  const toggleColumn = (key: ExportColumnKey) => {
    setSelectedColumns((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      const orderMap = new Map(EXPORT_COLUMNS.map((c, idx) => [c.key, idx]));
      return [...prev, key].sort(
        (a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0)
      );
    });
  };

  const handleDownload = () => {
    if (scopedClaims.length === 0) return;
    if (format === 'json') {
      exportClaimsToJSON(scopedClaims, `claims_${statusScope.toLowerCase()}`);
    } else {
      exportClaimsToCSV(scopedClaims, {
        columns: selectedColumns,
        delimiter,
        includeBom,
        filenamePrefix: `claims_${statusScope.toLowerCase()}`,
      });
    }
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(previewOutput);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(CODE_SNIPPETS[activeSnippet]);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const completedChecklistCount = checklist.filter((i) => i.completed).length;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Export Center & Web Integration
        </h1>
        <p className="text-sm text-slate-600">
          Customize dataset exports for Excel, Google Sheets, or external APIs, copy reusable export modules, and track production launch readiness.
        </p>
      </div>

      {/* Section 1: Live Dataset Export Builder */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Dataset Export Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select target format, row filter, and columns before downloading.
            </p>
          </div>

          <div className="space-y-4">
            {/* Format Switch */}
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700">Output Format</span>
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-md">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    format === 'csv'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CSV / Spreadsheet
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    format === 'json'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Structured JSON
                </button>
              </div>
            </div>

            {/* Record Scope */}
            <div className="space-y-1.5">
              <label htmlFor="exportStatusScope" className="block text-xs font-medium text-slate-700">
                Records Included
              </label>
              <select
                id="exportStatusScope"
                value={statusScope}
                onChange={(e) => setStatusScope(e.target.value as 'All' | ClaimStatus)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600"
              >
                <option value="All">All Claims ({claims.length})</option>
                <option value="Pending">
                  Pending Only ({claims.filter((c) => c.status === 'Pending').length})
                </option>
                <option value="Approved">
                  Approved Only ({claims.filter((c) => c.status === 'Approved').length})
                </option>
                <option value="Rejected">
                  Rejected Only ({claims.filter((c) => c.status === 'Rejected').length})
                </option>
              </select>
            </div>

            {/* CSV-specific Options */}
            {format === 'csv' && (
              <>
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-slate-700">Delimiter</span>
                  <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-md">
                    {(
                      [
                        { value: ',', label: 'Comma (,)' },
                        { value: ';', label: 'Semicolon (;)' },
                        { value: '\t', label: 'Tab (TSV)' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setDelimiter(opt.value)}
                        className={`py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                          delimiter === opt.value
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBom}
                    onChange={(e) => setIncludeBom(e.target.checked)}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span>Include UTF-8 BOM for Microsoft Excel compatibility</span>
                </label>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Export Columns</span>
                    <span className="font-mono text-slate-500">
                      {selectedColumns.length} / {EXPORT_COLUMNS.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {EXPORT_COLUMNS.map((col) => {
                      const enabled = selectedColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-1"
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                          />
                          <span className="truncate">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={scopedClaims.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                Download {format === 'json' ? 'JSON' : delimiter === '\t' ? 'TSV' : 'CSV'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyPayload()}
              disabled={scopedClaims.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedPayload ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Output Preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700">
              Live Export Preview
            </span>
            <span className="font-mono text-slate-500 tabular-nums">
              {scopedClaims.length} records · {new Blob([previewOutput]).size.toLocaleString()} bytes
            </span>
          </div>

          <pre className="p-5 text-xs font-mono leading-relaxed text-slate-800 bg-white overflow-x-auto max-h-[420px] overflow-y-auto">
            <code>{previewOutput}</code>
          </pre>
        </div>
      </section>

      {/* Section 2: Exportable Web App Code Modules */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Exportable Integration Modules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Drop-in TypeScript, JSON Schema, and CSS snippets for standalone React, Vite, or Next.js deployments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleCopySnippet()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedSnippet ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-700">Snippet Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
          {SNIPPET_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveSnippet(tab.key);
                setCopiedSnippet(false);
              }}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSnippet === tab.key
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <pre className="p-6 text-xs font-mono leading-relaxed text-slate-100 bg-slate-900 overflow-x-auto max-h-[380px] overflow-y-auto">
          <code>{CODE_SNIPPETS[activeSnippet]}</code>
        </pre>
      </section>

      {/* Section 3: Production Deployment Checklist */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Production Export Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track infrastructure steps required when moving an exported prototype to production.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {completedChecklistCount} / {checklist.length} completed
          </span>
        </div>

        <ul className="divide-y divide-slate-200">
          {checklist.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggleChecklist(item.id)}
                className="w-full px-6 py-4 text-left flex items-start gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-xs text-slate-500">{item.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
