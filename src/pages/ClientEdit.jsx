import React, { useState, useEffect, useCallback } from 'react';
import {
  User, MapPin, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, Upload,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiCall, uploadFile } from '../utils/apiCall';
import toast from 'react-hot-toast';
import SelectField from '../components/common/SelectField';
import AdvancedDateFilter from '../components/common/AdvancedDateFilter';

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal information' },
  { id: 'contact', label: 'Contact & Address', icon: MapPin, description: 'Address & contact details' },
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

// ── Image Upload Field ─────────────────────────────────────────────────────────
function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = React.useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url && typeof url === 'string') {
        onChange(url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (e) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer ${dragActive ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          e.target.value = null;
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center justify-center gap-2 text-sky-500">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Uploading...</span>
        </div>
      ) : value ? (
        <div className="relative w-full h-full group bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center py-2">
          <img src={value} alt="Profile preview" className="w-28 h-28 rounded-md object-cover shadow-sm border border-slate-200 dark:border-slate-700" />
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg shadow-md text-xs font-bold flex items-center gap-1"><Upload size={14} /> Change Image</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <Upload size={24} className={dragActive ? 'text-sky-500' : ''} />
          <span className="text-xs font-medium px-4 text-center">
            <span className="text-sky-500 font-bold">Click to upload</span> or drag and drop<br />SVG, PNG, JPG or GIF
          </span>
        </div>
      )}
    </div>
  );
}

// ── Step: Profile ──────────────────────────────────────────────────────────────
function StepProfile({ data, onChange, errors }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="PAN" error={errors.pan} required>
        <input className={`${inp} font-mono uppercase`} placeholder="ABCDE1234F" value={data.pan || ''} onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} />
      </Field>
      <Field label="Full Name" error={errors.full_name} required>
        <input className={inp} placeholder="Rahul Sharma" value={data.full_name || ''} onChange={e => set('full_name', e.target.value)} />
      </Field>

      <Field label="Date of Birth" error={errors.date_of_birth} required>
        <AdvancedDateFilter
          tabOptions={['date']}
          value={{ date: data.date_of_birth }}
          onChange={v => set('date_of_birth', v.date)}
          buttonClassName={inp}
          placeholder="Select Date of Birth"
        />
      </Field>
      <Field label="Care Of" error={errors.care_of} required>
        <input className={inp} placeholder="S/O Ram Sharma" value={data.care_of || ''} onChange={e => set('care_of', e.target.value)} />
      </Field>
      <Field label="Guardian Name" error={errors.guardian_name} required>
        <input className={inp} placeholder="Ram Sharma" value={data.guardian_name || ''} onChange={e => set('guardian_name', e.target.value)} />
      </Field>
      <Field label="Gender" error={errors.gender} required>
        <SelectField
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          value={data.gender ? { value: data.gender, label: data.gender.charAt(0).toUpperCase() + data.gender.slice(1) } : null}
          onChange={opt => set('gender', opt?.value || '')}
          placeholder="Select gender"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Profile Image">
          <ImageUploadField value={data.image || ''} onChange={url => set('image', url)} />
        </Field>
      </div>
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
            <div className="flex gap-3">
              <div className="w-[100px] shrink-0">
                <SelectField
                  options={[
                    { value: '91', label: '+91' },
                    { value: '1', label: '+1' },
                    { value: '44', label: '+44' },
                    { value: '61', label: '+61' },
                    { value: '971', label: '+971' }
                  ]}
                  value={{ value: contact.country_code || '91', label: `+${contact.country_code || '91'}` }}
                  onChange={opt => setC('country_code', opt?.value || '91')}
                />
              </div>
              <div className="flex-1 min-w-0">
                <input className={inp} placeholder="Enter 10 digit number" value={contact.mobile || ''} onChange={e => setC('mobile', e.target.value)} maxLength={10} />
              </div>
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
                <p className={`whitespace-nowrap text-[10px] font-black uppercase tracking-wider ${active ? 'text-sky-600 dark:text-sky-400' : done ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
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
  return e;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClientEdit() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState({
    profile: { pan: '', full_name: '', care_of: '', guardian_name: '', date_of_birth: '', gender: '', image: '' },
    contact: { mobile: '', country_code: '91', email: '' },
    address: { state: '', district: '', town_or_village: '', pincode: '', address_line_1: '', address_line_2: '' },
  });

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/client/details/${username}`, 'GET');
      const d = await res.json();
      if (res.ok && d.success !== false) {
        const client = d.data;
        setData({
          profile: {
            pan: client.profile?.pan || '',
            full_name: client.profile?.full_name || '',
            care_of: client.profile?.care_of || '',
            guardian_name: client.profile?.guardian_name || '',
            date_of_birth: client.profile?.date_of_birth || '',
            gender: client.profile?.gender || '',
            image: client.profile?.image || '',
          },
          contact: {
            mobile: client.profile?.mobile || '',
            country_code: client.profile?.country_code || '91',
            email: client.profile?.email || '',
          },
          address: {
            state: client.address?.state || '',
            district: client.address?.district || '',
            town_or_village: client.address?.town_or_village || '',
            pincode: client.address?.pincode || '',
            address_line_1: client.address?.address_line_1 || '',
            address_line_2: client.address?.address_line_2 || '',
          }
        });
      } else {
        toast.error(d.message || 'Failed to load client');
        navigate('/clients');
      }
    } catch {
      toast.error('Failed to load client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  useEffect(() => {
    if (username) fetchClient();
  }, [fetchClient, username]);

  const setProfile = (v) => setData(p => ({ ...p, profile: v }));
  const setContact = (v) => setData(p => ({ ...p, contact: v }));
  const setAddress = (v) => setData(p => ({ ...p, address: v }));

  const goNext = () => {
    const e = validateStep(step, data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const goBack = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    const e = validateStep(1, data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      const payload = {
        profile: { ...data.profile, ...{ mobile: data.contact.mobile, country_code: data.contact.country_code, email: data.contact.email } },
        address: data.address,
      };
      const res = await apiCall(`/client/details/${username}`, 'PUT', payload);
      const resp = await res.json();
      if (res.ok && resp.success !== false) {
        toast.success('Client updated successfully!');
        setDone(true);
      } else {
        toast.error(resp.message || 'Failed to update client');
      }
    } catch {
      toast.error('Failed to update client');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Client Updated!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">The client profile has been updated successfully.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/clients/${username}`)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm"
            >
              View Profile
            </button>
            <button
              onClick={() => navigate('/clients')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 hover:text-sky-600 transition-all shadow-sm"
            >
              All Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto space-y-2">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/clients/${username}`)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <ChevronLeft size={16} /> Profile
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Edit Client</span>
        </div>

        {/* Step indicator */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm p-6">
          <div className="max-w-md mx-auto">
            <StepIndicator steps={STEPS} current={step} />
          </div>
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
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={step === 0 ? () => navigate(`/clients/${username}`) : goBack}
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
              {submitting ? 'Updating…' : 'Save Changes'}
              {!submitting && <CheckCircle size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
