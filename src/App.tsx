import { useEffect, useState } from 'react';
import {
  Download,
  FilePlus2,
  FileSpreadsheet,
  Menu,
  PackageCheck,
  Plus,
  X,
} from 'lucide-react';
import { ClaimFormView } from './components/ClaimFormView';
import { ClaimReceiptView } from './components/ClaimReceiptView';
import { ClaimsLedgerView } from './components/ClaimsLedgerView';
import { ExportCenterView } from './components/ExportCenterView';
import { INITIAL_CHECKLIST, INITIAL_CLAIMS } from './data/seedClaims';
import { ClaimRecord, ClaimStatus, LaunchChecklistItem } from './types/claim';
import { exportClaimsToCSV, generateNextClaimId } from './utils/exportClaims';

type WorkspaceView = 'ledger' | 'new-claim' | 'export-center' | 'receipt';

const CLAIMS_STORAGE_KEY = 'clearclaim_records_v1';
const CHECKLIST_STORAGE_KEY = 'clearclaim_checklist_v1';

function loadStoredClaims(): ClaimRecord[] {
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (!raw) return INITIAL_CLAIMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as ClaimRecord[];
    }
    return INITIAL_CLAIMS;
  } catch {
    return INITIAL_CLAIMS;
  }
}

function loadStoredChecklist(): LaunchChecklistItem[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return INITIAL_CHECKLIST;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as LaunchChecklistItem[];
    }
    return INITIAL_CHECKLIST;
  } catch {
    return INITIAL_CHECKLIST;
  }
}

export default function App() {
  const [claims, setClaims] = useState<ClaimRecord[]>(loadStoredClaims);
  const [checklist, setChecklist] = useState<LaunchChecklistItem[]>(loadStoredChecklist);
  const [activeView, setActiveView] = useState<WorkspaceView>('ledger');
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [receiptMode, setReceiptMode] = useState<'confirmation' | 'detail'>('detail');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
    } catch {
      // Fallback if large attachment exceeds localStorage quota: strip dataUrl only for storage
      try {
        const compact = claims.map((c) =>
          c.attachment ? { ...c, attachment: undefined } : c
        );
        localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(compact));
      } catch {
        // Ignore storage errors in private browsing contexts
      }
    }
  }, [claims]);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklist));
    } catch {
      // Ignore storage errors
    }
  }, [checklist]);

  const activeReceipt = activeReceiptId
    ? claims.find((c) => c.id === activeReceiptId) ?? null
    : null;

  const handleCreateClaim = (
    payload: Omit<ClaimRecord, 'id' | 'submittedAt' | 'status'>
  ): ClaimRecord => {
    const nextClaim: ClaimRecord = {
      ...payload,
      id: generateNextClaimId(claims),
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };
    setClaims((prev) => [nextClaim, ...prev]);
    setActiveReceiptId(nextClaim.id);
    setReceiptMode('confirmation');
    setActiveView('receipt');
    return nextClaim;
  };

  const handleStatusChange = (id: string, status: ClaimStatus) => {
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const handleDeleteClaim = (id: string) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
    if (activeReceiptId === id) {
      setActiveReceiptId(null);
      setActiveView('ledger');
    }
  };

  const handleInspectClaim = (claim: ClaimRecord) => {
    setActiveReceiptId(claim.id);
    setReceiptMode('detail');
    setActiveView('receipt');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const navigate = (view: WorkspaceView) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  const breadcrumbTitle = (() => {
    switch (activeView) {
      case 'ledger':
        return 'Claims Ledger';
      case 'new-claim':
        return 'New Claim Form';
      case 'export-center':
        return 'Export Center';
      case 'receipt':
        return activeReceipt ? `Receipt ${activeReceipt.id}` : 'Claim Receipt';
    }
  })();

  const pendingCount = claims.filter((c) => c.status === 'Pending').length;
  const completedChecks = checklist.filter((i) => i.completed).length;

  const navItems: {
    id: WorkspaceView;
    label: string;
    icon: typeof FileSpreadsheet;
    meta?: string;
  }[] = [
    {
      id: 'ledger',
      label: 'Claims Ledger',
      icon: FileSpreadsheet,
      meta: String(claims.length),
    },
    {
      id: 'new-claim',
      label: 'New Claim Form',
      icon: FilePlus2,
    },
    {
      id: 'export-center',
      label: 'Export Center',
      icon: PackageCheck,
      meta: `${completedChecks}/${checklist.length}`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="no-print fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Wordmark */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
            <button
              type="button"
              onClick={() => navigate('ledger')}
              className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              ClearClaim
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="p-4 space-y-1" aria-label="Workspace navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.id ||
                (activeView === 'receipt' && item.id === 'ledger');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.meta && (
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      {item.meta}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quiet Workspace Summary Footer */}
        <div className="p-5 border-t border-slate-200 space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Pending review</span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Export readiness</span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              {completedChecks} / {checklist.length}
            </span>
          </div>
        </div>
      </aside>

      {/* Right Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on left, max 2 actions on right */}
        <header className="no-print h-16 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-8 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <button
                type="button"
                onClick={() => navigate('ledger')}
                className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Workspace
              </button>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-slate-900 truncate">
                {breadcrumbTitle}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportClaimsToCSV(claims)}
              disabled={claims.length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('new-claim')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Claim</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto">
          {activeView === 'ledger' && (
            <ClaimsLedgerView
              claims={claims}
              onInspectClaim={handleInspectClaim}
              onStatusChange={handleStatusChange}
              onNewClaim={() => navigate('new-claim')}
            />
          )}

          {activeView === 'new-claim' && (
            <ClaimFormView onSubmitClaim={handleCreateClaim} />
          )}

          {activeView === 'export-center' && (
            <ExportCenterView
              claims={claims}
              checklist={checklist}
              onToggleChecklist={handleToggleChecklist}
            />
          )}

          {activeView === 'receipt' && activeReceipt && (
            <ClaimReceiptView
              claim={activeReceipt}
              mode={receiptMode}
              onBack={() => navigate('ledger')}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteClaim}
              onCreateAnother={() => navigate('new-claim')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
