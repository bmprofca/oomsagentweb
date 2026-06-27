import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FileText, Eye, Plus, Search, Filter, Calendar, 
  CheckCircle, Clock, AlertCircle, XCircle, 
  User, Building2, Phone, Mail, ArrowUpRight, X,
  Loader2, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import CreateServiceRequestModal from '../components/CreateServiceRequestModal';

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending: { 
    label: 'Pending', 
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    icon: Clock
  },
  approved: { 
    label: 'Approved', 
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle
  },
  rejected: { 
    label: 'Rejected', 
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    icon: XCircle
  },
  'in-progress': { 
    label: 'In Progress', 
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    icon: AlertCircle
  },
  completed: { 
    label: 'Completed', 
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    icon: CheckCircle
  },
  cancelled: { 
    label: 'Cancelled', 
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    icon: XCircle
  },
};

const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return STATUS_MAP[key] || { 
    label: s || 'Unknown', 
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    icon: AlertCircle
  };
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
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
              {['Service', 'Client', 'Firm', 'Amount', 'Status', 'Created'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Pulse h="h-4" w={j === 0 ? 'w-36' : j === 5 ? 'w-20' : 'w-24'} rounded="rounded-full" />
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

// ── Service Request Card ─────────────────────────────────────────────────────
function ServiceRequestCard({ request, onClick }) {
  const { label, badge, icon: StatusIcon } = getStatus(request.status);
  
  return (
    <ManagementCard
      title={request.service_name || request.service_id || '—'}
      subtitle={
        <span className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <User size={11} />
          <span className="font-mono">{request.client_name || request.username}</span>
        </span>
      }
      icon={<FileText size={14} />}
      badge={
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm flex items-center gap-1 ${badge}`}>
          <StatusIcon size={10} />
          {label}
        </span>
      }
      onClick={onClick}
      accent="indigo"
      menuId={`request-${request.id}`}
      actions={[
        {
          id: 'view',
          label: 'View Details',
          icon: <Eye size={14} />,
          onClick,
        },
      ]}
      footer={
        <div className="flex items-end justify-between w-full">
          <div className="space-y-0.5">
            {request.firm_name && (
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 size={9} /> {request.firm_name}
              </p>
            )}
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">₹{request.amount || request.total_amount || 0}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">
            <Calendar size={12} />
            {request.create_date ? new Date(request.create_date).toLocaleDateString() : '—'}
          </div>
        </div>
      }
    >
      {request.remark && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-2 mt-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <FileText size={12} className="shrink-0 text-slate-400" />
          <span className="truncate font-medium">{request.remark}</span>
        </div>
      )}
    </ManagementCard>
  );
}


// ── Main Component ─────────────────────────────────────────────────────────────
export default function ServiceRequests() {
  const navigate = useNavigate();
  
  // Get logged-in agent username from context/auth
  const agentUsername = "abc123client456"; // This should come from auth context

  const [viewMode, setViewMode] = useState(() => window.innerWidth < 768 ? 'card' : 'table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [firmId, setFirmId] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        username: agentUsername,
        page_no: page,
        limit: limit,
      });
      
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (firmId) params.append('firm_id', firmId);
      
      const res = await apiCall(`/service/service-request/list?${params}`, 'GET');
      const data = await res.json();
      
      if (res.ok && data.success !== false) {
        setRequests(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setRequests([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load service requests');
      }
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast.error('Failed to load service requests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, firmId, agentUsername]);

  useEffect(() => {
    const t = setTimeout(fetchServiceRequests, 300);
    return () => clearTimeout(t);
  }, [fetchServiceRequests]);

  // Table columns configuration
  const tableColumns = [
    {
      key: 'service',
      label: 'Service',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">
            {row.service_name || row.service_id || '—'}
          </p>
          {row.remark && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
              {row.remark}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            {row.client_name || row.username || '—'}
          </p>
          {row.username && (
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {row.username}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'firm',
      label: 'Firm',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            {row.firm_name || '—'}
          </p>
          {row.firm_id && (
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {row.firm_id}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          ₹{row.amount || row.total_amount || 0}
        </span>
      ),
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
      },
    },
    {
      key: 'created',
      label: 'Created',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Calendar size={12} className="text-indigo-400" />
          {row.create_date ? new Date(row.create_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  const getTableActions = (row) => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: () => navigate(`/service-requests/${row.id}`),
    },
  ];

  return (
    <>
      <ManagementHub
        title="Service Requests"
        description="Manage and track all service requests from clients."
        accent="indigo"
        tabs={[
          { id: 'services', label: 'Services Directory', icon: Briefcase },
          { id: 'requests', label: 'Service Requests', icon: FileText }
        ]}
        activeTab="requests"
        onTabChange={(id) => {
          if (id === 'services') navigate('/services');
        }}
        onRefresh={fetchServiceRequests}
        refreshing={loading}
        refreshLabel="Refresh"
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1.5 md:px-4 md:py-2 text-[11px] md:text-sm font-semibold text-indigo-700 dark:text-indigo-400 shadow-sm transition-all duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:shadow-md"
          >
            <Plus size={13} />
            <span className="hidden md:inline whitespace-nowrap">New Request</span>
          </button>
        }
      >
        <div className="space-y-4">
          <ManagementFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchValue={search}
            onSearchChange={(val) => { setSearch(val); setPage(1); }}
            searchPlaceholder="Search by service, client, firm..."
            filters={[
              {
                options: STATUS_OPTIONS,
                value: STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0],
                onChange: (sel) => { setStatus(sel ? sel.value : ''); setPage(1); },
                placeholder: 'Filter Status',
                isClearable: false,
              },
            ]}
          />

          {loading ? (
            viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />
          ) : requests.length === 0 ? (
            <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                <FileText size={48} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">No service requests found</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">Try adjusting your search or filters</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={16} />
                Create New Request
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <ManagementTable
              rows={requests}
              columns={tableColumns}
              rowKey="id"
              getActions={getTableActions}
              onRowClick={(row) => navigate(`/service-requests/${row.id}`)}
              accent="indigo"
              showSerialNo={true}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {requests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onClick={() => navigate(`/service-requests/${request.id}`)}
                />
              ))}
            </div>
          )}

          <PaginationComponent
            currentPage={page}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      </ManagementHub>

      {/* Create Service Request Modal */}
      <CreateServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchServiceRequests}
        agentUsername={agentUsername}
      />
    </>
  );
}