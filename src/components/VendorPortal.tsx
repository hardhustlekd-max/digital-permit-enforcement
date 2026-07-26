import { useState, useEffect } from 'react';
import { UserRole, PrintBatch } from '../types';
import { Printer, CheckCircle2, PackageCheck, Eye, ShieldCheck, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Language, translations } from '../lib/translations';

interface VendorPortalProps {
  currentRole: UserRole;
  lang?: Language;
}

interface ManifestItem {
  permit_id: string;
  vin: string;
  license_plate: string;
  secure_qr_payload_url: string;
  printing_status: string;
  qr_data_url?: string;
}

export default function VendorPortal({ currentRole, lang = 'en' }: VendorPortalProps) {
  const t = translations[lang];

  const [batches, setBatches] = useState<PrintBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [manifestItems, setManifestItems] = useState<ManifestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendor/batches', {
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [currentRole]);

  const handleAcceptBatch = async (batchId: string) => {
    try {
      const res = await fetch(`/api/vendor/batch/${batchId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Batch '${batchId}' order accepted and moved into production.` });
        fetchBatches();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteBatch = async (batchId: string) => {
    try {
      const res = await fetch(`/api/vendor/batch/${batchId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Batch '${batchId}' fulfillment complete! Status set to dispatched.` });
        fetchBatches();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewManifest = async (batchId: string) => {
    setSelectedBatchId(batchId);
    try {
      const res = await fetch(`/api/vendor/batch/${batchId}/manifest`, {
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const rawItems = data.manifest || [];

        // Generate QR codes for printable layout
        const withQr = await Promise.all(
          rawItems.map(async (item: ManifestItem) => {
            const qrUrl = await QRCode.toDataURL(item.secure_qr_payload_url, {
              margin: 1,
              width: 200,
            });
            return { ...item, qr_data_url: qrUrl };
          })
        );

        setManifestItems(withQr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`space-y-6 font-sans ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Module Header Bar */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 rounded-xl text-white shrink-0 shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900">{t.vendorTitle}</h2>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center space-x-2.5 font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Batches Queue */}
        <div id="vendor-batches" className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <PackageCheck className="w-4 h-4 text-slate-700" />
              <span>{t.assignedBatches}</span>
            </h3>
            <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full">
              {batches.length} {t.orders}
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading queue...</div>
          ) : batches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No print batches currently assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className={`bg-slate-50/80 border p-4 rounded-xl space-y-3 transition shadow-2xs ${
                    selectedBatchId === batch.id ? 'border-slate-900 ring-2 ring-slate-900/10 bg-white' : 'border-slate-200/80 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold font-mono text-slate-900">{batch.batch_identifier}</h4>
                      <p className="text-xs text-slate-600">{t.totalStickers} {batch.total_stickers}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-md font-bold ${
                      batch.batch_status === 'dispatched'
                        ? 'bg-emerald-100 text-emerald-800'
                        : batch.batch_status === 'in_production'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {batch.batch_status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 gap-2">
                    {batch.batch_status === 'pending_acceptance' && (
                      <button
                        onClick={() => handleAcceptBatch(batch.id)}
                        className="bg-[#181C24] hover:bg-[#0B0D12] text-white font-semibold tracking-tight px-3.5 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer border border-slate-900 active:scale-[0.98]"
                      >
                        {t.acceptBatch}
                      </button>
                    )}

                    {batch.batch_status === 'in_production' && (
                      <button
                        onClick={() => handleCompleteBatch(batch.id)}
                        className="bg-[#181C24] hover:bg-[#0B0D12] text-white font-semibold tracking-tight px-3.5 py-2 rounded-xl text-xs shadow-xs transition cursor-pointer border border-slate-900 active:scale-[0.98]"
                      >
                        {t.markDispatched}
                      </button>
                    )}

                    <button
                      onClick={() => handleViewManifest(batch.id)}
                      className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition flex items-center space-x-1.5 ml-auto cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-700" />
                      <span>{t.viewLayout}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manifest & Printable Sticker Layout Preview */}
        <div id="vendor-preview" className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-slate-700" />
              <span>{t.sanitizedManifest}</span>
            </h3>
          </div>

          {!selectedBatchId ? (
            <div className="my-auto py-20 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              {t.selectBatchPrompt}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between font-bold">
                <span>Print Layout for Batch <strong className="font-mono text-slate-900 font-bold">{selectedBatchId}</strong></span>
                <span className="text-[11px] font-mono text-slate-600 font-bold">{manifestItems.length} Stickers</span>
              </div>

              {/* Printable Sticker Sheet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-1">
                {manifestItems.map((item, idx) => (
                  <div
                    key={item.permit_id || idx}
                    className="bg-white text-slate-900 p-4 rounded-xl shadow-2xs border-2 border-slate-200 flex flex-col items-center text-center space-y-2 relative"
                  >
                    <div className="w-full flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] font-mono font-bold text-slate-500">
                      <span>{t.officialPermit}</span>
                      <span className="text-slate-900 font-extrabold bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-md">SUB-110cc / EV</span>
                    </div>

                    {item.qr_data_url && (
                      <img src={item.qr_data_url} alt="Sticker QR" className="w-32 h-32 border border-slate-200 p-1.5 bg-white rounded-lg" />
                    )}

                    <div className="w-full font-mono text-xs space-y-0.5 pt-1">
                      <p className="font-extrabold text-sm text-slate-900">{item.license_plate || 'PLATE-PENDING'}</p>
                      <p className="text-[10px] text-slate-600 truncate">VIN: {item.vin || 'VIN-PENDING'}</p>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono italic pt-1 border-t border-slate-200 w-full">
                      {t.noPiiExposed}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
