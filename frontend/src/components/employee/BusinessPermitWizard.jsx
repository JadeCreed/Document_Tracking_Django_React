import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { createDocument } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  'Basic Information',    
  'Other Information',   
  'E-Signature',          
  'Fire Station Section', 
  'Review & Submit',      
];

export default function BusinessPermitWizard({ documentTypeId, onClose, onCreated }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward'); // controls slide direction
  const [loading, setLoading] = useState(false);
  const sigPadRef = useRef(null);

  const [form, setForm] = useState({
    // Step 2 — Tax Year + Applicant Basic Info
    tax_year: new Date().getFullYear().toString(),
    application_mode: 'new', // 'new' | 'renewal'
    payment_mode: 'annually',
    date_of_application: new Date().toISOString().split('T')[0],
    tin_no: '',
    dti_reg_no: '',
    dti_reg_date: '',
    business_type: 'single',
    last_name: '',
    first_name: '',
    middle_name: '',
    business_name: '',
    trade_name: '',

    // Step 3 — Other Information
    business_address: '',
    business_postal_code: '',
    business_email: '',
    business_telephone: '',
    business_mobile: '',
    owner_address: '',
    owner_postal_code: '',
    owner_email: '',
    owner_telephone: '',
    owner_mobile: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_address: '',
    floor_area: '',
    total_employees: '',
    employees_male: '',
    employees_female: '',
    employees_residing_lgu: '',
    is_rented: false,
    lessor_name: '',
    lessor_address: '',
    lessor_phone: '',
    monthly_rental: '',
    building_name: '',
    building_address: '',

    // Step 4 — Signature
    signature: '',
    position_title: '',

    // Step 5 — Fire Station Section (BACK sheet — existing fields)
    application_no: '',
    applicant_name: '',
    business_name_back: '', // kept separate in case it differs, mirrors business_name by default
    contact_no: '',
    address: '',
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    update(name, type === 'checkbox' ? checked : value);
  };

  const goNext = () => {
    // Check kung nasa Step 3 (Signature) at may drawing sa pad
    if (step === 3 && sigPadRef.current) {
      if (!sigPadRef.current.isEmpty()) {
        // FIX: Ginawang getCanvas() para hindi mag-error sa Vite
        const dataUrl = sigPadRef.current.getCanvas().toDataURL('image/png');
        setForm(prev => ({ ...prev, signature: dataUrl }));
      }
    }
    
    setDirection('forward');
    setStep((prevStep) => Math.min(prevStep + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection('backward');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSaveSignature = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      // FIX: Ginawang getCanvas() para hindi mag-error sa Vite
      const dataUrl = sigPadRef.current.getCanvas().toDataURL('image/png');
      update('signature', dataUrl);
    }
  };

  const handleClearSignature = () => {
    sigPadRef.current?.clear();
    update('signature', '');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Auto-fill the Fire Station section fields from the data already
      // collected, so the citizen doesn't have to re-type the same info.
      const payload = {
        ...form,
        applicant_name: form.applicant_name || `${form.first_name} ${form.last_name}`.trim(),
        address: form.address || form.business_address,
      };

      const res = await createDocument({
        document_type: documentTypeId,
        form_data: payload,
      });
      showToast(`Document ${res.data.tracking_number} created.`, 'success');
      onCreated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create document.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overlay-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl modal-pop-in max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header + progress */}
        <div className="px-8 pt-7 pb-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">New Business Permit Request</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Step {step} of {TOTAL_STEPS}: {STEP_LABELS[step - 1]}
          </p>
          <div className="mt-3 flex gap-1.5">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-blue-600' : 'bg-slate-100'}`}
              />
            ))}
          </div>
        </div>

        {/* Step content with slide animation */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div key={step} className={direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}>

            {step === 1 && (
              <StepBasicInfo form={form} handleChange={handleChange} />
            )}
            {step === 2 && (
              <StepOtherInfo form={form} handleChange={handleChange} update={update} />
            )}
            {step === 3 && (
              <StepSignature
                form={form}
                handleChange={handleChange}
                sigPadRef={sigPadRef}
                onSaveSignature={handleSaveSignature}
                onClearSignature={handleClearSignature}
              />
            )}
            {step === 4 && (
              <StepFireStation form={form} handleChange={handleChange} />
            )}
            {step === 5 && (
              <StepReview form={form} />
            )}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-between shrink-0">
          <button
            onClick={step === 1 ? onClose : goBack}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={goNext}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm transition-colors"
            >
              {loading ? 'Saving…' : 'Save Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Reusable small field components ---
function Field({ label, name, value, onChange, placeholder = '', type = 'text', span = 1 }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options, span = 1 }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{label}</label>
      <select
        name={name} value={value} onChange={onChange}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// --- STEP 1: Tax Year + Applicant Basic Info ---
function StepBasicInfo({ form, handleChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tax Year" name="tax_year" value={form.tax_year} onChange={handleChange} />
        <Select
          label="Application Type" name="application_mode" value={form.application_mode} onChange={handleChange}
          options={[{ value: 'new', label: 'New' }, { value: 'renewal', label: 'Renewal' }]}
        />
      </div>

      <Select
        label="Mode of Payment" name="payment_mode" value={form.payment_mode} onChange={handleChange}
        options={[
          { value: 'annually', label: 'Annually' },
          { value: 'semi_annually', label: 'Semi-Annually' },
          { value: 'quarterly', label: 'Quarterly' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Application" name="date_of_application" type="date" value={form.date_of_application} onChange={handleChange} />
        <Field label="TIN No." name="tin_no" value={form.tin_no} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="DTI/SEC/CDA Registration No." name="dti_reg_no" value={form.dti_reg_no} onChange={handleChange} />
        <Field label="DTI/SEC/CDA Registration Date" name="dti_reg_date" type="date" value={form.dti_reg_date} onChange={handleChange} />
      </div>

      <Select
        label="Type of Business" name="business_type" value={form.business_type} onChange={handleChange}
        options={[
          { value: 'single', label: 'Single' },
          { value: 'partnership', label: 'Partnership' },
          { value: 'corporation', label: 'Corporation' },
          { value: 'cooperative', label: 'Cooperative' },
        ]}
      />

      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Name of Taxpayer / Registrant</p>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
        <Field label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
        <Field label="Middle Name" name="middle_name" value={form.middle_name} onChange={handleChange} />
      </div>

      <Field label="Business Name" name="business_name" value={form.business_name} onChange={handleChange} />
      <Field label="Trade Name / Franchise" name="trade_name" value={form.trade_name} onChange={handleChange} />
    </div>
  );
}

// --- STEP 2: Other Information ---
function StepOtherInfo({ form, handleChange, update }) {
  return (
    <div className="space-y-5">
      <Field label="Business Address" name="business_address" value={form.business_address} onChange={handleChange} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Postal Code" name="business_postal_code" value={form.business_postal_code} onChange={handleChange} />
        <Field label="Email Address" name="business_email" value={form.business_email} onChange={handleChange} />
        <Field label="Telephone No." name="business_telephone" value={form.business_telephone} onChange={handleChange} />
        <Field label="Mobile No." name="business_mobile" value={form.business_mobile} onChange={handleChange} />
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Owner's Address</p>
      <Field label="Address" name="owner_address" value={form.owner_address} onChange={handleChange} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Postal Code" name="owner_postal_code" value={form.owner_postal_code} onChange={handleChange} />
        <Field label="Email Address" name="owner_email" value={form.owner_email} onChange={handleChange} />
        <Field label="Telephone No." name="owner_telephone" value={form.owner_telephone} onChange={handleChange} />
        <Field label="Mobile No." name="owner_mobile" value={form.owner_mobile} onChange={handleChange} />
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Emergency Contact</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact Person Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
        <Field label="Telephone/Mobile No." name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} />
      </div>
      <Field label="Address" name="emergency_contact_address" value={form.emergency_contact_address} onChange={handleChange} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Business Area (sq m.)" name="floor_area" value={form.floor_area} onChange={handleChange} />
        <Field label="Total No. of Employees" name="total_employees" value={form.total_employees} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Male Employees" name="employees_male" value={form.employees_male} onChange={handleChange} />
        <Field label="Female Employees" name="employees_female" value={form.employees_female} onChange={handleChange} />
        <Field label="Residing within LGU" name="employees_residing_lgu" value={form.employees_residing_lgu} onChange={handleChange} />
      </div>

      <label className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <input
          type="checkbox" name="is_rented" checked={form.is_rented}
          onChange={(e) => update('is_rented', e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <span className="text-sm font-medium text-slate-700">Note: Fill up only if business place is rented</span>
      </label>

      {form.is_rented && (
        <div className="space-y-4 bg-slate-50 rounded-xl p-4 animate-in">
          <Field label="Lessor's Full Name" name="lessor_name" value={form.lessor_name} onChange={handleChange} />
          <Field label="Lessor's Full Address" name="lessor_address" value={form.lessor_address} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lessor's Telephone/Mobile No." name="lessor_phone" value={form.lessor_phone} onChange={handleChange} />
            <Field label="Monthly Rental" name="monthly_rental" value={form.monthly_rental} onChange={handleChange} />
          </div>
          <Field label="Name of the Building Rented" name="building_name" value={form.building_name} onChange={handleChange} />
          <Field label="Address of the Building" name="building_address" value={form.building_address} onChange={handleChange} />
        </div>
      )}
    </div>
  );
}

// --- STEP 3: E-Signature ---
function StepSignature({ form, handleChange, sigPadRef, onSaveSignature, onClearSignature }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Have the applicant sign below using a mouse, touchscreen, or stylus. This will be embedded
        in the exported form above the signature line.
      </p>

      <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
        {form.signature ? (
          <div className="p-4 flex flex-col items-center gap-3">
            <img src={form.signature} alt="Signature" className="h-24 bg-white rounded-lg border border-slate-200 px-4" />
            <button onClick={onClearSignature} className="text-xs font-bold text-red-600 uppercase tracking-wide">
              Clear & Re-sign
            </button>
          </div>
        ) : (
          <>
            <SignatureCanvas
              ref={sigPadRef} 
              penColor="black"
              canvasProps={{ className: 'w-full h-48 bg-white' }}
            />
            <div className="flex justify-between p-3 bg-slate-100">
              <button onClick={onClearSignature} className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Clear
              </button>
              <button onClick={onSaveSignature} className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                Save Signature
              </button>
            </div>
          </>
        )}
      </div>

      <Field label="Position/Title" name="position_title" value={form.position_title} onChange={handleChange} placeholder="e.g. Owner, Manager" />
    </div>
  );
}

// --- STEP 4: Fire Station Section (existing BACK sheet fields) ---
function StepFireStation({ form, handleChange }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        This section is required by the City/Municipality Fire Station for inspection records.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Application No." name="application_no" value={form.application_no} onChange={handleChange} placeholder="2024-XXXX" />
        <Field label="Contact No." name="contact_no" value={form.contact_no} onChange={handleChange} />
      </div>
      <Field
        label="Name of Applicant / Owner"
        name="applicant_name"
        value={form.applicant_name || `${form.first_name} ${form.last_name}`.trim()}
        onChange={handleChange}
      />
      <Field
        label="Name of Business"
        name="business_name_back"
        value={form.business_name_back || form.business_name}
        onChange={handleChange}
      />
      <Field label="Total Floor Area" name="floor_area" value={form.floor_area} onChange={handleChange} />
      <Field
        label="Address of Establishment"
        name="address"
        value={form.address || form.business_address}
        onChange={handleChange}
      />
    </div>
  );
}

// --- STEP 5: Review ---
function StepReview({ form }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 mb-2">Please review before saving. Click Back to make changes.</p>
      {[
        ['Business Name', form.business_name],
        ['Applicant', `${form.first_name} ${form.last_name}`.trim()],
        ['Tax Year', form.tax_year],
        ['Date of Application', form.date_of_application],
        ['Business Address', form.business_address],
        ['Floor Area', form.floor_area],
        ['Signature', form.signature ? '✓ Captured' : '— Not provided'],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm border-b border-slate-100 pb-2">
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-800">{value || '—'}</span>
        </div>
      ))}
    </div>
  );
}