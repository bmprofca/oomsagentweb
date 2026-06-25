import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { Users, Eye, Edit2, Phone, Mail, Plus, List, UserCheck, Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';

// ── Dummy Data ────────────────────────────────────────────────────────────────
const DUMMY_CLIENTS = [
  { client_id: 'c1', name: 'Rajesh Arora', email: 'rajesh@aroraent.in', phone: '9876543210', firm: { firm_id: 'f1', firm_name: 'Arora Enterprises' }, type: 'Business', status: 'active', tasks_count: 5 },
  { client_id: 'c2', name: 'Sunil Mehta', email: 'sunil@mehtaco.com', phone: '9123456789', firm: { firm_id: 'f2', firm_name: 'Mehta & Co.' }, type: 'Business', status: 'active', tasks_count: 3 },
  { client_id: 'c3', name: 'Priya Sharma', email: 'priya@sunrisepvt.com', phone: '9988776655', firm: { firm_id: 'f3', firm_name: 'Sunrise Pvt Ltd' }, type: 'Business', status: 'active', tasks_count: 7 },
  { client_id: 'c4', name: 'Amit Verma', email: 'amit.verma@gmail.com', phone: '9871234560', firm: null, type: 'Individual', status: 'active', tasks_count: 2 },
  { client_id: 'c5', name: 'Kavita Joshi', email: 'kavita@bluewave.io', phone: '9765432108', firm: { firm_id: 'f4', firm_name: 'Blue Wave Tech' }, type: 'Business', status: 'active', tasks_count: 4 },
  { client_id: 'c6', name: 'Rahul Singh', email: 'rahul.singh@gmail.com', phone: '9654321087', firm: null, type: 'Individual', status: 'inactive', tasks_count: 1 },
  { client_id: 'c7', name: 'Deepak Nair', email: 'deepak@globalexports.in', phone: '9543210976', firm: { firm_id: 'f5', firm_name: 'Global Exports' }, type: 'Business', status: 'active', tasks_count: 6 },
  { client_id: 'c8', name: 'Sneha Patel', email: 'sneha@horizonmfg.in', phone: '9432109865', firm: { firm_id: 'f6', firm_name: 'Horizon Manufacturing' }, type: 'Business', status: 'active', tasks_count: 8 },
];

const TYPE_OPTIONS = [
  { value: 'Business', label: 'Business' },
  { value: 'Individual', label: 'Individual' },
];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const getStatusColor = (status) =>
  status === 'active'
    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
    : 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';

const getTypeColor = (type) =>
  type === 'Business'
    ? 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
    : 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800';

// ── Component ─────────────────────────────────────────────────────────────────
export default function Clients() {
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
  const [statusFilter, setStatusFilter] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  let activeTab = 'all';
  if (location.pathname.endsWith('/business')) activeTab = 'business';
  else if (location.pathname.endsWith('/individual')) activeTab = 'individual';

  const handleTabChange = (tabId) => {
    if (tabId === 'all') navigate('/clients');
    else navigate(`/clients/${tabId}`);
  };

  const tabs = [
    { id: 'all', label: 'All Clients', icon: List },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'individual', label: 'Individual', icon: UserCheck },
  ];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...DUMMY_CLIENTS];
      if (searchQuery) {
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.firm?.firm_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (typeFilter) filtered = filtered.filter(c => c.type === typeFilter.value);
      if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter.value);
      if (activeTab === 'business') filtered = filtered.filter(c => c.type === 'Business');
      if (activeTab === 'individual') filtered = filtered.filter(c => c.type === 'Individual');
      updatePagination({ total: filtered.length });
      const start = (pagination.page - 1) * pagination.limit;
      setClients(filtered.slice(start, start + pagination.limit));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, typeFilter, statusFilter, activeTab]);

  const tableColumns = [
    {
      key: 'name', label: 'Client',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold text-xs flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'firm', label: 'Firm', render: (row) => <span>{row.firm?.firm_name || '—'}</span> },
    { key: 'phone', label: 'Phone', render: (row) => <span className="flex items-center gap-1"><Phone size={11} className="text-slate-400" />{row.phone}</span> },
    {
      key: 'type', label: 'Type',
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${getTypeColor(row.type)}`}>
          {row.type}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    { key: 'tasks_count', label: 'Tasks', render: (row) => <span className="font-semibold">{row.tasks_count}</span> },
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View Details', icon: <Eye size={14} />, color: 'green', onClick: () => navigate(`/client/${row.client_id}`) },
    { id: 'edit', label: 'Edit', icon: <Edit2 size={14} />, color: 'blue', onClick: () => {} },
  ];

  return (
    <ManagementHub
      title="Clients"
      description="Manage your client base and their associated firms."
      accent="purple"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 400); }}
      actions={
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus size={14} /> Add Client
        </button>
      }
    >
      <div className="mt-4 flex flex-col gap-2">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search clients..."
          filters={[
            {
              value: typeFilter,
              onChange: (val) => { setTypeFilter(val); goToPage(1); },
              options: TYPE_OPTIONS,
              placeholder: 'Type',
              isClearable: true,
            },
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
        ) : clients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No clients found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={clients}
            rowKey="client_id"
            accent="purple"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => navigate(`/client/${row.client_id}`)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {clients.map((client) => (
              <ManagementCard
                key={client.client_id}
                title={client.name}
                subtitle={client.firm?.firm_name || 'Individual'}
                accent="purple"
                icon={<Users size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${getTypeColor(client.type)}`}>
                    {client.type}
                  </span>
                }
                actions={getRowActions(client)}
                menuId={`menu-${client.client_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => navigate(`/client/${client.client_id}`)}
              >
                <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><Mail size={11} />{client.email}</span>
                  <span className="flex items-center gap-1.5"><Phone size={11} />{client.phone}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">{client.tasks_count} tasks</span>
                  </div>
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
