import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, CheckCircle, Clock, Building2, Briefcase,
  IndianRupee, Activity, XCircle, AlertCircle, TrendingUp,
  TrendingDown, Wallet, RefreshCw, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Skeleton pulse block ──────────────────────────────────────────────────────
function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded-lg' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, gradient, iconBg, loading, onClick }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Pulse h="h-3" w="w-24" />
          <Pulse h="h-10" w="w-10" rounded="rounded-2xl" />
        </div>
        <Pulse h="h-8" w="w-32" />
        <Pulse h="h-3" w="w-40" />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-6 flex flex-col gap-4 shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/30 dark:hover:border-blue-400/30' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{value}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section Card wrapper ──────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, iconColor, iconBg, action, actionLabel, children, loading, loadingRows = 3 }) {
  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100/80 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40">
        <span className="flex items-center gap-3 text-base font-bold text-slate-800 dark:text-white">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg || 'bg-slate-100 dark:bg-slate-800'} ${iconColor}`}>
             <Icon size={16} className="stroke-[2.5]" />
          </div>
          {title}
        </span>
        {action && (
          <button
            onClick={action}
            className="group flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
          >
            {actionLabel}
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="p-6 flex flex-col gap-4">
          {[...Array(loadingRows)].map((_, i) => <Pulse key={i} h="h-10" rounded="rounded-xl" />)}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">{children}</div>
      )}
    </div>
  );
}

// ── Breakdown Row ─────────────────────────────────────────────────────────────
function BreakdownRow({ label, value, total, icon: Icon, badgeClass, textClass }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 ${textClass}`}>
        <Icon size={14} className="stroke-[2.5]" />
      </div>
      <span className={`text-sm font-bold flex-1 text-slate-700 dark:text-slate-200`}>{label}</span>
      <div className="flex items-center gap-3">
        {total > 0 && (
          <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full transition-all duration-1000 ${badgeClass.split(' ')[0]}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <span className={`px-3 py-1 rounded-full text-xs font-bold min-w-[36px] text-center shadow-sm ${badgeClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Balance Row ───────────────────────────────────────────────────────────────
function BalanceRow({ label, amount, icon: Icon, iconClass }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      <span className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 ${iconClass}`}>
          <Icon size={14} className="stroke-[2.5]" />
        </div>
        {label}
      </span>
      <span className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-0.5">
        <IndianRupee size={14} className="text-slate-400 dark:text-slate-500" />{fmt(amount)}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashData, setDashData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiCall('/report/dashboard', 'GET');
      const json = await res.json();
      if (res.ok && json.success !== false) {
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

  const tasks   = dashData?.tasks   || {};
  const firms   = dashData?.firms   || {};
  const balance = dashData?.balance || {};

  const topStats = [
    {
      label: 'Net Balance',
      value: `₹${fmt(balance.balance)}`,
      sub: `Credit ₹${fmt(balance.credit)}  ·  Debit ₹${fmt(balance.debit)}`,
      icon: Wallet,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Tasks',
      value: tasks.total ?? '—',
      sub: `${tasks.in_process ?? 0} in process  ·  ${tasks.complete ?? 0} complete`,
      icon: Briefcase,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      onClick: () => navigate('/task'),
    },
    {
      label: 'Active Firms',
      value: firms.active ?? '—',
      sub: `${firms.total ?? 0} total  ·  ${firms.inactive ?? 0} inactive`,
      icon: Building2,
      iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Cancelled',
      value: tasks.cancel ?? '—',
      sub: (tasks.cancel ?? 0) === 0 ? 'No cancellations 🎉' : 'Review cancelled tasks',
      icon: XCircle,
      iconBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
      onClick: () => navigate('/task'),
    },
  ];

  const taskBreakdown = [
    { label: 'In Process',              value: tasks.in_process ?? 0,           icon: Activity,     textClass: 'text-blue-600 dark:text-blue-400',   badgeClass: 'bg-blue-500 text-white' },
    { label: 'Pending from Client',     value: tasks.pending_from_client ?? 0,  icon: Clock,        textClass: 'text-amber-600 dark:text-amber-400', badgeClass: 'bg-amber-500 text-white' },
    { label: 'Pending from Dept',       value: tasks.pending_from_department ?? 0, icon: AlertCircle, textClass: 'text-orange-600 dark:text-orange-400', badgeClass: 'bg-orange-500 text-white' },
    { label: 'Completed',               value: tasks.complete ?? 0,             icon: CheckCircle,  textClass: 'text-emerald-600 dark:text-emerald-400', badgeClass: 'bg-emerald-500 text-white' },
    { label: 'Cancelled',               value: tasks.cancel ?? 0,               icon: XCircle,      textClass: 'text-rose-600 dark:text-rose-400',   badgeClass: 'bg-rose-500 text-white' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30 text-white">
              <LayoutDashboard size={22} className="stroke-[2.5]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">Dashboard</h1>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">
            Welcome back, <span className="font-bold text-slate-700 dark:text-slate-200">{userData?.name || 'Agent'}</span>
            {userData?.branch?.name && <span> · {userData.branch.name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-500' : 'text-slate-400 dark:text-slate-500'} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {topStats.map((s) => (
          <StatCard key={s.label} {...s} loading={isLoading} />
        ))}
      </div>

      {/* Mid section: Task Breakdown + Balance & Firms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Task Breakdown — 2 cols */}
        <SectionCard
          title="Task Breakdown"
          icon={Briefcase}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          action={() => navigate('/task')}
          actionLabel="View all"
          loading={isLoading}
          loadingRows={5}
        >
          {/* Progress bar */}
          {(tasks.total ?? 0) > 0 && (
            <div className="px-5 pt-4 pb-2">
              <div className="flex rounded-full overflow-hidden h-2 bg-slate-100 dark:bg-slate-700 gap-px">
                {[
                  { val: tasks.in_process,             color: 'bg-blue-500' },
                  { val: tasks.pending_from_client,     color: 'bg-amber-500' },
                  { val: tasks.pending_from_department, color: 'bg-orange-500' },
                  { val: tasks.complete,                color: 'bg-emerald-500' },
                  { val: tasks.cancel,                  color: 'bg-rose-500' },
                ].map(({ val, color }, i) => {
                  const pct = ((val || 0) / tasks.total) * 100;
                  return pct > 0 ? (
                    <div key={i} className={`${color}`} style={{ width: `${pct}%` }} />
                  ) : null;
                })}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{tasks.total} total tasks</p>
            </div>
          )}
          <div>
            {taskBreakdown.map((item) => (
              <BreakdownRow key={item.label} {...item} total={tasks.total ?? 0} />
            ))}
          </div>
        </SectionCard>

        {/* Right column: Balance + Firms */}
        <div className="flex flex-col gap-4">

          {/* Balance */}
          <SectionCard
            title="Balance Overview"
            icon={Wallet}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            loading={isLoading}
            loadingRows={3}
          >
            <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Net Balance</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-1 tracking-tight">
                <IndianRupee size={22} className="text-slate-400 dark:text-slate-500 stroke-[2.5]" />
                {fmt(balance.balance)}
              </p>
            </div>
            <div>
              <BalanceRow label="Credit" amount={balance.credit} icon={TrendingUp}   iconClass="text-emerald-500" />
              <BalanceRow label="Debit"  amount={balance.debit}  icon={TrendingDown} iconClass="text-rose-500" />
            </div>
          </SectionCard>

          {/* Firms */}
          <SectionCard
            title="Firms"
            icon={Building2}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-100 dark:bg-purple-900/40"
            loading={isLoading}
            loadingRows={2}
          >
            <div>
              {[
                { label: 'Active Firms',   value: firms.active   ?? 0, icon: CheckCircle, iconClass: 'text-emerald-500', badge: 'bg-emerald-500 text-white shadow-emerald-500/20' },
                { label: 'Inactive Firms', value: firms.inactive ?? 0, icon: XCircle,     iconClass: 'text-slate-400',   badge: 'bg-slate-400 text-white' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100/80 dark:border-slate-700/40 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 ${item.iconClass}`}>
                    <item.icon size={14} className="stroke-[2.5]" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-1">{item.label}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.badge}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Quick Links</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Tasks',        path: '/task',    icon: Briefcase, iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400', desc: 'Manage client tasks' },
            { label: 'Help & Support', path: '/support', icon: AlertCircle, iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', desc: 'Get assistance' },
          ].map(({ label, path, icon: Icon, iconBg, desc }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="group relative flex items-center gap-5 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
                <Icon size={24} className="stroke-[2]" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block text-base font-bold text-slate-800 dark:text-slate-100 tracking-wide">{label}</span>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{desc}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm shrink-0">
                <ArrowRight size={16} className="text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}