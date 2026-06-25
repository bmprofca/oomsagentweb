import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { Briefcase, Eye, Edit2, Trash2, Plus, List, IndianRupee } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import ManagementCard from '../components/common/ManagementCard';
import ManagementGrid from '../components/common/ManagementGrid';
import ManagementFilters from '../components/common/ManagementFilters';
import Pagination, { usePagination } from '../components/common/PaginationComponent';

// ── Dummy Data ────────────────────────────────────────────────────────────────
const DUMMY_SERVICES = [
  { service_id: 's1', name: 'GST Registration', category: 'GST', price: 2999, status: 'active', description: 'Complete GST registration for new businesses' },
  { service_id: 's2', name: 'GST Return Filing', category: 'GST', price: 1499, status: 'active', description: 'Monthly/quarterly GST return filing' },
  { service_id: 's3', name: 'ITR Filing – Individual', category: 'Income Tax', price: 999, status: 'active', description: 'Income tax return for salaried individuals' },
  { service_id: 's4', name: 'ITR Filing – Business', category: 'Income Tax', price: 2499, status: 'active', description: 'ITR filing for proprietorship and partnerships' },
  { service_id: 's5', name: 'TDS Return', category: 'TDS', price: 1999, status: 'active', description: 'Quarterly TDS return filing (Form 24Q/26Q)' },
  { service_id: 's6', name: 'ROC Annual Filing', category: 'Company Law', price: 4999, status: 'active', description: 'Annual return filing with Registrar of Companies' },
  { service_id: 's7', name: 'Company Incorporation', category: 'Company Law', price: 7999, status: 'active', description: 'Private limited company registration' },
  { service_id: 's8', name: 'Statutory Audit', category: 'Audit', price: 14999, status: 'inactive', description: 'Mandatory audit for companies above threshold' },
  { service_id: 's9', name: 'Tax Audit', category: 'Audit', price: 9999, status: 'active', description: 'Tax audit under section 44AB' },
  { service_id: 's10', name: 'MSME Registration', category: 'Other', price: 1499, status: 'active', description: 'Udyam registration for MSMEs' },
];

const CATEGORY_OPTIONS = [
  { value: 'GST', label: 'GST' },
  { value: 'Income Tax', label: 'Income Tax' },
  { value: 'TDS', label: 'TDS' },
  { value: 'Company Law', label: 'Company Law' },
  { value: 'Audit', label: 'Audit' },
  { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const getCategoryColor = (cat) => {
  const map = {
    'GST': 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800',
    'Income Tax': 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800',
    'TDS': 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800',
    'Company Law': 'text-indigo-700 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800',
    'Audit': 'text-rose-700 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800',
  };
  return map[cat] || 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
};

const getStatusColor = (status) => {
  return status === 'active'
    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
    : 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Services() {
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
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  let activeTab = 'all';
  if (location.pathname.endsWith('/active')) activeTab = 'active';
  else if (location.pathname.endsWith('/inactive')) activeTab = 'inactive';

  const handleTabChange = (tabId) => {
    if (tabId === 'all') navigate('/services');
    else navigate(`/services/${tabId}`);
  };

  const tabs = [
    { id: 'all', label: 'All Services', icon: List },
    { id: 'active', label: 'Active', icon: Briefcase },
  ];

  // Simulate fetch with filtering
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...DUMMY_SERVICES];
      if (searchQuery) filtered = filtered.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()));
      if (categoryFilter) filtered = filtered.filter(s => s.category === categoryFilter.value);
      if (statusFilter) filtered = filtered.filter(s => s.status === statusFilter.value);
      if (activeTab === 'active') filtered = filtered.filter(s => s.status === 'active');
      updatePagination({ total: filtered.length });
      const start = (pagination.page - 1) * pagination.limit;
      setServices(filtered.slice(start, start + pagination.limit));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, searchQuery, categoryFilter, statusFilter, activeTab]);

  const tableColumns = [
    {
      key: 'name', label: 'Service Name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{row.description}</p>
        </div>
      )
    },
    {
      key: 'category', label: 'Category',
      render: (row) => (
        <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wide font-bold ${getCategoryColor(row.category)}`}>
          {row.category}
        </span>
      )
    },
    {
      key: 'price', label: 'Price',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
          <IndianRupee size={12} />{row.price.toLocaleString('en-IN')}
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
  ];

  const getRowActions = (row) => [
    { id: 'view', label: 'View', icon: <Eye size={14} />, color: 'green', onClick: () => navigate(`/service/${row.service_id}`) },
    { id: 'edit', label: 'Edit', icon: <Edit2 size={14} />, color: 'blue', onClick: () => {} },
    { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, color: 'red', onClick: () => {} },
  ];

  return (
    <ManagementHub
      title="Services"
      description="Manage all service offerings and their pricing."
      accent="blue"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 400); }}
      actions={
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus size={14} /> Add Service
        </button>
      }
    >
      <div className="mt-4 flex flex-col gap-2">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); goToPage(1); }}
          searchPlaceholder="Search services..."
          filters={[
            {
              value: categoryFilter,
              onChange: (val) => { setCategoryFilter(val); goToPage(1); },
              options: CATEGORY_OPTIONS,
              placeholder: 'Category',
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
          <PageContentSkeleton viewMode={viewMode} columns={4} rows={6} />
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-10 text-center flex flex-col items-center">
            <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No services found</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            columns={tableColumns}
            rows={services}
            rowKey="service_id"
            accent="blue"
            getActions={getRowActions}
            activeId={activeMenuId}
            onToggleAction={(e, id) => setActiveMenuId(id)}
            onRowClick={(row) => navigate(`/service/${row.service_id}`)}
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {services.map((svc) => (
              <ManagementCard
                key={svc.service_id}
                title={svc.name}
                subtitle={svc.description}
                accent="blue"
                icon={<Briefcase size={16} />}
                badge={
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${getCategoryColor(svc.category)}`}>
                    {svc.category}
                  </span>
                }
                actions={getRowActions(svc)}
                menuId={`menu-${svc.service_id}`}
                activeId={activeMenuId}
                onToggle={(e, id) => setActiveMenuId(id)}
                onClick={() => navigate(`/service/${svc.service_id}`)}
              >
                <div className="mt-3 flex justify-between items-center text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${getStatusColor(svc.status)}`}>
                    {svc.status}
                  </span>
                  <span className="font-bold flex items-center text-slate-700 dark:text-slate-200">
                    <IndianRupee size={10} className="mr-[1px]" />
                    {svc.price.toLocaleString('en-IN')}
                  </span>
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
