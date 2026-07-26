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

  const [filterTab, setFilterTab] = useState<'all' | 'compliant' | 'expired' | 'fraud'>('all');
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
    <div className={`space-y-6 font-sans ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Module Header Bar with MUI Tabs */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm text-slate-900 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-slate-900 rounded-xl text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">{t.auditTitle}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* MUI Style Tab Navigation Bar */}
            <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{t.viewAll || 'All Logs'} ({audits.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('compliant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  filterTab === 'compliant'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>Compliant ({audits.filter(a => a.audit_result === 'valid_green').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('expired')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  filterTab === 'expired'
                    ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>Expired ({audits.filter(a => a.audit_result === 'expired_amber').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('fraud')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                  filterTab === 'fraud'
                    ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>Fraud ({audits.filter(a => a.audit_result === 'fraud_red').length})</span>
              </button>
            </div>

            <button
              onClick={fetchAudits}
              className="bg-white hover:bg-slate-50 text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight border border-slate-300 shadow-2xs transition flex items-center space-x-1.5 cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t.refreshFeed}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl flex items-center justify-between text-slate-900 shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Verified Compliant</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {audits.filter(a => a.audit_result === 'valid_green').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl flex items-center justify-between text-slate-900 shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Expired / Unrenewed</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {audits.filter(a => a.audit_result === 'expired_amber').length}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl flex items-center justify-between text-slate-900 shadow-sm">
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Fraud / Forged Signature</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {audits.filter(a => a.audit_result === 'fraud_red').length}
            </p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Audits Table */}
      <div id="audit-stream" className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-slate-900">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight mb-4 pb-3 border-b border-slate-200/80 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <span>{t.realtimeAuditStream}</span>
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Querying audit logs...</div>
        ) : audits.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            No roadside enforcement scans recorded yet. Select Roadside Officer Scanner in the dropdown menu to perform scans!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-900 font-sans">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Audit ID / Time</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Scanned Plate & VIN</th>
                  <th className="p-3">Officer Badge</th>
                  <th className="p-3">GPS Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {audits
                  .filter((a) => {
                    if (filterTab === 'compliant') return a.audit_result === 'valid_green';
                    if (filterTab === 'expired') return a.audit_result === 'expired_amber';
                    if (filterTab === 'fraud') return a.audit_result === 'fraud_red';
                    return true;
                  })
                  .map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{audit.id}</p>
                      <p className="text-[10px] text-slate-400">{new Date(audit.created_at).toLocaleString()}</p>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center space-x-1 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md ${
                        audit.audit_result === 'valid_green'
                          ? 'bg-emerald-100 text-emerald-800'
                          : audit.audit_result === 'expired_amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span>{audit.audit_result.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-slate-900">{audit.scanned_plate}</p>
                      <p className="text-[10px] text-slate-500">{audit.scanned_vin}</p>
                    </td>

                    <td className="p-3 text-slate-700 font-medium">
                      {audit.officer_id}
                    </td>

                    <td className="p-3 text-slate-600">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
