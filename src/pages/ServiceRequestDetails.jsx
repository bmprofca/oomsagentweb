import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, CheckCircle, Clock, AlertCircle, XCircle,
  User, Building2, Calendar, RefreshCw, Briefcase,
  Hash, ClipboardList, Receipt, ChevronLeft
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── Status helpers (mirrors ServiceRequests.jsx) ──────────────────────────────
const STATUS_MAP = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    bar: 'bg-amber-400',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-400',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    bar: 'bg-rose-400',
    icon: XCircle,
  },
  'in-progress': {
    label: 'In Progress',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    bar: 'bg-blue-400',
    icon: AlertCircle,
  },
  completed: {
    label: 'Completed',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    bar: 'bg-purple-400',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    bar: 'bg-slate-400',
    icon: XCircle,
  },
};

const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return (
    STATUS_MAP[key] || {
      label: s || 'Unknown',
      badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
      bar: 'bg-slate-400',
      icon: AlertCircle,
    }
  );
};

// ── Currency formatter ────────────────────────────────────────────────────────
const formatINR = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Pulse skeleton ────────────────────────────────────────────────────────────
function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return (
    <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
    emerald: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    amber: 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    rose: 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    violet: 'text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40',
  };
  return (
    <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/40">
        <span className={`p-1.5 rounded-md ${accentMap[accent]}`}>
          <Icon size={13} />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false, className = '' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100/60 dark:border-slate-700/40 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-xs font-semibold text-slate-800 dark:text-slate-200 text-right ${mono ? 'font-mono' : ''} ${className}`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

// ── Stat tile (for charges) ───────────────────────────────────────────────────
function StatTile({ label, value, sub, accent = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-indigo-900/20 border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300',
    emerald: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-300',
    violet: 'from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20 border-violet-200/60 dark:border-violet-800/40 text-violet-700 dark:text-violet-300',
  };
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-sm border bg-gradient-to-br p-4 ${colors[accent]}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
      <span className="text-xl font-black tracking-tight">{value}</span>
      {sub && <span className="text-[10px] font-semibold opacity-50 mt-0.5">{sub}</span>}
    </div>
  );
}

// ── Skeleton for details page ─────────────────────────────────────────────────
function DetailsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-5 flex items-center gap-4">
        <Pulse h="h-12" w="w-12" rounded="rounded-md" />
        <div className="flex-1 space-y-2">
          <Pulse h="h-5" w="w-48" rounded="rounded-full" />
          <Pulse h="h-3.5" w="w-32" rounded="rounded-full" />
        </div>
        <Pulse h="h-7" w="w-20" rounded="rounded-full" />
      </div>
      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 p-5 space-y-3"
          >
            <Pulse h="h-4" w="w-32" rounded="rounded-full" />
            {[...Array(4)].map((_, j) => (
              <Pulse key={j} h="h-3" w={j % 2 === 0 ? 'w-full' : 'w-3/4'} rounded="rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ServiceRequestDetails() {
  const { request_id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetails = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await apiCall(`/service/service-request/details/${request_id}`, 'GET');
        const json = await res.json();

        if (res.ok && json?.success !== false) {
          setData(json.data);
        } else {
          toast.error(json?.message || 'Failed to load request details');
        }
      } catch (err) {
        console.error('Error fetching service request details:', err);
        toast.error('Failed to load request details');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [request_id]
  );

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/80 dark:bg-slate-900/80 p-4 md:p-6 lg:p-8">
        <DetailsSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50/80 dark:bg-slate-900/80 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full inline-flex">
            <FileText size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-bold">Request not found</p>
          <button
            onClick={() => navigate('/service-requests')}
            className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  const { label, badge, bar, icon: StatusIcon } = getStatus(data.status);

  const fmt = (dt) =>
    dt
      ? new Date(dt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <div>
      <div className="mx-auto space-y-2">

        {/* ── Back link row (mirrors ClientProfile) ────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/service-requests')}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ChevronLeft size={16} /> Service Requests
          </button>

          <button
            onClick={() => fetchDetails(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* ── Hero card (mirrors ClientProfile) ────────────────────────────── */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6">
          <div className="flex items-start gap-5">
            {/* icon avatar */}
            <div className="shrink-0 w-20 h-20 rounded-sm bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
              <FileText size={32} className="text-indigo-600 dark:text-indigo-400" />
            </div>

            {/* title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {data.service?.name || 'Service Request'}
                  </h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {data.firm?.firm_name || '—'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${badge}`}
                >
                  <StatusIcon size={11} />
                  {label}
                </span>
              </div>

              {/* pills row */}
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  ID: {data.request_id?.slice(0, 16)}…
                </span>
                {data.service?.service_id && (
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    SVC: {data.service.service_id.slice(0, 12)}…
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Clock size={12} className="text-indigo-400" />
                  {data.create_date ? new Date(data.create_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Charges tiles ─────────────────────────────────────────────────── */}
        {data.charges && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              label="Base Fees"
              value={`₹${formatINR(data.charges.fees)}`}
              accent="indigo"
            />
            <StatTile
              label="Tax"
              value={`₹${formatINR(data.charges.tax_value)}`}
              sub={`@ ${data.charges.tax_rate}%`}
              accent="amber"
            />
            <StatTile
              label="Total Amount"
              value={`₹${formatINR(data.charges.amount)}`}
              accent="emerald"
            />
            {data.margin && (
              <StatTile
                label="Margin"
                value={`₹${formatINR(data.margin.amount)}`}
                sub={
                  data.margin.margin_type === 'percentage'
                    ? `${data.margin.margin_value}% ${data.margin.margin_type}`
                    : `${data.margin.margin_type}`
                }
                accent="violet"
              />
            )}
          </div>
        )}

        {/* ── Detail sections grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Client */}
          <Section title="Client" icon={User} accent="indigo">
            <DetailRow label="Name" value={data.client?.name} />
            <DetailRow
              label="Username"
              value={data.client?.username}
              mono
              className="text-indigo-600 dark:text-indigo-400"
            />
            <DetailRow label="Email" value={data.client?.email} />
            <DetailRow label="Mobile" value={data.client?.mobile} />
          </Section>

          {/* Firm */}
          <Section title="Firm" icon={Building2} accent="amber">
            <DetailRow label="Firm Name" value={data.firm?.firm_name} />
            <DetailRow
              label="Firm ID"
              value={data.firm?.firm_id}
              mono
              className="text-amber-600 dark:text-amber-400"
            />
            <DetailRow
              label="Type"
              value={
                data.firm?.firm_type
                  ? data.firm.firm_type.charAt(0).toUpperCase() + data.firm.firm_type.slice(1)
                  : null
              }
            />
          </Section>

          {/* Service */}
          <Section title="Service" icon={Briefcase} accent="violet">
            <DetailRow
              label="Service ID"
              value={data.service?.service_id}
              mono
              className="text-violet-600 dark:text-violet-400"
            />
            <DetailRow label="Name" value={data.service?.name} />
            <DetailRow label="SAC Code" value={data.service?.sac_code} mono />
            <DetailRow label="Type" value={data.service?.type} />
          </Section>

          {/* Charges & Margin */}
          <Section title="Charges & Margin" icon={Receipt} accent="emerald">
            <DetailRow
              label="Base Fees"
              value={data.charges ? `₹${formatINR(data.charges.fees)}` : null}
              className="text-slate-900 dark:text-white font-black"
            />
            <DetailRow
              label="Tax Rate"
              value={data.charges?.tax_rate != null ? `${data.charges.tax_rate}%` : null}
            />
            <DetailRow
              label="Tax Value"
              value={data.charges ? `₹${formatINR(data.charges.tax_value)}` : null}
            />
            <DetailRow
              label="Total Amount"
              value={data.charges ? `₹${formatINR(data.charges.amount)}` : null}
              className="text-emerald-600 dark:text-emerald-400 font-black"
            />
            {data.margin && (
              <>
                <DetailRow
                  label="Margin Type"
                  value={
                    data.margin.margin_type
                      ? data.margin.margin_type.charAt(0).toUpperCase() +
                        data.margin.margin_type.slice(1)
                      : null
                  }
                />
                <DetailRow
                  label="Margin Value"
                  value={
                    data.margin.margin_type === 'percentage'
                      ? `${data.margin.margin_value}%`
                      : `₹${formatINR(data.margin.margin_value)}`
                  }
                />
                <DetailRow
                  label="Margin Amount"
                  value={`₹${formatINR(data.margin.amount)}`}
                  className="text-violet-600 dark:text-violet-400 font-black"
                />
              </>
            )}
          </Section>
        </div>

        {/* ── Remarks & Meta ────────────────────────────────────────────────── */}
        <Section title="Remarks & Timeline" icon={ClipboardList} accent="indigo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Client remark */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Client Remark
              </p>
              <div className="min-h-[60px] rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-3">
                {data.client_remark ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {data.client_remark}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-600 italic">No remark provided</p>
                )}
              </div>
            </div>

            {/* Office remark */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Office Remark
              </p>
              <div className="min-h-[60px] rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-3">
                {data.office_remark ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {data.office_remark}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-600 italic">No remark provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 rounded-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 px-4 py-2.5">
              <Calendar size={13} className="text-indigo-400 shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Created
                </p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {fmt(data.create_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 rounded-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 px-4 py-2.5">
              <RefreshCw size={13} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Last Modified
                </p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {fmt(data.modify_date)}
                </p>
              </div>
            </div>
            {data.task_id && (
              <div className="flex items-center gap-2 flex-1 rounded-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 px-4 py-2.5">
                <Hash size={13} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Task ID
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {data.task_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
