import React, { useState, useEffect, useCallback } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import {
  LayoutDashboard, CheckCircle, Clock, Building2, Briefcase,
  IndianRupee, ArrowUpRight, Users, Activity, XCircle,
  AlertCircle, TrendingUp, TrendingDown, Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const accentMap = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber:   'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400',
  blue:    'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400',
  purple:  'bg-purple-100  text-purple-700  dark:bg-purple-900/30  dark:text-purple-400',
  rose:    'bg-rose-100    text-rose-700    dark:bg-rose-900/30    dark:text-rose-400',
  indigo:  'bg-indigo-100  text-indigo-700  dark:bg-indigo-900/30  dark:text-indigo-400',
};

const borderAccentMap = {
  emerald: 'border-emerald-200 dark:border-emerald-800',
  amber:   'border-amber-200   dark:border-amber-800',
  blue:    'border-blue-200    dark:border-blue-800',
  purple:  'border-purple-200  dark:border-purple-800',
  rose:    'border-rose-200    dark:border-rose-800',
  indigo:  'border-indigo-200  dark:border-indigo-800',
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, loading, onClick }) {
  if (loading) {
    return <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-xl border ${borderAccentMap[color]} p-4 flex flex-col gap-3
        hover:shadow-sm transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
        <span className={`p-1.5 rounded-lg ${accentMap[color]}`}>
          <Icon size={14} />
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Task Breakdown Row ─────────────────────────────────────────────────────────
function TaskBreakdownItem({ label, value, color, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4">
      <span className={`flex items-center gap-2 text-sm font-medium ${color.text}`}>
        <Icon size={14} />
        {label}
      </span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${color.badge}`}>
        {value}
      </span>
    </div>
  );
}

// ── Balance Item ──────────────────────────────────────────────────────────────
function BalanceItem({ label, amount, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4">
      <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Icon size={13} className={color} />
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-0.5">
        <IndianRupee size={11} />{fmt(amount)}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashData, setDashData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiCall('/report/dashboard', 'GET');
      const json = await response.json();
      if (response.ok && json.success !== false) {
        setDashData(json.data);
      } else {
        toast.error(json.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Derived values from API ─────────────────────────────────────────────────
  const tasks    = dashData?.tasks    || {};
  const firms    = dashData?.firms    || {};
  const balance  = dashData?.balance  || {};

  const topStats = [
    {
      label: 'Net Balance',
      value: `₹${fmt(balance.balance)}`,
      sub: `Credit ₹${fmt(balance.credit)} · Debit ₹${fmt(balance.debit)}`,
      icon: Wallet,
      color: 'emerald',
      onClick: () => navigate('/ledger'),
    },
    {
      label: 'Total Tasks',
      value: tasks.total ?? '—',
      sub: `${tasks.in_process ?? 0} in process · ${tasks.complete ?? 0} complete`,
      icon: Briefcase,
      color: 'blue',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'Active Firms',
      value: firms.active ?? '—',
      sub: `${firms.total ?? 0} total · ${firms.inactive ?? 0} inactive`,
      icon: Building2,
      color: 'purple',
      onClick: () => navigate('/firms'),
    },
    {
      label: 'Cancelled Tasks',
      value: tasks.cancel ?? '—',
      sub: tasks.cancel === 0 ? 'No cancellations' : 'Review cancelled tasks',
      icon: XCircle,
      color: 'rose',
      onClick: () => navigate('/tasks'),
    },
  ];

  const taskBreakdown = [
    {
      label: 'In Process',
      value: tasks.in_process ?? 0,
      icon: Activity,
      color: { text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    },
    {
      label: 'Pending from Client',
      value: tasks.pending_from_client ?? 0,
      icon: Clock,
      color: { text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    },
    {
      label: 'Pending from Department',
      value: tasks.pending_from_department ?? 0,
      icon: AlertCircle,
      color: { text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    },
    {
      label: 'Completed',
      value: tasks.complete ?? 0,
      icon: CheckCircle,
      color: { text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    },
    {
      label: 'Cancelled',
      value: tasks.cancel ?? 0,
      icon: XCircle,
      color: { text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    },
  ];

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard size={22} className="text-blue-500" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button
            onClick={fetchDashboard}
            className="text-xs text-blue-500 hover:text-blue-600 font-medium px-2.5 py-1.5 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)
          : topStats.map((s) => <StatCard key={s.label} {...s} loading={false} />)
        }
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Task Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <Briefcase size={15} className="text-blue-500" /> Task Breakdown
            </span>
            <button onClick={() => navigate('/tasks')} className="text-xs text-blue-500 hover:underline font-medium">
              View all →
            </button>
          </div>

          {isLoading ? (
            <PageContentSkeleton viewMode="table" columns={2} rows={5} />
          ) : (
            <>
              {/* Progress bar */}
              {(tasks.total ?? 0) > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <div className="flex rounded-full overflow-hidden h-2 bg-slate-100 dark:bg-slate-800">
                    {[
                      { val: tasks.in_process, color: 'bg-blue-400' },
                      { val: tasks.pending_from_client, color: 'bg-amber-400' },
                      { val: tasks.pending_from_department, color: 'bg-orange-400' },
                      { val: tasks.complete, color: 'bg-emerald-400' },
                      { val: tasks.cancel, color: 'bg-rose-400' },
                    ].map(({ val, color }, i) => {
                      const pct = ((val || 0) / tasks.total) * 100;
                      return pct > 0 ? (
                        <div key={i} className={`${color} transition-all`} style={{ width: `${pct}%` }} />
                      ) : null;
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{tasks.total} total tasks</p>
                </div>
              )}

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {taskBreakdown.map((item) => (
                  <TaskBreakdownItem key={item.label} {...item} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Balance & Firms */}
        <div className="flex flex-col gap-4">

          {/* Balance Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-500" /> Balance
              </span>
              <button onClick={() => navigate('/ledger')} className="text-xs text-blue-500 hover:underline font-medium">
                Ledger →
              </button>
            </div>
            {isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Net Balance</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-0.5 mt-0.5">
                    <IndianRupee size={16} />{fmt(balance.balance)}
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <BalanceItem label="Credit" amount={balance.credit} icon={TrendingUp} color="text-emerald-500" />
                  <BalanceItem label="Debit"  amount={balance.debit}  icon={TrendingDown} color="text-rose-500" />
                </div>
              </>
            )}
          </div>

          {/* Firms Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                <Building2 size={15} className="text-purple-500" /> Firms
              </span>
              <button onClick={() => navigate('/firms')} className="text-xs text-blue-500 hover:underline font-medium">
                View all →
              </button>
            </div>
            {isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {[...Array(2)].map((_, i) => <div key={i} className="h-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { label: 'Active Firms',   value: firms.active   ?? 0, color: { text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }, icon: CheckCircle },
                  { label: 'Inactive Firms', value: firms.inactive  ?? 0, color: { text: 'text-slate-500 dark:text-slate-400',    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },           icon: XCircle },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 px-4">
                    <span className={`flex items-center gap-2 text-sm font-medium ${item.color.text}`}>
                      <item.icon size={14} />{item.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.color.badge}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Services', path: '/services', icon: Briefcase,   color: 'blue' },
          { label: 'Tasks',    path: '/tasks',    icon: Clock,       color: 'amber' },
          { label: 'Clients',  path: '/clients',  icon: Users,       color: 'purple' },
          { label: 'Ledger',   path: '/ledger',   icon: IndianRupee, color: 'emerald' },
        ].map(({ label, path, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4
              flex items-center gap-3 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
          >
            <span className={`p-2 rounded-lg ${accentMap[color]}`}>
              <Icon size={16} />
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            <ArrowUpRight size={14} className="ml-auto text-slate-400" />
          </button>
        ))}
      </div>

    </div>
  );
}