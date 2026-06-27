// ── Create Service Request Modal ─────────────────────────────────────────────
//
// FIXES applied:
//  1. apiCall() returns the raw fetch Response object (confirmed from
//     utils/apiCall.js) — every call site here was treating the Response
//     itself as the parsed body (`result?.success`, `result?.data`, etc.),
//     which is always undefined on a Response. Added `.json()` on the
//     awaited response everywhere it's used in this file.
//  2. Removed `loadingClients` / `loadingServices` from useCallback deps —
//     they caused the functions to be recreated on every render, triggering
//     duplicate requests in a tight loop.
//  3. Used a ref-based guard instead of the stale state value to prevent
//     concurrent fetches.
//  4. Removed `agentUsername` from fetchClients deps (it isn't used there).
//  5. `onInputChange={(val) => fetchClients(1, val)}` / `fetchServices(...)`
//     returned the Promise from the async fetch function. react-select uses
//     the return value of onInputChange as the new input text when it isn't
//     undefined, so it was setting the input box's text to that Promise —
//     which stringifies as "[object Promise]" (visible in the Service field)
//     and also corrupted the Client field's display after selecting a value.
//     Fixed by calling the fetch as a side effect and explicitly returning
//     `val` (the actual typed string) instead.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import SelectField from '../components/common/SelectField';
import Modal from '../components/common/Modal';

