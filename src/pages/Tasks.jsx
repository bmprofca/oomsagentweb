import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Clock, Eye, List, Activity, Search,
  CheckCircle, IndianRupee, User, Building2,
  LayoutGrid, Table2, RefreshCw, SlidersHorizontal,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import PaginationComponent from '../components/common/PaginationComponent';

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'in process': { label: 'In Process', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
  'complete': { label: 'Complete', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  'completed': { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  'pending from department': { label: 'Dept. Pending', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800' },
  'pending from client': { label: 'Client Pending', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  'pending': { label: 'Pending', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  'uploaded': { label: 'Uploaded', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800' },
  'cancel': { label: 'Cancelled', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' },
};

const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return STATUS_MAP[key] || { label: s || 'Unknown', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' };
};

const FIRM_TYPE_BADGE = {
  llp: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  proprietorship: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  partnership: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'private limited': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
};
const getFirmBadge = (t) => FIRM_TYPE_BADGE[(t || '').toLowerCase()] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Status filter options ─────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'in process', label: 'In Process' },
  { value: 'pending from department', label: 'Dept. Pending' },
  { value: 'pending from client', label: 'Client Pending' },
  { value: 'complete', label: 'Complete' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'cancel', label: 'Cancelled' },
];

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all', label: 'All Tasks', icon: List },
  { id: 'ongoing', label: 'Ongoing', icon: Activity },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/40">
              {['Service / Client', 'Firm', 'Charges', 'Status', 'Due Date'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Pulse h="h-4" w={j === 0 ? 'w-36' : j === 4 ? 'w-20' : 'w-24'} rounded="rounded-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 flex flex-col gap-4 shadow-sm">
          <Pulse h="h-5" w="w-3/4" rounded="rounded-full" />
          <Pulse h="h-4" w="w-1/2" rounded="rounded-full" />
          <div className="flex justify-between mt-2">
            <Pulse h="h-6" w="w-24" rounded="rounded-full" />
            <Pulse h="h-4" w="w-16" rounded="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Task Card (card view) ─────────────────────────────────────────────────────
function TaskCard({ task, onClick }) {
  const { label, badge } = getStatus(task.status);
  const { fees = 0, gst_value = 0, total = 0 } = task.charges || {};
  return (
    <ManagementCard
      title={task.service?.name || '—'}
      subtitle={
        <span className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <User size={10} className="shrink-0" />
          <span className="truncate">{task.client?.name || '—'}</span>
        </span>
      }
      icon={<Activity size={14} />}
      badge={
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm ${badge}`}>
          {label}
        </span>
      }
      onClick={onClick}
      accent="amber"
      menuId={`task-${task.task_id}`}
      actions={[
        {
          id: 'view',
          label: 'View Details',
          icon: <Eye size={14} />,
          onClick: onClick
        }
      ]}
      footer={
        <div className="flex items-end justify-between w-full">
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-0.5 tracking-tight">
              <IndianRupee size={12} className="text-slate-400" />{fmt(total)}
            </p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">₹{fmt(fees)} + GST ₹{fmt(gst_value)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">
            <Clock size={12} className={task.dates?.due_date ? 'text-amber-500' : ''} />
            {task.dates?.due_date || '—'}
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-2 mt-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
        <Building2 size={12} className="shrink-0 text-slate-400" />
        <span className="truncate font-semibold">{task.firm?.firm_name || '—'}</span>
        {task.firm?.firm_type && (
          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${getFirmBadge(task.firm.firm_type)}`}>
            {task.firm.firm_type}
          </span>
        )}
      </div>
    </ManagementCard>
  );
}


export default function Task() {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState(() => window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Tab from URL
  let activeTab = 'all';
  if (location.pathname.endsWith('/ongoing')) activeTab = 'ongoing';
  else if (location.pathname.endsWith('/completed')) activeTab = 'completed';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  // Sync status filter when tab changes
  useEffect(() => {
    if (activeTab === 'ongoing') setStatus('in process');
    else if (activeTab === 'completed') setStatus('complete');
    else setStatus('');
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page_no: page,
        limit,
        status,
        search,
      });
      const res = await apiCall(`/task/list?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setTasks(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setTasks([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load tasks');
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const handleTab = (id) => {
    if (id === 'all') navigate('/task');
    else if (id === 'ongoing') navigate('/task/ongoing');
    else if (id === 'completed') navigate('/task/completed');
  };

  const statusOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }));

  const tableColumns = [
    {
      key: 'service',
      label: 'Service / Client',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.service?.name || '—'}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <User size={12} className="text-slate-400" /> {row.client?.name || '—'}
            {row.client?.mobile && <><span className="text-slate-300 dark:text-slate-600">·</span> {row.client.mobile}</>}
          </p>
        </div>
      )
    },
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug flex items-center gap-1.5">
            <Building2 size={12} className="text-slate-400" /> {row.firm?.firm_name || '—'}
          </p>
          {row.firm?.firm_type && (
            <span className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-widest ${getFirmBadge(row.firm.firm_type)}`}>
              {row.firm.firm_type}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'charges',
      label: 'Charges',
      render: (row) => {
        const { fees = 0, gst_value = 0, total: tot = 0 } = row.charges || {};
        return (
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5 text-sm">
              <IndianRupee size={12} className="text-slate-400" />{fmt(tot)}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              ₹{fmt(fees)} + GST ₹{fmt(gst_value)}
            </p>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const { label, badge } = getStatus(row.status);
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap shadow-sm ${badge}`}>
            {label}
          </span>
        );
      }
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Clock size={12} className={row.dates?.due_date ? 'text-amber-500' : ''} /> {row.dates?.due_date || '—'}
        </span>
      )
    }
  ];

  const getTableActions = (row) => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: () => setSelectedTask(row)
    }
  ];

  return (
    <ManagementHub
      title="Tasks"
      description="Track and manage all client task assignments."
      accent="amber"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTab}
      onRefresh={fetchTasks}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="space-y-4">
        {/* Filters */}
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder="Search service, client, firm…"
          filters={[
            {
              options: statusOptions,
              value: statusOptions.find(o => o.value === status) || statusOptions[0],
              onChange: (selected) => { setStatus(selected ? selected.value : ''); setPage(1); },
              placeholder: 'Filter Status',
              isClearable: false
            }
          ]}
        />



        {/* Content */}
        {loading ? (
          viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />
        ) : tasks.length === 0 ? (
          <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <CheckSquare size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">No tasks found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          /* ── Table view ── */
          <ManagementTable
            rows={tasks}
            columns={tableColumns}
            rowKey="task_id"
            getActions={getTableActions}
            onRowClick={(row) => setSelectedTask(row)}
            accent="amber"
            showSerialNo={true}
          />
        ) : (
          /* ── Card view ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.task_id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <PaginationComponent
          currentPage={page}
          totalItems={total}
          itemsPerPage={limit}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task Details`}
          icon={List}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {selectedTask.service?.name || '—'}
                </h3>
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${getStatus(selectedTask.status).badge}`}>
                  {getStatus(selectedTask.status).label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Client Info</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {selectedTask.client?.name || '—'}
                </p>
                {selectedTask.client?.mobile && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 ml-6">{selectedTask.client.mobile}</p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Firm Details</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  {selectedTask.firm?.firm_name || '—'}
                </p>
                {selectedTask.firm?.firm_type && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 ml-6 uppercase font-bold tracking-widest">{selectedTask.firm.firm_type}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Financials</p>
                <p className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-1">
                  <IndianRupee size={16} className="text-slate-400" />
                  {fmt(selectedTask.charges?.total)}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Fees: ₹{fmt(selectedTask.charges?.fees)} | GST: ₹{fmt(selectedTask.charges?.gst_value)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Timeline</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Clock size={14} className={selectedTask.dates?.due_date ? 'text-amber-500' : 'text-slate-400'} />
                  {selectedTask.dates?.due_date || 'No due date'}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 ml-6">
                  Created: {selectedTask.dates?.created_at || '—'}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </ManagementHub>
  );
}