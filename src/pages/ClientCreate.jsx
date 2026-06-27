import React, { useState } from 'react';
import {
  User, MapPin, Building2, ChevronLeft, ChevronRight,
  Plus, Trash2, CheckCircle, AlertCircle, Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal information' },
  { id: 'contact', label: 'Contact & Address', icon: MapPin, description: 'Address & contact details' },
  { id: 'business', label: 'Business Details', icon: Building2, description: 'Firms & registrations' },
];

// ── Form helpers ───────────────────────────────────────────────────────────────
const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 transition-all placeholder:text-slate-400';
const lbl = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const err = 'text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1';

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
      {error && <p className={err}><AlertCircle size={10} />{error}</p>}
    </div>
  );
}

// ── Default firm ───────────────────────────────────────────────────────────────
const defaultFirm = (pan = '') => ({
  type: 'individual',
  pan,
  firm: '',
  gst: '',
  tan: '',
  vat: '',
  cin: '',
  address: { state: '', district: '', town: '', pincode: '', address_line_1: '', address_line_2: '' },
});

// ── Firm Type Badge ────────────────────────────────────────────────────────────
const FIRM_TYPES = ['individual', 'proprietorship', 'partnership', 'llp', 'private limited', 'company'];

// ── Step: Profile ──────────────────────────────────────────────────────────────
function StepProfile({ data, onChange, errors }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <Field label="Full Name" error={errors.full_name} required>
          <input className={inp} placeholder="Rahul Sharma" value={data.full_name || ''} onChange={e => set('full_name', e.target.value)} />
        </Field>
      </div>
      <Field label="PAN" error={errors.pan} required>
        <input className={`${inp} font-mono uppercase`} placeholder="ABCDE1234F" value={data.pan || ''} onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} />
      </Field>
      <Field label="Date of Birth" error={errors.date_of_birth} required>
        <input className={inp} type="date" value={data.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} />
      </Field>
      <Field label="Care Of" error={errors.care_of} required>
        <input className={inp} placeholder="S/O Ram Sharma" value={data.care_of || ''} onChange={e => set('care_of', e.target.value)} />
      </Field>
      <Field label="Guardian Name" error={errors.guardian_name} required>
        <input className={inp} placeholder="Ram Sharma" value={data.guardian_name || ''} onChange={e => set('guardian_name', e.target.value)} />
      </Field>
      <Field label="Gender" error={errors.gender} required>
        <select className={inp} value={data.gender || ''} onChange={e => set('gender', e.target.value)}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Profile Image URL">
        <input className={inp} type="url" placeholder="https://example.com/photo.jpg" value={data.image || ''} onChange={e => set('image', e.target.value)} />
      </Field>
    </div>
  );
}

