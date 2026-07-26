import { useState, useEffect } from 'react';
import { UserRole, Vehicle, Permit } from '../types';
import { ShieldAlert, CheckCircle2, QrCode, Printer, Key, Sparkles, Layers, FileCheck } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface AdminDashboardProps {
  currentRole: UserRole;
  onPermitsUpdated: () => void;
  lang?: Language;
}

export default function AdminDashboard({ currentRole, onPermitsUpdated, lang = 'en' }: AdminDashboardProps) {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'all' | 'approvals' | 'batch'>('all');
  const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ev' | 'fuel'>('all');

  const filteredPendingVehicles = pendingVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.owner_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'ev') return matchesSearch && vehicle.is_electric;
    if (filterType === 'fuel') return matchesSearch && !vehicle.is_electric;
    return matchesSearch;
  });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [vendorUid, setVendorUid] = useState('vendor-01');
  const [approvalResult, setApprovalResult] = useState<{
    permit: Permit;
    verification_url: string;
    qr_code_base64: string;
  } | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const pendingRes = await fetch('/api/register/pending', {
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (pendingRes.ok) {
        const pData = await pendingRes.json();
        setPendingVehicles(pData.vehicles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentRole]);

  const handleApprove = async (vin: string) => {
    setIsProcessing(vin);
    setMessage(null);
    setApprovalResult(null);

    try {
      const res = await fetch(`/api/admin/approve-permit/${vin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Permit approval failed.');
      }

      setApprovalResult({
        permit: data.permit,
        verification_url: data.verification_url,
        qr_code_base64: data.qr_code_base64,
      });

      setMessage({
        type: 'success',
        text: `Permit for VIN '${vin}' approved! Cryptographic HMAC-SHA256 signature calculated.`,
      });

      fetchData();
      onPermitsUpdated();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval failed.',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCreatePrintBatch = async () => {
    setIsProcessing('batch');
    setMessage(null);

    try {
      const res = await fetch('/api/admin/create-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
        body: JSON.stringify({ assigned_vendor_id: vendorUid }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Batch creation failed.');
      }

      setMessage({
        type: 'success',
        text: `Print Batch '${data.batch.batch_identifier}' created with ${data.queued_stickers_count} sticker items and dispatched to vendor '${vendorUid}'.`,
      });

      fetchData();
      onPermitsUpdated();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Batch creation failed.',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className={`space-y-6 font-sans ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Module Header Bar with MUI Tabs */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-slate-900 rounded-xl text-white shrink-0 shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">{t.adminTitle}</h2>
            </div>
          </div>

          {/* MUI Style Tab Navigation Bar */}
          <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.viewAll || 'Overview Grid'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t.pendingQueue} ({pendingVehicles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-1.5 ${
                activeTab === 'batch'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.automatedPrintQueue}</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex items-center space-x-4 text-slate-900">
          <div className="p-3 bg-slate-900 text-white rounded-xl shrink-0 shadow-2xs">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Security Signature Engine</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 uppercase tracking-wider">Active & Ready</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex items-center space-x-4 text-slate-900">
          <div className="p-3 bg-slate-100 text-slate-900 border border-slate-200 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400">{t.pendingQueue}</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">{pendingVehicles.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm flex items-center space-x-4 text-slate-900">
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Permit Database</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 uppercase tracking-wider">Connected & Synced</p>
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
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{message.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-xs opacity-90 mt-0.5">{message.text}</p>
          </div>
        </div>
      )}

      {/* QR Approval Modal / Preview callout */}
      {approvalResult && (
        <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-xl text-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-slate-800" />
              <span>{t.newlyApprovedQr}</span>
            </span>
            <button
              onClick={() => setApprovalResult(null)}
              className="text-xs text-slate-400 hover:text-slate-900 font-semibold cursor-pointer"
            >
              {t.dismiss}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
              <img
                src={approvalResult.qr_code_base64}
                alt="QR Sticker Code"
                className="w-44 h-44 mx-auto rounded-lg"
              />
              <p className="text-[10px] font-mono text-slate-700 mt-2 font-bold">{t.hmacSignedQr}</p>
            </div>

            <div className="md:col-span-8 space-y-3 font-mono text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">{t.permitUuid}</span>
                <p className="text-slate-900 font-bold truncate">{approvalResult.permit.permit_token_uuid}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">{t.hmacSignatureHex}</span>
                <p className="text-slate-900 font-bold break-all">{approvalResult.permit.hmac_signature}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">{t.roadsideUrl}</span>
                <p className="text-slate-900 font-bold truncate">{approvalResult.verification_url}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Approval & Batching Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pending Approvals List */}
        {(activeTab === 'all' || activeTab === 'approvals') && (
          <div
            id="admin-pending-queue"
            className={`${
              activeTab === 'approvals' ? 'lg:col-span-12' : 'lg:col-span-7'
            } bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900`}
          >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-slate-700" />
              <span>{t.pendingQueue}</span>
              <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full">
                {filteredPendingVehicles.length}
              </span>
            </h3>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({pendingVehicles.length})
              </button>
              <button
                onClick={() => setFilterType('ev')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === 'ev' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ EV
              </button>
              <button
                onClick={() => setFilterType('fuel')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterType === 'fuel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⛽ Fuel
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search pending applications by VIN, Plate, or Owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs"
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading queue...</div>
          ) : filteredPendingVehicles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              {searchTerm ? 'No matching pending registrations found.' : t.noPendingVehicles}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendingVehicles.map((vehicle) => (
                <div
                  key={vehicle.vin}
                  className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-400 transition shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={vehicle.owner_photo_b2_url}
                      alt={vehicle.owner_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900">{vehicle.license_plate}</h4>
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                          vehicle.is_electric ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {vehicle.is_electric ? 'EV' : `${vehicle.engine_capacity_cc}cc`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{vehicle.owner_name} (ID: {vehicle.owner_national_id})</p>
                      <p className="text-[10px] font-mono text-slate-500">VIN: {vehicle.vin}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApprove(vehicle.vin)}
                    disabled={isProcessing === vehicle.vin}
                    className="bg-[#181C24] hover:bg-[#0B0D12] text-white font-semibold tracking-tight px-4 py-2.5 rounded-xl text-xs shadow-xs transition shrink-0 flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer border border-slate-900 active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isProcessing === vehicle.vin ? t.signing : t.approveSignPermit}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Vendor Print Batching Module */}
        {(activeTab === 'all' || activeTab === 'batch') && (
          <div
            id="admin-print-batch"
            className={`${
              activeTab === 'batch' ? 'lg:col-span-12 max-w-2xl mx-auto w-full' : 'lg:col-span-5'
            } bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900 space-y-4`}
          >
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight pb-3 border-b border-slate-200/80 flex items-center space-x-2">
            <Printer className="w-4 h-4 text-slate-700" />
            <span>{t.automatedPrintQueue}</span>
          </h3>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.assignVendor}
              </label>
              <select
                value={vendorUid}
                onChange={(e) => setVendorUid(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="vendor-01">SecurePrintVendor.Inc (PRT-881)</option>
                <option value="vendor-02">NationalSecurityStickers.Ltd (PRT-902)</option>
              </select>
            </div>

            <button
              onClick={handleCreatePrintBatch}
              disabled={isProcessing === 'batch'}
              className="w-full bg-[#181C24] hover:bg-[#0B0D12] text-white font-bold tracking-tight py-2.5 px-3 rounded-xl shadow-sm transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer border border-slate-900 active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isProcessing === 'batch' ? t.creatingBatch : t.generateBatch}</span>
            </button>
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
