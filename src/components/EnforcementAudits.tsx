import { useState, useEffect } from 'react';
import { UserRole, EnforcementAudit } from '../types';
import { ShieldCheck, MapPin, AlertTriangle, ShieldAlert, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface EnforcementAuditsProps {
  currentRole: UserRole;
  lang?: Language;
}

export default function EnforcementAudits({ currentRole, lang = 'en' }: EnforcementAuditsProps) {
  const t = translations[lang];

  const [audits, setAudits] = useState<EnforcementAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAudits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/enforcement/audits', {
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [currentRole]);

  return (
    <div className={`space-y-4 font-roboto ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Module Header Bar */}
      <div className="bg-white border border-[#E0E0E0] p-4 rounded mui-elevation-1 text-[#212121]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1976D2] rounded text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1976D2]">{t.auditTitle}</h2>
              <p className="text-slate-600 text-xs mt-0.5">
                {t.auditDesc}
              </p>
            </div>
          </div>

          <button
            onClick={fetchAudits}
            className="bg-white hover:bg-slate-100 text-[#212121] px-3.5 py-2 rounded text-xs font-medium uppercase tracking-wider border border-[#E0E0E0] shadow-2xs transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1976D2] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.refreshFeed}</span>
          </button>
        </div>
      </div>

      {/* Audit Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E0E0E0] p-4 sm:p-5 rounded flex items-center justify-between text-[#212121] mui-elevation-1">
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Verified Compliant</p>
            <p className="text-xl font-extrabold text-[#212121] mt-1">
              {audits.filter(a => a.audit_result === 'valid_green').length}
            </p>
          </div>
          <div className="p-2.5 bg-[#E8F5E9] rounded border border-[#A5D6A7]">
            <CheckCircle2 className="w-6 h-6 text-[#2E7D32]" />
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] p-4 sm:p-5 rounded flex items-center justify-between text-[#212121] mui-elevation-1">
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Expired / Unrenewed</p>
            <p className="text-xl font-extrabold text-[#212121] mt-1">
              {audits.filter(a => a.audit_result === 'expired_amber').length}
            </p>
          </div>
          <div className="p-2.5 bg-[#FFF3E0] rounded border border-[#FFE0B2]">
            <AlertTriangle className="w-6 h-6 text-[#ED6C02]" />
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] p-4 sm:p-5 rounded flex items-center justify-between text-[#212121] mui-elevation-1">
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Fraud / Forged Signature</p>
            <p className="text-xl font-extrabold text-[#212121] mt-1">
              {audits.filter(a => a.audit_result === 'fraud_red').length}
            </p>
          </div>
          <div className="p-2.5 bg-[#FFEBEE] rounded border border-[#FFCDD2]">
            <ShieldAlert className="w-6 h-6 text-[#D32F2F]" />
          </div>
        </div>
      </div>

      {/* Audits Table */}
      <div id="audit-stream" className="bg-white border border-[#E0E0E0] rounded p-5 mui-elevation-1 text-[#212121]">
        <h3 className="text-sm font-bold text-[#1976D2] uppercase tracking-wider mb-4 pb-3 border-b border-[#E0E0E0] flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#1976D2]" />
          <span>{t.realtimeAuditStream}</span>
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Querying audit logs...</div>
        ) : audits.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-[#E0E0E0] rounded">
            No roadside enforcement scans recorded yet. Select Roadside Officer Scanner in the dropdown menu to perform scans!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#212121] font-roboto">
              <thead className="bg-[#F5F5F5] text-slate-600 font-mono text-[10px] uppercase border-b border-[#E0E0E0]">
                <tr>
                  <th className="p-3">Audit ID / Time</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Scanned Plate & VIN</th>
                  <th className="p-3">Officer Badge</th>
                  <th className="p-3">GPS Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0] font-mono">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-[#F5F5F5] transition">
                    <td className="p-3">
                      <p className="font-bold text-[#212121]">{audit.id}</p>
                      <p className="text-[10px] text-slate-500">{new Date(audit.created_at).toLocaleString()}</p>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center space-x-1 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        audit.audit_result === 'valid_green'
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : audit.audit_result === 'expired_amber'
                          ? 'bg-[#FFF3E0] text-[#E65100]'
                          : 'bg-[#FFEBEE] text-[#B71C1C]'
                      }`}>
                        <span>{audit.audit_result.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-[#212121]">{audit.scanned_plate}</p>
                      <p className="text-[10px] text-slate-500">{audit.scanned_vin}</p>
                    </td>

                    <td className="p-3 text-slate-700 font-medium">
                      {audit.officer_id}
                    </td>

                    <td className="p-3 text-slate-600">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1976D2] shrink-0" />
                        <span>{audit.gps_latitude?.toFixed(4)}, {audit.gps_longitude?.toFixed(4)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