// ── Step: Contact & Address ────────────────────────────────────────────────────
function StepContact({ contact, address, onContactChange, onAddressChange, errors }) {
  const setC = (k, v) => onContactChange({ ...contact, [k]: v });
  const setA = (k, v) => onAddressChange({ ...address, [k]: v });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User size={12} /> Contact Information
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Mobile" error={errors.mobile} required>
            <div className="flex gap-2">
              <input className={`${inp} w-16 text-center`} value={contact.country_code || '91'} onChange={e => setC('country_code', e.target.value)} maxLength={4} />
              <input className={`${inp} flex-1`} placeholder="9876543210" value={contact.mobile || ''} onChange={e => setC('mobile', e.target.value)} maxLength={10} />
            </div>
          </Field>
          <Field label="Email" error={errors.email} required>
            <input className={inp} type="email" placeholder="rahul@example.com" value={contact.email || ''} onChange={e => setC('email', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-700/50" />

      <div>
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin size={12} /> Residential Address
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="State" error={errors.state} required>
            <input className={inp} placeholder="Maharashtra" value={address.state || ''} onChange={e => setA('state', e.target.value)} />
          </Field>
          <Field label="District" error={errors.district} required>
            <input className={inp} placeholder="Mumbai" value={address.district || ''} onChange={e => setA('district', e.target.value)} />
          </Field>
          <Field label="Town / Village" error={errors.town_or_village} required>
            <input className={inp} placeholder="Andheri" value={address.town_or_village || ''} onChange={e => setA('town_or_village', e.target.value)} />
          </Field>
          <Field label="Pincode" error={errors.pincode} required>
            <input className={inp} placeholder="400053" value={address.pincode || ''} onChange={e => setA('pincode', e.target.value)} maxLength={6} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address Line 1">
              <input className={inp} placeholder="Flat 12, Building A" value={address.address_line_1 || ''} onChange={e => setA('address_line_1', e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Address Line 2">
              <input className={inp} placeholder="Near Metro Station" value={address.address_line_2 || ''} onChange={e => setA('address_line_2', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Firm Editor ────────────────────────────────────────────────────────────────
function FirmEditor({ firm, index, onChange, onDelete, errors, total }) {
  const set = (k, v) => onChange({ ...firm, [k]: v });
  const setA = (k, v) => onChange({ ...firm, address: { ...firm.address, [k]: v } });
  const isIndividual = firm.type === 'individual';

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Firm header */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-sky-500 text-white text-[10px] font-black flex items-center justify-center">
            {index + 1}
          </span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {firm.firm || (isIndividual ? 'Individual Firm' : 'New Firm')}
          </p>
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700`}>
            {firm.type}
          </span>
        </div>
        {total > 1 && (
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Firm Type" required>
          <select className={inp} value={firm.type || 'individual'} onChange={e => set('type', e.target.value)}>
            {FIRM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="PAN" error={errors?.[`firm_${index}_pan`]} required>
          <input className={`${inp} font-mono uppercase`} placeholder="ABCDE1234F" value={firm.pan || ''} onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} />
        </Field>

        {!isIndividual && (
          <>
            <div className="md:col-span-2">
              <Field label="Firm Name" error={errors?.[`firm_${index}_firm`]} required>
                <input className={inp} placeholder="Sharma Traders" value={firm.firm || ''} onChange={e => set('firm', e.target.value)} />
              </Field>
            </div>
            <Field label="GST">
              <input className={`${inp} font-mono`} placeholder="27ABCDE1234F1Z5" value={firm.gst || ''} onChange={e => set('gst', e.target.value)} />
            </Field>
            <Field label="TAN">
              <input className={`${inp} font-mono`} placeholder="MUMS12345A" value={firm.tan || ''} onChange={e => set('tan', e.target.value)} />
            </Field>
            <Field label="VAT">
              <input className={`${inp} font-mono`} value={firm.vat || ''} onChange={e => set('vat', e.target.value)} />
            </Field>
            <Field label="CIN">
              <input className={`${inp} font-mono`} value={firm.cin || ''} onChange={e => set('cin', e.target.value)} />
            </Field>

            {/* Firm address */}
            <div className="md:col-span-2">
              <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider my-3">Firm Address</p>
            </div>
            <Field label="State" error={errors?.[`firm_${index}_state`]} required>
              <input className={inp} placeholder="Maharashtra" value={firm.address?.state || ''} onChange={e => setA('state', e.target.value)} />
            </Field>
            <Field label="District" error={errors?.[`firm_${index}_district`]} required>
              <input className={inp} placeholder="Mumbai" value={firm.address?.district || ''} onChange={e => setA('district', e.target.value)} />
            </Field>
            <Field label="Town" error={errors?.[`firm_${index}_town`]} required>
              <input className={inp} placeholder="Andheri" value={firm.address?.town || ''} onChange={e => setA('town', e.target.value)} />
            </Field>
            <Field label="Pincode" error={errors?.[`firm_${index}_pincode`]} required>
              <input className={inp} placeholder="400053" value={firm.address?.pincode || ''} onChange={e => setA('pincode', e.target.value)} maxLength={6} />
            </Field>
            <Field label="Address Line 1">
              <input className={inp} value={firm.address?.address_line_1 || ''} onChange={e => setA('address_line_1', e.target.value)} />
            </Field>
            <Field label="Address Line 2">
              <input className={inp} value={firm.address?.address_line_2 || ''} onChange={e => setA('address_line_2', e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

// ── Step: Business ─────────────────────────────────────────────────────────────
function StepBusiness({ firms, onChange, errors }) {
  const addFirm = () => onChange([...firms, defaultFirm()]);
  const updateFirm = (i, firm) => onChange(firms.map((f, idx) => idx === i ? firm : f));
  const removeFirm = (i) => onChange(firms.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {firms.map((firm, i) => (
        <FirmEditor
          key={i}
          firm={firm}
          index={i}
          onChange={(f) => updateFirm(i, f)}
          onDelete={() => removeFirm(i)}
          errors={errors}
          total={firms.length}
        />
      ))}
      <button
        onClick={addFirm}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
      >
        <Plus size={15} /> Add Another Firm
      </button>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-300 border-2 ${done ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-200 dark:shadow-sky-900/40' :
                active ? 'bg-white dark:bg-slate-800 border-sky-500 text-sky-600 dark:text-sky-400 shadow-md' :
                  'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                {done ? <CheckCircle size={18} /> : <Icon size={16} />}
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-sky-600 dark:text-sky-400' : done ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                  {step.label}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-300 ${i < current ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validateStep(step, data) {
  const e = {};
  if (step === 0) {
    if (!data.profile.full_name) e.full_name = 'Full name is required';
    if (!data.profile.pan) e.pan = 'PAN is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.profile.pan)) e.pan = 'Invalid PAN format';
    if (!data.profile.date_of_birth) e.date_of_birth = 'Date of birth is required';
    if (!data.profile.care_of) e.care_of = 'Care of is required';
    if (!data.profile.guardian_name) e.guardian_name = 'Guardian name is required';
    if (!data.profile.gender) e.gender = 'Gender is required';
  }
  if (step === 1) {
    if (!data.contact.mobile) e.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(data.contact.mobile)) e.mobile = 'Must be 10 digits';
    if (!data.contact.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) e.email = 'Invalid email';
    if (!data.address.state) e.state = 'State is required';
    if (!data.address.district) e.district = 'District is required';
    if (!data.address.town_or_village) e.town_or_village = 'Town/Village is required';
    if (!data.address.pincode) e.pincode = 'Pincode is required';
  }
  if (step === 2) {
    data.business.forEach((f, i) => {
      if (!f.pan) e[`firm_${i}_pan`] = 'PAN required';
      if (f.type !== 'individual') {
        if (!f.firm) e[`firm_${i}_firm`] = 'Firm name required';
        if (!f.address?.state) e[`firm_${i}_state`] = 'State required';
        if (!f.address?.district) e[`firm_${i}_district`] = 'District required';
        if (!f.address?.town) e[`firm_${i}_town`] = 'Town required';
        if (!f.address?.pincode) e[`firm_${i}_pincode`] = 'Pincode required';
      }
    });
  }
  return e;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClientCreate() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState({
    profile: { pan: '', full_name: '', care_of: '', guardian_name: '', date_of_birth: '', gender: '', image: '' },
    contact: { mobile: '', country_code: '91', email: '' },
    address: { state: '', district: '', town_or_village: '', pincode: '', address_line_1: '', address_line_2: '' },
    business: [defaultFirm()],
  });

  const setProfile = (v) => setData(p => ({ ...p, profile: v }));
  const setContact = (v) => setData(p => ({ ...p, contact: v }));
  const setAddress = (v) => setData(p => ({ ...p, address: v }));
  const setBusiness = (v) => setData(p => ({ ...p, business: v }));

  const goNext = () => {
    const e = validateStep(step, data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const goBack = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const e = validateStep(2, data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      const payload = {
        profile: { ...data.profile, ...{ mobile: data.contact.mobile, country_code: data.contact.country_code, email: data.contact.email } },
        address: data.address,
        business: data.business,
      };
      const res = await apiCall('/client/create', 'POST', payload);
      const resp = await res.json();
      if (res.ok && resp.success !== false) {
        toast.success('Client created successfully!');
        setDone(true);
      } else {
        toast.error(resp.message || 'Failed to create client');
      }
    } catch {
      toast.error('Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Client Created!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">The client profile has been registered successfully.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/clients')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 hover:text-sky-600 transition-all shadow-sm"
            >
              All Clients
            </button>
            <button
              onClick={() => { setDone(false); setStep(0); setData({ profile: { pan: '', full_name: '', care_of: '', guardian_name: '', date_of_birth: '', gender: '', image: '' }, contact: { mobile: '', country_code: '91', email: '' }, address: { state: '', district: '', town_or_village: '', pincode: '', address_line_1: '', address_line_2: '' }, business: [defaultFirm()] }); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <ChevronLeft size={16} /> Clients
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">New Client</span>
        </div>

        {/* Step indicator */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6">
          <StepIndicator steps={STEPS} current={step} />
        </div>

        {/* Step content */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                {React.createElement(STEPS[step].icon, { size: 16, className: 'text-sky-600 dark:text-sky-400' })}
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{STEPS[step].label}</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{STEPS[step].description}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {step === 0 && (
              <StepProfile data={data.profile} onChange={setProfile} errors={errors} />
            )}
            {step === 1 && (
              <StepContact
                contact={data.contact}
                address={data.address}
                onContactChange={setContact}
                onAddressChange={setAddress}
                errors={errors}
              />
            )}
            {step === 2 && (
              <StepBusiness firms={data.business} onChange={setBusiness} errors={errors} />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={step === 0 ? () => navigate('/clients') : goBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600 transition-all shadow-sm"
          >
            <ChevronLeft size={15} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-sky-500 w-5' : i < step ? 'bg-sky-300 dark:bg-sky-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm"
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Client'}
              {!submitting && <CheckCircle size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