function CreateServiceRequestModal({ isOpen, onClose, onSuccess, agentUsername }) {
  const [formData, setFormData] = useState({
    client: null,
    firm: null,
    service: null,
    remark: '',
  });

  const [clientOptions, setClientOptions]   = useState([]);
  const [firmOptions, setFirmOptions]       = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);

  const [clientPagination, setClientPagination]   = useState({ page_no: 1, is_last_page: true });
  const [servicePagination, setServicePagination] = useState({ page_no: 1, is_last_page: true });

  const [loadingClients,  setLoadingClients]  = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  const [selectedClientData, setSelectedClientData] = useState(null);

  // Ref-based in-flight guards so useCallback doesn't need loading state in deps
  const fetchingClientsRef  = useRef(false);
  const fetchingServicesRef = useRef(false);

  // ── fetch clients ──────────────────────────────────────────────────────────
  const fetchClients = useCallback(async (pageNo = 1, searchTerm = '') => {
    if (fetchingClientsRef.current) return;
    fetchingClientsRef.current = true;
    setLoadingClients(true);

    try {
      // apiCall returns the raw Response — parse the body here.
      const response = await apiCall(
        `/client/list?status=active&page_no=${pageNo}&limit=20&search=${encodeURIComponent(searchTerm)}`,
        'GET'
      );
      const result = await response.json();

      if (result?.success) {
        const newOptions = (result.data || []).map((client) => ({
          value: client.username,
          label: `${client.name} (${client.username})`,
          clientData: client,
        }));

        setClientOptions((prev) => (pageNo === 1 ? newOptions : [...prev, ...newOptions]));
        setClientPagination(result.pagination);
      } else {
        toast.error(result?.message || 'Failed to load clients');
      }
    } catch (err) {
      console.error('fetchClients error:', err);
      toast.error('Failed to load clients');
    } finally {
      fetchingClientsRef.current = false;
      setLoadingClients(false);
    }
  }, []); // no deps that change — stable reference

  // ── fetch services ─────────────────────────────────────────────────────────
  const fetchServices = useCallback(async (pageNo = 1, searchTerm = '') => {
    if (fetchingServicesRef.current) return;
    fetchingServicesRef.current = true;
    setLoadingServices(true);

    try {
      const response = await apiCall(
        `/service/list?page_no=${pageNo}&limit=20&search=${encodeURIComponent(searchTerm)}&type=general`,
        'GET'
      );
      const result = await response.json();

      if (result?.success) {
        const newOptions = (result.data || []).map((service) => ({
          value: service.service_id,
          label: `${service.name} - ₹${service.charges?.total ?? 0}`,
          serviceData: service,
        }));

        setServiceOptions((prev) => (pageNo === 1 ? newOptions : [...prev, ...newOptions]));
        setServicePagination(result.pagination);
      } else {
        toast.error(result?.message || 'Failed to load services');
      }
    } catch (err) {
      console.error('fetchServices error:', err);
      toast.error('Failed to load services');
    } finally {
      fetchingServicesRef.current = false;
      setLoadingServices(false);
    }
  }, []); // stable reference

  // ── load on open / reset on close ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Reset
    setFormData({ client: null, firm: null, service: null, remark: '' });
    setSelectedClientData(null);
    setFirmOptions([]);
    setClientOptions([]);
    setServiceOptions([]);

    fetchClients(1, '');
    fetchServices(1, '');
  }, [isOpen]); // fetchClients / fetchServices are stable so safe to omit

  // ── client selection ───────────────────────────────────────────────────────
  const handleClientChange = (selected) => {
    setFormData((prev) => ({ ...prev, client: selected, firm: null }));
    setSelectedClientData(selected?.clientData ?? null);

    const firms = selected?.clientData?.firms ?? [];
    setFirmOptions(
      firms.map((f) => ({
        value: f.firm_id,
        label: `${f.firm_name} (${f.firm_type})`,
        firmData: f,
      }))
    );
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.client)  { toast.error('Please select a client');  return; }
    if (!formData.firm)    { toast.error('Please select a firm');    return; }
    if (!formData.service) { toast.error('Please select a service'); return; }

    setSubmitting(true);
    try {
      const response = await apiCall('/service/service-request/create', 'POST', {
        username:   formData.client.value,
        firm_id:    formData.firm.value,
        service_id: formData.service.value,
        remark:     formData.remark || '',
      });
      const result = await response.json();

      if (result?.success) {
        toast.success('Service request created successfully!');
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(result?.message || 'Failed to create service request');
      }
    } catch (err) {
      console.error('handleSubmit error:', err);
      toast.error('Failed to create service request');
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyles = useMemo(() => ({
    menu:     (p) => ({ ...p, zIndex: 9999 }),
    menuList: (p) => ({ ...p, maxHeight: '200px', overflowY: 'auto' }),
    option:   (p, s) => ({
      ...p,
      backgroundColor: s.isSelected ? '#6B46C1' : s.isFocused ? '#E9D8FD' : 'transparent',
      color:  s.isSelected ? 'white' : '#1A202C',
      cursor: 'pointer',
      padding:  '8px 12px',
      fontSize: '13px',
    }),
  }), []);

  const canSubmit = !submitting && formData.client && formData.firm && formData.service;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Service Request"
      icon={FileText}
      size="2xl"
      closeText="Cancel"
      footer={
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-4 py-2.5 rounded-md text-white text-sm font-semibold flex items-center gap-2 ${
            canSubmit
              ? 'bg-emerald-600 hover:bg-emerald-700 transition-colors'
              : 'bg-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> Creating...</>
          ) : (
            <><Plus size={16} /> Create Request</>
          )}
        </button>
      }
    >
      <div className="space-y-5 px-1 py-2">

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Select Client *
          </label>
          <SelectField
            styles={selectStyles}
            options={clientOptions}
            value={formData.client}
            onChange={handleClientChange}
            onInputChange={(val) => {
              fetchClients(1, val);
              return val;
            }}
            isLoading={loadingClients}
            placeholder="Search and select a client..."
            isClearable
            noOptionsMessage={({ inputValue }) =>
              loadingClients ? 'Loading...' :
              inputValue.length < 2 ? 'Type at least 2 characters to search' :
              'No clients found'
            }
            onMenuScrollToBottom={() => {
              if (!clientPagination.is_last_page && !fetchingClientsRef.current) {
                fetchClients(clientPagination.page_no + 1, '');
              }
            }}
          />
        </div>

        {/* Client details preview */}
        {selectedClientData && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Client Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Name:</span> {selectedClientData.name}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Email:</span> {selectedClientData.email}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">Mobile:</span> +{selectedClientData.country_code} {selectedClientData.mobile}</div>
              <div><span className="font-medium text-slate-500 dark:text-slate-400">PAN:</span> {selectedClientData.pan_number}</div>
            </div>
          </div>
        )}

        {/* Firm */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Select Firm *
          </label>
          <SelectField
            styles={selectStyles}
            options={firmOptions}
            value={formData.firm}
            onChange={(sel) => setFormData((prev) => ({ ...prev, firm: sel }))}
            isDisabled={!formData.client}
            placeholder={formData.client ? 'Select a firm...' : 'Please select a client first'}
            isClearable
            noOptionsMessage={() =>
              !formData.client ? 'Select a client first' : 'No firms available for this client'
            }
          />
        </div>

        {/* Service */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Select Service *
          </label>
          <SelectField
            styles={selectStyles}
            options={serviceOptions}
            value={formData.service}
            onChange={(sel) => setFormData((prev) => ({ ...prev, service: sel }))}
            onInputChange={(val) => {
              fetchServices(1, val);
              return val;
            }}
            isLoading={loadingServices}
            placeholder="Search and select a service..."
            isClearable
            noOptionsMessage={({ inputValue }) =>
              loadingServices ? 'Loading...' :
              inputValue.length < 2 ? 'Type at least 2 characters to search' :
              'No general services found'
            }
            onMenuScrollToBottom={() => {
              if (!servicePagination.is_last_page && !fetchingServicesRef.current) {
                fetchServices(servicePagination.page_no + 1, '');
              }
            }}
          />
        </div>

        {/* Remark */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Remark (Optional)
          </label>
          <textarea
            value={formData.remark}
            onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
            placeholder="Add any additional notes for the office..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-900 dark:text-white"
            rows="3"
          />
        </div>

      </div>
    </Modal>
  );
}

export default CreateServiceRequestModal;