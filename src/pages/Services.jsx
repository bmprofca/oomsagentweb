import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, CheckSquare, Eye, IndianRupee, Layers, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementFilters from '../components/common/ManagementFilters';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import Modal from '../components/common/Modal';
import PaginationComponent from '../components/common/PaginationComponent';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'general', label: 'General' },
];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

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
              {['Service ID / Name', 'Type', 'SAC Code', 'Charges'].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-700/40">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Pulse h="h-4" w={j === 0 ? 'w-36' : j === 3 ? 'w-20' : 'w-24'} rounded="rounded-full" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

function ServiceCard({ service, onClick }) {
  const { fees = 0, gst_value = 0, total = 0 } = service.charges || {};
  return (
    <ManagementCard
      title={service.name || '—'}
      subtitle={
        <span className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <Layers size={10} className="shrink-0" />
          <span className="truncate">{service.service_id || '—'}</span>
        </span>
      }
      icon={<Briefcase size={14} />}
      badge={
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 shadow-sm bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {service.type || 'General'}
        </span>
      }
      onClick={onClick}
      accent="blue"
      menuId={`service-${service.service_id}`}
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
          {service.sac_code && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">
              SAC: {service.sac_code}
            </div>
          )}
        </div>
      }
    />
  );
}

export default function Services() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState(() => window.innerWidth < 768 ? 'card' : 'table');
  useEffect(() => {
    const h = () => setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page_no: page,
        limit,
        search,
        type,
      });
      const res = await apiCall(`/service/list?${qs}`, 'GET');
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setServices(data.data || []);
        setTotal(data.pagination?.total ?? 0);
      } else {
        setServices([]);
        setTotal(0);
        toast.error(data.message || 'Failed to load services');
      }
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, type]);

  useEffect(() => {
    const t = setTimeout(fetchServices, 300);
    return () => clearTimeout(t);
  }, [fetchServices]);

  const typeOptions = TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }));

  const tableColumns = [
    {
      key: 'service',
      label: 'Service ID / Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white leading-snug">{row.name || '—'}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Layers size={12} className="text-slate-400" /> {row.service_id || '—'}
          </p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold whitespace-nowrap shadow-sm bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {row.type || '—'}
        </span>
      )
    },
    {
      key: 'sac_code',
      label: 'SAC Code',
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {row.sac_code || '—'}
        </span>
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
    }
  ];

  const getTableActions = (row) => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: () => setSelectedService(row)
    }
  ];

  return (
    <ManagementHub
      title="Services"
      description="Manage all your firm's services, fees, and SAC codes."
      accent="blue"
      tabs={[
        { id: 'services', label: 'Services Directory', icon: Briefcase },
        { id: 'requests', label: 'Service Requests', icon: FileText }
      ]}
      activeTab="services"
      onTabChange={(id) => {
        if (id === 'requests') navigate('/service-requests');
      }}
      onRefresh={fetchServices}
      refreshing={loading}
      refreshLabel="Refresh"
    >
      <div className="space-y-4">
        <ManagementFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchValue={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder="Search services..."
          filters={[
            {
              options: typeOptions,
              value: typeOptions.find(o => o.value === type) || typeOptions[0],
              onChange: (selected) => { setType(selected ? selected.value : ''); setPage(1); },
              placeholder: 'Filter Type',
              isClearable: false
            }
          ]}
        />

        {loading ? (
          viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />
        ) : services.length === 0 ? (
          <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
              <CheckSquare size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-bold">No services found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm font-medium">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={services}
            columns={tableColumns}
            rowKey="service_id"
            getActions={getTableActions}
            onRowClick={(row) => setSelectedService(row)}
            accent="blue"
            showSerialNo={true}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {services.map((service) => (
              <ServiceCard
                key={service.service_id}
                service={service}
                onClick={() => setSelectedService(service)}
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

      {selectedService && (
        <Modal
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
          title={`Service Details`}
          icon={Briefcase}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {selectedService.name || '—'}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {selectedService.type || 'General'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Service Info</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Layers size={14} className="text-slate-400" />
                  ID: {selectedService.service_id || '—'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">SAC Code: {selectedService.sac_code || '—'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Financials</p>
                <p className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-1">
                  <IndianRupee size={16} className="text-slate-400" />
                  {fmt(selectedService.charges?.total)}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Fees: ₹{fmt(selectedService.charges?.fees)} | GST Rate: {selectedService.charges?.gst_rate}% | GST: ₹{fmt(selectedService.charges?.gst_value)}
                </p>
              </div>
            </div>

            {selectedService.margin && (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-sm border border-slate-100 dark:border-slate-700/50 w-full mt-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Margin Details</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-base">
                  <IndianRupee size={14} className="text-slate-400" /> {fmt(selectedService.margin.amount)} ({selectedService.margin.margin_value}{selectedService.margin.margin_type === 'percentage' ? '%' : ''})
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 capitalize font-medium">Source: {selectedService.margin.source}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </ManagementHub>
  );
}
