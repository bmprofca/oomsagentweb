import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Eye, User, Building2, Phone, Mail,
  Activity, CheckCircle, Clock, List,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active:         { label: 'Active',        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
  inactive:       { label: 'Inactive',      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' },
  'under review': { label: 'Under Review',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  suspended:      { label: 'Suspended',     badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' },
};

const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return STATUS_MAP[key] || { label: s || 'Unknown', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700' };
};

const GENDER_BADGE = {
  male:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  female: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
  other:  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
};
const getGenderBadge = (g) => GENDER_BADGE[(g || '').toLowerCase()] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

const STATUS_OPTIONS = [
  { value: '',              label: 'All Status' },
  { value: 'active',        label: 'Active' },
  { value: 'under review',  label: 'Under Review' },
  { value: 'inactive',      label: 'Inactive' },
  { value: 'suspended',     label: 'Suspended' },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/40">
              {['Client', 'PAN', 'Contact', 'Address', 'Status', 'Joined'].map((h) => (
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
        <div key={i} className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 flex flex-col gap-4 shadow-sm">
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

// ── Client Card ───────────────────────────────────────────────────────────────
function ClientCard({ client, onClick }) {
  const { label, badge } = getStatus(client.status);
  const address = [client.village_town, client.district, client.state].filter(Boolean).join(', ');
  return (
    <ManagementCard
      title={client.name || '—'}
      subtitle={
        <span className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="font-mono">{client.pan_number || '—'}</span>
          {client.gender && (
            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${getGenderBadge(client.gender)}`}>
              {client.gender}
            </span>
          )}
        </span>
      }
      icon={<User size={14} />}
      badge={
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm ${badge}`}>
          {label}
        </span>
      }
      onClick={onClick}
      accent="sky"
      menuId={`client-${client.username}`}
      actions={[
        {
          id: 'view',
          label: 'View Profile',
          icon: <Eye size={14} />,
          onClick,
        },
      ]}
      footer={
        <div className="flex items-end justify-between w-full">
          <div className="space-y-0.5">
            {client.mobile && (
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone size={9} /> +{client.country_code || '91'} {client.mobile}
              </p>
            )}
            {client.email && (
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail size={9} /> {client.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">
            <Clock size={12} />
            {client.create_date ? client.create_date.slice(0, 10) : '—'}
          </div>
        </div>
      }
    >
      {address && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-2 mt-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <Building2 size={12} className="shrink-0 text-slate-400" />
          <span className="truncate font-semibold">{address}</span>
        </div>
      )}
    </ManagementCard>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Clients() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState(() => window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page_no: page, limit, search, status });
      const res  = await apiCall(`/client/list?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setClients(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setClients([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load clients');
      }
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    const t = setTimeout(fetchClients, 300);
    return () => clearTimeout(t);
  }, [fetchClients]);

  const tableColumns = [
    {
      key: 'name',
      label: 'Client',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
            {row.image
              ? <img src={row.image} alt="" className="w-8 h-8 rounded-full object-cover" />
              : <User size={14} className="text-sky-600 dark:text-sky-400" />}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.name || '—'}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {row.care_of} {row.guardian_name}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'pan',
      label: 'PAN',
      render: (row) => (
        <div>
          <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs tracking-wider">{row.pan_number || '—'}</p>
          {row.gender && (
            <span className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${getGenderBadge(row.gender)}`}>
              {row.gender}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row) => (
        <div className="space-y-1">
          {row.mobile && (
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone size={11} className="text-slate-400" />
              +{row.country_code || '91'} {row.mobile}
            </p>
          )}
          {row.email && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail size={11} className="text-slate-400" />
              {row.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {[row.village_town, row.district].filter(Boolean).join(', ')}
          </p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {row.state}{row.pincode ? ` – ${row.pincode}` : ''}
          </p>
        </div>
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
      key: 'joined',
      label: 'Joined',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Clock size={12} className="text-sky-400" />
          {row.create_date ? row.create_date.slice(0, 10) : '—'}
        </span>
      ),
    },
  ];

  const getTableActions = (row) => [
    {
      id: 'view',
      label: 'View Profile',
      icon: <Eye size={14} />,
      onClick: () => navigate(`/clients/${row.username}`),
    },
  ];

  return (
    <ManagementHub
      title="Clients"
      description="Manage and view all registered client profiles."
      accent="sky"
      onRefresh={fetchClients}
      refreshing={loading}
      refreshLabel="Refresh"
      headerActions={
        <button
          onClick={() => navigate('/clients/create')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-bold transition-colors shadow-sm"
        >
          <User size={14} />
          Add Client
        </button>
      }
    >
      <div className="space-y-4">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder="Search name, PAN, mobile…"
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
        ) : clients.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <Users size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">No clients found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={clients}
            columns={tableColumns}
            rowKey="username"
            getActions={getTableActions}
            onRowClick={(row) => navigate(`/clients/${row.username}`)}
            accent="sky"
            showSerialNo={true}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clients.map((client) => (
              <ClientCard
                key={client.username}
                client={client}
                onClick={() => navigate(`/clients/${client.username}`)}
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
  );
}
