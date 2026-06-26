import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import {
  CheckSquare, Clock, Eye, List, Activity,
  CheckCircle, IndianRupee, User, Building2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── Status helpers ─────────────────────────────────────────────────────────────
// Covers every status value the API currently returns:
//   "in process" | "complete" | "pending from department" | "uploaded" | unknown
const STATUS_MAP = {
  'in process':              { label: 'In Process',  color: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' },
  'complete':                { label: 'Complete',    color: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800' },
  'completed':               { label: 'Completed',   color: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800' },
  'pending from department': { label: 'Pending',     color: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' },
  'pending':                 { label: 'Pending',     color: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' },
  'uploaded':                { label: 'Uploaded',    color: 'text-violet-700 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800' },
};

const getStatusMeta = (status) => {
  const key = (status || '').toLowerCase().trim();
  return STATUS_MAP[key] || { label: status || 'Unknown', color: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' };
};

// ── Firm-type badge ────────────────────────────────────────────────────────────
const FIRM_TYPE_COLOR = {
  llp:             'text-indigo-700 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800',
  proprietorship:  'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800',
  partnership:     'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800',
  'private limited': 'text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800',
};

const getFirmTypeColor = (type) =>
  FIRM_TYPE_COLOR[(type || '').toLowerCase()] ||
  'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';

// ── Currency formatter ─────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Status filter options (aligned with API values) ────────────────────────────
const STATUS_OPTIONS = [
  { value: 'in process',              label: 'In Process' },
  { value: 'pending from department', label: 'Pending' },
  { value: 'complete',               label: 'Complete' },
  { value: 'uploaded',               label: 'Uploaded' },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function Task() {
  const location = useLocation();
  const navigate  = useNavigate();

  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const { pagination, updatePagination, changeLimit, goToPage } = usePagination(1, 20);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [tasks,        setTasks]        = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);

  // ── Tab routing ──────────────────────────────────────────────────────────────
  let activeTab = 'all';
  if (location.pathname.endsWith('/ongoing'))   activeTab = 'ongoing';
  else if (location.pathname.endsWith('/completed')) activeTab = 'completed';

  useEffect(() => {
    if (activeTab === 'ongoing') {
      setStatusFilter({ value: 'in process', label: 'In Process' });
    } else if (activeTab === 'completed') {
      setStatusFilter({ value: 'complete', label: 'Complete' });
    } else {
      setStatusFilter(null);
    }
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    if (tabId === 'all')       navigate('/tasks');
    else if (tabId === 'ongoing')   navigate('/tasks/ongoing');
    else if (tabId === 'completed') navigate('/tasks/completed');
  };

  const tabs = [
    { id: 'all',       label: 'All Tasks',       icon: List },
    { id: 'ongoing',   label: 'Ongoing',         icon: Activity },
    { id: 'completed', label: 'Completed',       icon: CheckCircle },
  ];

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const statusValue = statusFilter ? statusFilter.value : '';
      const endpoint =
        `/task/list?page_no=${pagination.page}&limit=${pagination.limit}` +
        `&status=${encodeURIComponent(statusValue)}&search=${encodeURIComponent(searchQuery)}`;

      const response = await apiCall(endpoint, 'GET');
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setTasks(data.data || []);
        if (data.pagination) updatePagination({ total: data.pagination.total });
      } else {
        setTasks([]);
        updatePagination({ total: 0 });
        toast.error(data.message || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  // ── Table columns ────────────────────────────────────────────────────────────
  const tableColumns = [
    {
      key: 'service',
      label: 'Service',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white leading-snug">
            {row.service?.name || '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <User size={10} />
            {row.client?.name || '—'}
            <span className="text-slate-300 dark:text-slate-600">·</span>
            {row.client?.mobile || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
            {row.firm?.firm_name || '—'}
          </p>
          {row.firm?.firm_type && (
            <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${getFirmTypeColor(row.firm.firm_type)}`}>
              {row.firm.firm_type}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'charges',
      label: 'Charges',
      render: (row) => {
        const { fees = 0, gst_value = 0, total = 0 } = row.charges || {};
        return (
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-0.5 text-sm">
              <IndianRupee size={12} />{fmt(total)}
            </p>
            <p className="text-slate-400">
              Fees <span className="text-slate-500 dark:text-slate-400">₹{fmt(fees)}</span>
              {' + '}GST <span className="text-slate-500 dark:text-slate-400">₹{fmt(gst_value)}</span>
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const { label, color } = getStatusMeta(row.status);
        return (
          <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${color}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (row) => (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
          <Clock size={11} />
          {row.dates?.due_date || '—'}
        </span>
      ),
    },
  ];

  // ── Row actions ──────────────────────────────────────────────────────────────
  const getRowActions = (row) => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye size={14} />,
      color: 'green',
      onClick: () => navigate(`/task/${row.task_id}`),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ManagementHub
      title="Tasks"
      description="Track and manage all client task assignments and deadlines."
      accent="amber"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={fetchTasks}
      actions={null}
    >
      <div className="mt-4 flex flex-col gap-2">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search by service, client, or firm…"
          filters={[
            {
              value: statusFilter,
              onChange: (val) => { setStatusFilter(val); goToPage(1); },
              options: STATUS_OPTIONS,
              placeholder: 'Status',
              isClearable: true,
            },
          ]}
        />

        {isLoading ? (
          <PageContentSkeleton viewMode={viewMode} columns={5} rows={6} />
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center gap-2">
            <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No tasks found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={tasks}
            rowKey="task_id"
            accent="amber"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => navigate(`/task/${row.task_id}`)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {tasks.map((task) => {
              const { label, color } = getStatusMeta(task.status);
              const { fees = 0, gst_value = 0, total = 0 } = task.charges || {};
              return (
                <ManagementCard
                  key={task.task_id}
                  title={task.service?.name || '—'}
                  subtitle={
                    <span className="flex items-center gap-1">
                      <Building2 size={11} className="shrink-0" />
                      {task.firm?.firm_name || '—'}
                    </span>
                  }
                  accent="amber"
                  icon={<CheckSquare size={16} />}
                  badge={
                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold whitespace-nowrap ${color}`}>
                      {label}
                    </span>
                  }
                  actions={getRowActions(task)}
                  menuId={`menu-${task.task_id}`}
                  activeId={activeMenuId}
                  onToggle={(e, id) => setActiveMenuId(id)}
                  onClick={() => navigate(`/task/${task.task_id}`)}
                >
                  {/* Client row */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <User size={11} className="shrink-0" />
                    <span>{task.client?.name || '—'}</span>
                    {task.firm?.firm_type && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${getFirmTypeColor(task.firm.firm_type)}`}>
                          {task.firm.firm_type}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Charges + due date row */}
                  <div className="mt-2.5 flex justify-between items-end text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5 text-sm">
                        <IndianRupee size={11} />{fmt(total)}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        ₹{fmt(fees)} + GST ₹{fmt(gst_value)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock size={11} />
                      <span>{task.dates?.due_date || '—'}</span>
                    </div>
                  </div>
                </ManagementCard>
              );
            })}
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