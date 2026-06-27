import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Building2, Phone, Mail, MapPin, Calendar,
  Clock, Eye, Edit2, Trash2, ChevronLeft, AlertCircle,
  CheckCircle, Shield, FileText, Hash, CreditCard,
  MoreHorizontal, Plus, RefreshCw,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active: { label: 'Active', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
  'under review': { label: 'Under Review', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  suspended: { label: 'Suspended', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
};
const getStatus = (s) => {
  const key = (s || '').toLowerCase().trim();
  return STATUS_MAP[key] || { label: s || 'Unknown', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' };
};

const FIRM_TYPE_BADGE = {
  llp: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  proprietorship: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  partnership: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'private limited': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  individual: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
  company: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
};
const getFirmBadge = (t) => FIRM_TYPE_BADGE[(t || '').toLowerCase()] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

function Pulse({ h = 'h-4', w = 'w-full', rounded = 'rounded' }) {
  return <div className={`${h} ${w} ${rounded} bg-slate-200 dark:bg-slate-700 animate-pulse`} />;
}

// ── Info row component ─────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 dark:text-slate-200 truncate ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────
function Section({ title, children, action }) {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ── Firm Card ─────────────────────────────────────────────────────────────────
function FirmCard({ firm, canEdit, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-4 hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">
              {firm.firm || <span className="text-slate-400 italic">Individual</span>}
            </h4>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest shrink-0 ${getFirmBadge(firm.type)}`}>
              {firm.type}
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1 tracking-wider">{firm.pan}</p>
        </div>
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[130px]">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(firm); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Edit2 size={12} /> Edit Firm
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(firm); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Trash2 size={12} /> Delete Firm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {firm.gst && (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">GST</p>
            <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">{firm.gst}</p>
          </div>
        )}
        {firm.tan && (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">TAN</p>
            <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">{firm.tan}</p>
          </div>
        )}
        {firm.cin && (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">CIN</p>
            <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">{firm.cin}</p>
          </div>
        )}
        {firm.vat && (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50">
            <p className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">VAT</p>
            <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">{firm.vat}</p>
          </div>
        )}
      </div>

      {firm.address && (
        <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <MapPin size={11} className="shrink-0 text-slate-400 mt-0.5" />
          <span className="truncate">
            {[firm.address.address_line_1, firm.address.town, firm.address.district, firm.address.state, firm.address.pincode].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${getStatus(firm.status).badge}`}>
          {getStatus(firm.status).label}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {firm.create_date ? firm.create_date.slice(0, 10) : ''}
        </span>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'contact', label: 'Contact & Address', icon: MapPin },
  { id: 'business', label: 'Business Details', icon: Building2 },
];

// ── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({ isOpen, onClose, data, username, onSaved }) {
  const [form, setForm] = useState(data || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(data || {}); }, [data]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiCall(`/client/details/${username}`, 'PUT', { profile: form.profile, address: form.address });
      const d = await res.json();
      if (res.ok && d.success !== false) {
        toast.success('Profile updated');
        onSaved();
        onClose();
      } else {
        toast.error(d.message || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition-all placeholder:text-slate-400';
  const lbl = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile & Address" icon={Edit2} size="lg">
      <div className="space-y-6">
        {/* Profile fields */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Personal Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Full Name</label>
              <input className={inp} value={form.profile?.full_name || ''} onChange={e => set('profile', { ...form.profile, full_name: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>PAN</label>
              <input className={`${inp} font-mono uppercase`} value={form.profile?.pan || ''} onChange={e => set('profile', { ...form.profile, pan: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Care Of</label>
              <input className={inp} value={form.profile?.care_of || ''} onChange={e => set('profile', { ...form.profile, care_of: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Guardian Name</label>
              <input className={inp} value={form.profile?.guardian_name || ''} onChange={e => set('profile', { ...form.profile, guardian_name: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Mobile</label>
              <input className={inp} value={form.profile?.mobile || ''} onChange={e => set('profile', { ...form.profile, mobile: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input className={inp} type="email" value={form.profile?.email || ''} onChange={e => set('profile', { ...form.profile, email: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Date of Birth</label>
              <input className={inp} type="date" value={form.profile?.date_of_birth || ''} onChange={e => set('profile', { ...form.profile, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Gender</label>
              <select className={inp} value={form.profile?.gender || ''} onChange={e => set('profile', { ...form.profile, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address fields */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Residential Address</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>State</label>
              <input className={inp} value={form.address?.state || ''} onChange={e => set('address', { ...form.address, state: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>District</label>
              <input className={inp} value={form.address?.district || ''} onChange={e => set('address', { ...form.address, district: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Town / Village</label>
              <input className={inp} value={form.address?.town_or_village || ''} onChange={e => set('address', { ...form.address, town_or_village: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Pincode</label>
              <input className={inp} value={form.address?.pincode || ''} onChange={e => set('address', { ...form.address, pincode: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={lbl}>Address Line 1</label>
              <input className={inp} value={form.address?.address_line_1 || ''} onChange={e => set('address', { ...form.address, address_line_1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={lbl}>Address Line 2</label>
              <input className={inp} value={form.address?.address_line_2 || ''} onChange={e => set('address', { ...form.address, address_line_2: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, title, message, onConfirm, danger }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} icon={AlertCircle} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button
          onClick={handle}
          disabled={loading}
          className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 shadow-sm ${danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-sky-500 hover:bg-sky-600'}`}
        >
          {loading ? 'Processing…' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClientProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [firms, setFirms] = useState([]);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [firmsTotal, setFirmsTotal] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editFirm, setEditFirm] = useState(null);
  const [deleteFirm, setDeleteFirm] = useState(null);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/client/details/${username}`, 'GET');
      const d = await res.json();
      if (res.ok && d.success !== false) {
        setClient(d.data);
      } else {
        toast.error(d.message || 'Failed to load client');
      }
    } catch {
      toast.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchFirms = useCallback(async () => {
    setFirmsLoading(true);
    try {
      const res = await apiCall(`/client/details/${username}/firms?page_no=1&limit=20`, 'GET');
      const d = await res.json();
      if (res.ok && d.success !== false) {
        setFirms(d.data || []);
        setFirmsTotal(d.pagination?.total ?? 0);
      } else {
        toast.error(d.message || 'Failed to load firms');
      }
    } catch {
      toast.error('Failed to load firms');
    } finally {
      setFirmsLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchClient(); }, [fetchClient]);
  useEffect(() => { if (activeTab === 'business') fetchFirms(); }, [activeTab, fetchFirms]);

  const canEdit = client?.status === 'under review';

  const handleDeleteClient = async () => {
    try {
      const res = await apiCall(`/client/${username}`, 'DELETE');
      const d = await res.json();
      if (res.ok && d.success !== false) {
        toast.success('Client deleted');
        navigate('/clients');
      } else {
        toast.error(d.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDeleteFirm = async () => {
    if (!deleteFirm) return;
    try {
      const res = await apiCall(`/firms/${deleteFirm.firm_id}`, 'DELETE');
      const d = await res.json();
      if (res.ok && d.success !== false) {
        toast.success('Firm deleted');
        setDeleteFirm(null);
        fetchFirms();
      } else {
        toast.error(d.message || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Render skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Pulse h="h-16" w="w-16" rounded="rounded-full" />
          <div className="space-y-2 flex-1">
            <Pulse h="h-6" w="w-48" rounded="rounded-xl" />
            <Pulse h="h-4" w="w-32" rounded="rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Pulse key={i} h="h-24" rounded="rounded-sm" />)}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400">Client not found.</p>
      </div>
    );
  }

  const { profile, address } = client;
  const { label: statusLabel, badge: statusBadge, dot: statusDot } = getStatus(client.status);

  return (
    <div>
      <div className="mx-auto space-y-2">

        {/* ── Back + Header ── */}
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <ChevronLeft size={16} /> Clients
          </button>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 hover:text-sky-600 transition-all shadow-sm"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 hover:border-rose-400 transition-all shadow-sm"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Hero card ── */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              {profile?.image ? (
                <img src={profile.image} alt={profile.full_name} className="w-20 h-20 rounded-sm object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-sm bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/50 dark:to-sky-800/50 flex items-center justify-center border-2 border-sky-200 dark:border-sky-800 shadow-sm">
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                    {(profile?.full_name || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${statusDot}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{profile?.full_name || '—'}</h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {profile?.care_of} {profile?.guardian_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${statusBadge}`}>
                    {statusLabel}
                  </span>
                  {!canEdit && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <Shield size={10} /> Read only
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  PAN: {profile?.pan || '—'}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Clock size={12} className="text-sky-400" /> Joined {client.create_date?.slice(0, 10)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 p-1.5 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === id
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Profile ── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Personal Details">
              <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
              <InfoRow icon={FileText} label="PAN" value={profile?.pan} mono />
              <InfoRow icon={User} label="Care Of" value={profile?.care_of} />
              <InfoRow icon={User} label="Guardian" value={profile?.guardian_name} />
              <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth} />
              <InfoRow icon={User} label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
            </Section>
            <Section title="Account Info">
              <InfoRow icon={Hash} label="Username" value={client.username} mono />
              <InfoRow icon={Shield} label="Branch ID" value={client.branch_id} mono />
              <InfoRow icon={Clock} label="Created" value={client.create_date} />
              <div className="py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Status</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${statusBadge}`}>
                  {statusLabel}
                </span>
                {canEdit && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-2 flex items-center gap-1">
                    <AlertCircle size={10} /> Profile can be edited while under review
                  </p>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* ── Tab: Contact & Address ── */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Contact Information">
              <InfoRow icon={Phone} label="Mobile" value={profile?.mobile ? `+${profile.country_code || '91'} ${profile.mobile}` : null} />
              <InfoRow icon={Mail} label="Email" value={profile?.email} />
            </Section>
            <Section title="Residential Address">
              {address ? (
                <>
                  <InfoRow icon={MapPin} label="State" value={address.state} />
                  <InfoRow icon={MapPin} label="District" value={address.district} />
                  <InfoRow icon={MapPin} label="Town / Village" value={address.town_or_village} />
                  <InfoRow icon={Hash} label="Pincode" value={address.pincode} mono />
                  {address.address_line_1 && <InfoRow icon={MapPin} label="Address Line 1" value={address.address_line_1} />}
                  {address.address_line_2 && <InfoRow icon={MapPin} label="Address Line 2" value={address.address_line_2} />}
                </>
              ) : (
                <p className="py-6 text-center text-sm text-slate-400 font-medium">No address on record</p>
              )}
            </Section>
          </div>
        )}

        {/* ── Tab: Business Details ── */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {firmsTotal} firm{firmsTotal !== 1 ? 's' : ''} registered
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchFirms}
                  disabled={firmsLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw size={12} className={firmsLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {firmsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => <Pulse key={i} h="h-48" rounded="rounded-sm" />)}
              </div>
            ) : firms.length === 0 ? (
              <div className="rounded-sm border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-16 text-center flex flex-col items-center gap-4 shadow-sm">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <Building2 size={40} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-base text-slate-600 dark:text-slate-400 font-bold">No firms found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firms.map((firm) => (
                  <FirmCard
                    key={firm.firm_id}
                    firm={firm}
                    canEdit={canEdit}
                    onEdit={(f) => setEditFirm(f)}
                    onDelete={(f) => setDeleteFirm(f)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        data={client}
        username={username}
        onSaved={fetchClient}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Client"
        message={`Are you sure you want to delete ${client?.profile?.full_name}? This action cannot be undone.`}
        onConfirm={handleDeleteClient}
        danger
      />

      <ConfirmModal
        isOpen={!!deleteFirm}
        onClose={() => setDeleteFirm(null)}
        title="Delete Firm"
        message={`Delete firm "${deleteFirm?.firm || 'Individual'}"? This cannot be undone.`}
        onConfirm={handleDeleteFirm}
        danger
      />

      {/* Edit Firm Modal — minimal inline for brevity; expand as needed */}
      {editFirm && (
        <EditFirmModal
          firm={editFirm}
          onClose={() => setEditFirm(null)}
          onSaved={() => { setEditFirm(null); fetchFirms(); }}
        />
      )}
    </div>
  );
}

// ── Edit Firm Modal ────────────────────────────────────────────────────────────
function EditFirmModal({ firm, onClose, onSaved }) {
  const isIndividual = firm.type === 'individual';
  const [form, setForm] = useState(firm);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const setAddr = (field, val) => setForm(p => ({ ...p, address: { ...p.address, [field]: val } }));

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition-all placeholder:text-slate-400';
  const lbl = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = form.type === 'individual'
        ? { type: form.type, pan: form.pan }
        : { type: form.type, pan: form.pan, firm: form.firm, gst: form.gst, tan: form.tan, vat: form.vat, cin: form.cin, address: form.address };
      const res = await apiCall(`/client/details/firms/${firm.firm_id}`, 'PUT', payload);
      const d = await res.json();
      if (res.ok && d.success !== false) {
        toast.success('Firm updated');
        onSaved();
      } else {
        toast.error(d.message || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Firm" icon={Building2} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Type</label>
            <select className={inp} value={form.type || ''} onChange={e => set('type', e.target.value)}>
              <option value="individual">Individual</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="llp">LLP</option>
              <option value="private limited">Private Limited</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div>
            <label className={lbl}>PAN</label>
            <input className={`${inp} font-mono uppercase`} value={form.pan || ''} onChange={e => set('pan', e.target.value)} />
          </div>
          {form.type !== 'individual' && (
            <>
              <div className="md:col-span-2">
                <label className={lbl}>Firm Name</label>
                <input className={inp} value={form.firm || ''} onChange={e => set('firm', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>GST</label>
                <input className={`${inp} font-mono`} value={form.gst || ''} onChange={e => set('gst', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>TAN</label>
                <input className={`${inp} font-mono`} value={form.tan || ''} onChange={e => set('tan', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>VAT</label>
                <input className={`${inp} font-mono`} value={form.vat || ''} onChange={e => set('vat', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>CIN</label>
                <input className={`${inp} font-mono`} value={form.cin || ''} onChange={e => set('cin', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>State</label>
                <input className={inp} value={form.address?.state || ''} onChange={e => setAddr('state', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>District</label>
                <input className={inp} value={form.address?.district || ''} onChange={e => setAddr('district', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Town</label>
                <input className={inp} value={form.address?.town || ''} onChange={e => setAddr('town', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Pincode</label>
                <input className={inp} value={form.address?.pincode || ''} onChange={e => setAddr('pincode', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Address Line 1</label>
                <input className={inp} value={form.address?.address_line_1 || ''} onChange={e => setAddr('address_line_1', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
