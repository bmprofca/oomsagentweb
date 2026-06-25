import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import {
  IndianRupee, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  List, Eye, Download
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';

// ── Dummy Data ────────────────────────────────────────────────────────────────
const DUMMY_LEDGER = [
  { ledger_id: 'l1', date: '15 Jun 2025', description: 'GST Return Filing – Arora Enterprises', type: 'credit', amount: 1499, firm: 'Arora Enterprises', task_id: 't2', balance: 48250 },
  { ledger_id: 'l2', date: '14 Jun 2025', description: 'Office Rent – June 2025', type: 'debit', amount: 15000, firm: null, task_id: null, balance: 46751 },
  { ledger_id: 'l3', date: '12 Jun 2025', description: 'ITR Filing – Amit Verma', type: 'credit', amount: 999, firm: 'Individual', task_id: 't3', balance: 61751 },
  { ledger_id: 'l4', date: '10 Jun 2025', description: 'Audit Report – Global Exports', type: 'credit', amount: 8500, firm: 'Global Exports', task_id: 't5', balance: 60752 },
  { ledger_id: 'l5', date: '08 Jun 2025', description: 'Software Subscription', type: 'debit', amount: 2999, firm: null, task_id: null, balance: 52252 },
  { ledger_id: 'l6', date: '05 Jun 2025', description: 'ROC Filing – Sunrise Pvt Ltd', type: 'credit', amount: 4999, firm: 'Sunrise Pvt Ltd', task_id: 't3', balance: 55251 },
  { ledger_id: 'l7', date: '03 Jun 2025', description: 'TDS Return – Blue Wave Tech', type: 'credit', amount: 1800, firm: 'Blue Wave Tech', task_id: 't4', balance: 50252 },
  { ledger_id: 'l8', date: '01 Jun 2025', description: 'Staff Salary – May 2025', type: 'debit', amount: 45000, firm: null, task_id: null, balance: 48452 },
  { ledger_id: 'l9', date: '28 May 2025', description: 'Company Incorporation – Mehta & Co.', type: 'credit', amount: 7999, firm: 'Mehta & Co.', task_id: 't6', balance: 93452 },
  { ledger_id: 'l10', date: '25 May 2025', description: 'GST Registration – Horizon Mfg.', type: 'credit', amount: 2999, firm: 'Horizon Manufacturing', task_id: 't7', balance: 85453 },
];

const DUMMY_SUMMARY = {
  totalCredit: 28795,
  totalDebit: 62999,
  openingBalance: 82454,
  closingBalance: 48250,
};

const TYPE_OPTIONS = [
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
];

const getTypeColor = (type) =>
  type === 'credit'
    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 border border-red-200 dark:border-red-800';

// ── Component ─────────────────────────────────────────────────────────────────
export default function Ledger() {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 10);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  let activeTab = 'all';
  if (location.pathname.endsWith('/credits')) activeTab = 'credits';
  else if (location.pathname.endsWith('/debits')) activeTab = 'debits';

  const handleTabChange = (tabId) => {
    if (tabId === 'all') navigate('/ledger');
    else navigate(`/ledger/${tabId}`);
  };

  const tabs = [
    { id: 'all', label: 'All Entries', icon: List },
    { id: 'credits', label: 'Credits', icon: TrendingUp },
    { id: 'debits', label: 'Debits', icon: TrendingDown },
  ];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...DUMMY_LEDGER];
      if (searchQuery) filtered = filtered.filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.firm?.toLowerCase().includes(searchQuery.toLowerCase()));
      if (typeFilter) filtered = filtered.filter(e => e.type === typeFilter.value);
      if (activeTab === 'credits') filtered = filtered.filter(e => e.type === 'credit');
      if (activeTab === 'debits') filtered = filtered.filter(e => e.type === 'debit');
      setSummary(DUMMY_SUMMARY);
      updatePagination({ total: filtered.length });
      const start = (pagination.page - 1) * pagination.limit;
      setEntries(filtered.slice(start, start + pagination.limit));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, typeFilter, activeTab]);

  const tableColumns = [
    { key: 'date', label: 'Date', render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.date}</span> },
    {
      key: 'description', label: 'Description',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.description}</p>
          {row.firm && <p className="text-xs text-slate-400 mt-0.5">{row.firm}</p>}
        </div>
      )
    },
    {
      key: 'type', label: 'Type',
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${getTypeColor(row.type)}`}>
          {row.type}
        </span>
      )
    },
    {
      key: 'amount', label: 'Amount',
      render: (row) => (
        <span className={`font-bold flex items-center gap-0.5 ${row.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.type === 'credit' ? '+' : '-'}<IndianRupee size={12} />{row.amount.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      key: 'balance', label: 'Balance',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
          <IndianRupee size={12} />{row.balance.toLocaleString('en-IN')}
        </span>
      )
    },
  ];

  const getRowActions = (row) => [
    ...(row.task_id ? [{ id: 'view', label: 'View Task', icon: <Eye size={14} />, color: 'green', onClick: () => navigate(`/task/${row.task_id}`) }] : []),
    { id: 'download', label: 'Download', icon: <Download size={14} />, color: 'blue', onClick: () => {} },
  ];

  return (
    <ManagementHub
      title="Ledger"
      description="Track all financial credits and debits in one place."
      accent="emerald"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 400); }}
      actions={
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Download size={14} /> Export
        </button>
      }
      summary={
        summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {[
              { label: 'Opening Balance', value: summary.openingBalance, icon: IndianRupee, color: 'text-slate-600 dark:text-slate-300' },
              { label: 'Total Credits', value: summary.totalCredit, icon: ArrowUpCircle, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Total Debits', value: summary.totalDebit, icon: ArrowDownCircle, color: 'text-red-600 dark:text-red-400' },
              { label: 'Closing Balance', value: summary.closingBalance, icon: IndianRupee, color: 'text-blue-600 dark:text-blue-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                <p className={`font-bold text-base flex items-center gap-0.5 ${color}`}>
                  <Icon size={14} />{value.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )
      }
    >
      <div className="mt-4 flex flex-col gap-2">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search entries..."
          filters={[
            {
              value: typeFilter,
              onChange: (val) => { setTypeFilter(val); goToPage(1); },
              options: TYPE_OPTIONS,
              placeholder: 'Type',
              isClearable: true,
            },
          ]}
        />

        {isLoading ? (
          <PageContentSkeleton viewMode={viewMode} columns={5} rows={6} />
        ) : entries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
            <IndianRupee className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No ledger entries found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={entries}
            rowKey="ledger_id"
            accent="emerald"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={() => {}}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {entries.map((entry) => (
              <ManagementCard
                key={entry.ledger_id}
                title={entry.description}
                subtitle={entry.firm || entry.date}
                accent="emerald"
                icon={entry.type === 'credit' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${getTypeColor(entry.type)}`}>
                    {entry.type}
                  </span>
                }
                actions={getRowActions(entry)}
                menuId={`menu-${entry.ledger_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => {}}
              >
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className="text-slate-400">{entry.date}</span>
                  <span className={`font-bold flex items-center gap-0.5 ${entry.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {entry.type === 'credit' ? '+' : '-'}<IndianRupee size={10} />{entry.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-1 text-xs text-right text-slate-500 dark:text-slate-400 flex items-center justify-end gap-0.5">
                  Bal: <IndianRupee size={10} />{entry.balance.toLocaleString('en-IN')}
                </div>
              </ManagementCard>
            ))}
          </ManagementGrid>
        )}

        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      </div>
    </ManagementHub>
  );
}
