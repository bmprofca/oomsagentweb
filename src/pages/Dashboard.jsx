import React, { useState, useEffect } from 'react';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import {
  LayoutDashboard, CheckCircle, Clock, Users, Briefcase,
  IndianRupee, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DUMMY_STATS = [
  { label: 'Total Revenue', value: '₹4,82,500', change: '+12.4%', up: true, icon: IndianRupee, color: 'emerald' },
  { label: 'Active Tasks', value: '38', change: '+3', up: true, icon: Clock, color: 'amber' },
  { label: 'Completed Tasks', value: '124', change: '+18', up: true, icon: CheckCircle, color: 'blue' },
  { label: 'Total Clients', value: '56', change: '-2', up: false, icon: Users, color: 'purple' },
];

const DUMMY_RECENT_TASKS = [
  { task_id: 't1', service: { name: 'GST Filing' }, firm: { firm_name: 'Arora Enterprises' }, status: 'pending from department', dates: { due_date: '30 Jun 2025' }, charges: { total: 2500 } },
  { task_id: 't2', service: { name: 'ITR Filing' }, firm: { firm_name: 'Mehta & Co.' }, status: 'complete', dates: { due_date: '25 Jun 2025' }, charges: { total: 3200 } },
  { task_id: 't3', service: { name: 'ROC Compliance' }, firm: { firm_name: 'Sunrise Pvt Ltd' }, status: 'in progress', dates: { due_date: '15 Jul 2025' }, charges: { total: 5000 } },
  { task_id: 't4', service: { name: 'TDS Return' }, firm: { firm_name: 'Blue Wave Tech' }, status: 'pending from department', dates: { due_date: '07 Jul 2025' }, charges: { total: 1800 } },
  { task_id: 't5', service: { name: 'Audit Report' }, firm: { firm_name: 'Global Exports' }, status: 'complete', dates: { due_date: '10 Jun 2025' }, charges: { total: 8500 } },
];

const DUMMY_RECENT_CLIENTS = [
  { client_id: 'c1', name: 'Rajesh Arora', firm: 'Arora Enterprises', tasks: 5 },
  { client_id: 'c2', name: 'Sunil Mehta', firm: 'Mehta & Co.', tasks: 3 },
  { client_id: 'c3', name: 'Priya Sharma', firm: 'Sunrise Pvt Ltd', tasks: 7 },
];

const accentMap = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('complete')) return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800';
  if (s.includes('pending')) return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800';
  if (s.includes('progress')) return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800';
  return 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentClients, setRecentClients] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(DUMMY_STATS);
      setRecentTasks(DUMMY_RECENT_TASKS);
      setRecentClients(DUMMY_RECENT_CLIENTS);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

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
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:block">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <span className={`p-1.5 rounded-lg ${accentMap[stat.color]}`}>
                    <Icon size={14} />
                  </span>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <span className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                    {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change} this month
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <Clock size={15} className="text-amber-500" /> Recent Tasks
            </span>
            <button onClick={() => navigate('/tasks')} className="text-xs text-blue-500 hover:underline font-medium">
              View all →
            </button>
          </div>
          {isLoading ? (
            <PageContentSkeleton viewMode="table" columns={4} rows={5} />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTasks.map((task) => (
                <div
                  key={task.task_id}
                  onClick={() => navigate(`/task/${task.task_id}`)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{task.service.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{task.firm.firm_name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:block">{task.dates.due_date}</span>
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                      <IndianRupee size={10} />{task.charges.total}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide font-bold ${getStatusColor(task.status)}`}>
                      {task.status.includes('pending') ? 'Pending' : task.status.includes('complete') ? 'Done' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Clients */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <Users size={15} className="text-purple-500" /> Recent Clients
            </span>
            <button onClick={() => navigate('/clients')} className="text-xs text-blue-500 hover:underline font-medium">
              View all →
            </button>
          </div>
          {isLoading ? (
            <div className="p-4 flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentClients.map((client) => (
                <div
                  key={client.client_id}
                  onClick={() => navigate(`/client/${client.client_id}`)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold text-sm flex-shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{client.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.firm}</p>
                  </div>
                  <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    {client.tasks} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Services', path: '/services', icon: Briefcase, color: 'blue' },
          { label: 'Tasks', path: '/tasks', icon: Clock, color: 'amber' },
          { label: 'Clients', path: '/clients', icon: Users, color: 'purple' },
          { label: 'Ledger', path: '/ledger', icon: IndianRupee, color: 'emerald' },
        ].map(({ label, path, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
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
