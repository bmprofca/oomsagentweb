import React, { useState, useEffect } from 'react';
import {
  User, Phone, Building2, Mail, Hash
} from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { userData } = useAuth();

  const [profile, setProfile] = useState({
    username: userData?.username || '',
    name: userData?.name || 'Agent',
    email: userData?.email || '',
    mobile: userData?.mobile || '',
    countryCode: userData?.country_code || '91',
    branchId: userData?.branch?.branch_id || '',
    branchName: userData?.branch?.name || '',
  });

  useEffect(() => {
    if (userData) {
      setProfile({
        username: userData.username || '',
        name: userData.name || 'Agent',
        email: userData.email || '',
        mobile: userData.mobile || '',
        countryCode: userData.country_code || '91',
        branchId: userData.branch?.branch_id || '',
        branchName: userData.branch?.name || '',
      });
    }
  }, [userData]);

  /* ---------- Section header ---------- */
  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40">
      <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30 text-white">
        <Icon size={18} className="stroke-[2.5]" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-tight">{title}</h3>
    </div>
  );

  /* ---------- Field label ---------- */
  const FieldLabel = ({ children }) => (
    <div className="flex items-center justify-between mb-2">
      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {children}
      </label>
    </div>
  );

  /* ---------- Read-only field value ---------- */
  const FieldValue = ({ children }) => (
    <p className="text-sm text-slate-900 dark:text-white font-medium">{children || '—'}</p>
  );

  return (
    <ManagementHub
      title="Agent Profile"
      description="View your agent information and branch details."
      accent="blue"
    >
      {/* ===== MAIN GRID ===== */}
      <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start w-full min-h-screen">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
          {/* Profile card */}
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
            {/* Cover strip */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />
            </div>

            {/* Avatar + info */}
            <div className="flex flex-col items-center px-6 pb-6 -mt-12 relative z-10">
              <div className="relative w-24 h-24 rounded-sm ring-4 ring-white dark:ring-slate-900 shadow-xl mb-4 bg-white dark:bg-slate-800">
                <div className="w-full h-full rounded-sm bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 overflow-hidden flex items-center justify-center">
                  <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {profile.name.charAt(0)}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white text-center leading-tight tracking-tight">{profile.name}</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mt-1 truncate w-full">{profile.email}</p>

              <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800/60">
                Agent
              </span>

              {/* Quick info chips */}
              <div className="mt-6 w-full space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl px-4 py-2.5 w-full border border-slate-100 dark:border-slate-800">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {profile.mobile && (
                  <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl px-4 py-2.5 w-full border border-slate-100 dark:border-slate-800">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>+{profile.countryCode} {profile.mobile}</span>
                  </div>
                )}
                {profile.branchName && (
                  <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl px-4 py-2.5 w-full border border-slate-100 dark:border-slate-800">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{profile.branchName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">

          {/* Personal Details */}
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
            <SectionHeader icon={User} title="Agent Information" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <FieldLabel>Username</FieldLabel>
                <FieldValue>{profile.username}</FieldValue>
              </div>
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <FieldValue>{profile.name}</FieldValue>
              </div>
              <div>
                <FieldLabel>Email Address</FieldLabel>
                <FieldValue>{profile.email}</FieldValue>
              </div>
              <div>
                <FieldLabel>Mobile Number</FieldLabel>
                <FieldValue>+{profile.countryCode} {profile.mobile}</FieldValue>
              </div>
            </div>
          </div>

          {/* Branch Details */}
          <div className="bg-white/60 dark:bg-slate-800/60 rounded-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl overflow-hidden w-full">
            <SectionHeader icon={Building2} title="Branch Details" />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <FieldLabel>Branch Name</FieldLabel>
                <FieldValue>{profile.branchName}</FieldValue>
              </div>
              <div>
                <FieldLabel>Branch ID</FieldLabel>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Hash size={13} className="text-slate-500" />
                  {profile.branchId || '—'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ManagementHub>
  );
}
