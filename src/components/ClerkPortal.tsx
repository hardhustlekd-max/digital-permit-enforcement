import React, { useState, useEffect } from 'react';
import { UserRole, Vehicle } from '../types';
import { Upload, FileText, CheckCircle2, AlertCircle, Camera, CloudUpload, Shield, Bike, Zap, RefreshCw } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface ClerkPortalProps {
  currentRole: UserRole;
  onVehicleRegistered: () => void;
  lang?: Language;
}

export default function ClerkPortal({ currentRole, onVehicleRegistered, lang = 'en' }: ClerkPortalProps) {
  const t = translations[lang];

  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [engineCc, setEngineCc] = useState('100');
  const [isElectric, setIsElectric] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerNationalId, setOwnerNationalId] = useState('');

  const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(null);
  const [ownerPhotoPreview, setOwnerPhotoPreview] = useState<string | null>(null);

  const [permitScanFile, setPermitScanFile] = useState<File | null>(null);
  const [permitScanName, setPermitScanName] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'form' | 'table'>('all');
  const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  const fetchPendingVehicles = async () => {
    setIsLoadingPending(true);
    try {
      const res = await fetch('/api/register/pending', {
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingVehicles(data.vehicles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPendingVehicles();
  }, [currentRole]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOwnerPhotoFile(file);
      setOwnerPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleScanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPermitScanFile(file);
      setPermitScanName(file.name);
    }
  };

  const handleCcChange = (val: string) => {
    setEngineCc(val);
    const num = parseInt(val || '0', 10);
    if (num === 0) {
      setIsElectric(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setMessage({ type: 'error', text: 'VIN must be exactly 17 characters in length.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('vin', cleanVin);
      formData.append('license_plate', licensePlate.trim().toUpperCase());
      formData.append('engine_capacity_cc', engineCc);
      formData.append('is_electric', String(isElectric));
      formData.append('owner_name', ownerName.trim());
      formData.append('owner_national_id', ownerNationalId.trim());

      if (ownerPhotoFile) {
        formData.append('owner_photo', ownerPhotoFile);
      }

      if (permitScanFile) {
        formData.append('permit_scan', permitScanFile);
      }

      const res = await fetch('/api/register/vehicle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Vehicle registration failed.');
      }

      setMessage({
        type: 'success',
        text: `Vehicle '${data.vehicle.license_plate}' (VIN: ${data.vehicle.vin}) registered successfully!`,
      });

      // Reset form
      setVin('');
      setLicensePlate('');
      setOwnerName('');
      setOwnerNationalId('');
      setOwnerPhotoFile(null);
      setOwnerPhotoPreview(null);
      setPermitScanFile(null);
      setPermitScanName(null);

      fetchPendingVehicles();
      onVehicleRegistered();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Registration failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 font-sans ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Module Header Bar with Classic Tabs */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-slate-900 rounded-xl text-white shrink-0 shadow-xs">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">{t.clerkPortalTitle}</h2>
            </div>
          </div>
        </div>

        {/* Classic Style Tab Selector */}
        <div className="border-b border-slate-200">
          <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 px-1 text-xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 border-b-2 -mb-px ${
                activeTab === 'all'
                  ? 'border-slate-900 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 font-semibold'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.viewAll || 'Overview Grid'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`pb-2.5 px-1 text-xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 border-b-2 -mb-px ${
                activeTab === 'form'
                  ? 'border-slate-900 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 font-semibold'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>{t.vehicleOwnerRegistration}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`pb-2.5 px-1 text-xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 border-b-2 -mb-px ${
                activeTab === 'table'
                  ? 'border-slate-900 text-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 font-semibold'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.pendingVehicles} ({pendingVehicles.length})</span>
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{message.type === 'success' ? 'Registration Successful' : 'Registration Error'}</p>
            <p className="text-xs opacity-90 mt-0.5">{message.text}</p>
          </div>
        </div>
      )}

      {/* Main Registration Grid with Tab Views */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Registration Form */}
        {(activeTab === 'all' || activeTab === 'form') && (
          <div
            id="registration-form"
            className={`${
              activeTab === 'form' ? 'lg:col-span-12 max-w-3xl mx-auto w-full' : 'lg:col-span-7'
            } bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900`}
          >
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight mb-5 pb-3 border-b border-slate-200/80 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Bike className="w-4 h-4 text-slate-700" />
              <span>{t.vehicleOwnerRegistration}</span>
            </span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Info Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.ownerFullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abebe Bikila"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.ownerNationalId}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ID-1092847291"
                  value={ownerNationalId}
                  onChange={(e) => setOwnerNationalId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Vehicle Identification Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                  <span>{t.vinString}</span>
                  <span className="font-mono text-[10px] text-slate-400">{vin.length}/17</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  placeholder="e.g. 1HGCR2F83HA000101"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 uppercase transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.licensePlate}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA-101-EV"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 uppercase transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Powertrain & Engine CC */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{t.powertrainSpec}</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isElectric}
                    onChange={(e) => {
                      setIsElectric(e.target.checked);
                      if (e.target.checked) setEngineCc('0');
                    }}
                    className="w-4 h-4 rounded text-slate-900 accent-slate-900 border-slate-300 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-900 flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {t.pureEv}
                  </span>
                </label>
              </div>

              {!isElectric && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.engineCapacity}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      max={110}
                      min={1}
                      value={engineCc}
                      onChange={(e) => handleCcChange(e.target.value)}
                      className="w-32 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <span className="text-xs font-mono text-slate-500">{t.max110cc}</span>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Streams */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* Operator Photo Stream */}
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50 p-4 rounded-xl text-center transition">
                <p className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-center space-x-1">
                  <Camera className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t.operatorPhoto}</span>
                </p>

                {ownerPhotoPreview ? (
                  <div className="relative group w-20 h-20 mx-auto my-2">
                    <img
                      src={ownerPhotoPreview}
                      alt="Owner Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-800 shadow-xs"
                    />
                    <label className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 cursor-pointer transition uppercase font-medium">
                      Change
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-3">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-900 font-bold hover:underline">{t.uploadPhoto}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Permit Paper Scan Stream */}
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50 p-4 rounded-xl text-center transition">
                <p className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t.paperPermitScan}</span>
                </p>

                {permitScanName ? (
                  <div className="py-2">
                    <div className="inline-flex items-center space-x-2 text-xs text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg max-w-full truncate">
                      <FileText className="w-4 h-4 shrink-0 text-slate-700" />
                      <span className="truncate font-bold">{permitScanName}</span>
                    </div>
                    <label className="block text-[10px] text-slate-900 font-bold hover:underline cursor-pointer mt-2">
                      Replace Scan
                      <input type="file" accept="image/*,.pdf" onChange={handleScanChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-3">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-900 font-bold hover:underline">{t.uploadDocumentScan}</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleScanChange} className="hidden" />
                  </label>
                )}
              </div>

            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#181C24] hover:bg-[#0B0D12] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 text-xs sm:text-sm cursor-pointer active:scale-[0.99] border border-slate-900"
            >
              {isSubmitting ? (
                <span>{t.submittingAssets}</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{t.submitProfile}</span>
                </>
              )}
            </button>

          </form>
        </div>
        )}

        {/* Pending Vehicles Queue */}
        {(activeTab === 'all' || activeTab === 'table') && (
          <div
            id="pending-queue"
            className={`${
              activeTab === 'table' ? 'lg:col-span-12' : 'lg:col-span-5'
            } bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900 flex flex-col`}
          >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{t.pendingApprovals}</span>
              <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                {pendingVehicles.length}
              </span>
            </h3>
            <button
              onClick={fetchPendingVehicles}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3 text-slate-700" />
              <span>{t.refresh}</span>
            </button>
          </div>

          {isLoadingPending ? (
            <div className="py-12 text-center text-slate-400 text-xs">{t.queryingQueue}</div>
          ) : pendingVehicles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl my-auto">
              {t.noPendingVehicles}
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {pendingVehicles.map((vehicle) => (
                <div
                  key={vehicle.vin}
                  className="bg-slate-50/80 border border-slate-200/80 hover:border-slate-400 p-4 rounded-xl transition shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={vehicle.owner_photo_b2_url}
                        alt={vehicle.owner_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{vehicle.license_plate}</h4>
                        <p className="text-xs text-slate-600">{vehicle.owner_name}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md ${
                      vehicle.is_electric ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {vehicle.is_electric ? 'EV' : `${vehicle.engine_capacity_cc}cc`}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>VIN: {vehicle.vin}</span>
                    <span className="text-amber-700 font-sans font-semibold uppercase tracking-wider bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px]">{t.awaitingApproval}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

      </div>
    </div>
  );
}
