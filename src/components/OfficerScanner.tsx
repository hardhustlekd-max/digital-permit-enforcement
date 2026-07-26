import { useState, useEffect, useRef } from 'react';
import { UserRole, EnforcementVerifyResponse } from '../types';
import { Shield, Camera, AlertTriangle, CheckCircle, RefreshCw, MapPin, ShieldAlert } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Language, translations } from '../lib/translations';

interface OfficerScannerProps {
  currentRole: UserRole;
  lang?: Language;
}

export default function OfficerScanner({ currentRole, lang = 'en' }: OfficerScannerProps) {
  const t = translations[lang];

  const [scanResult, setScanResult] = useState<EnforcementVerifyResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [timeMs, setTimeMs] = useState('');
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [scannerActive, setScannerActive] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Floating Real-Time Running Millisecond Clock (Antispoofing Countermeasure)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
      setTimeMs(timeStr);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  // Fetch native browser location coordinates
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation warning:', err.message);
          // Fallback coords
          setGeoCoords({ lat: 13.7563, lng: 100.5018 });
        }
      );
    } else {
      setGeoCoords({ lat: 13.7563, lng: 100.5018 });
    }
  }, []);

  // Start Camera QR Scanner using html5-qrcode
  useEffect(() => {
    if (scannerActive) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Scanned payload
          scanner.clear();
          setScannerActive(false);
          processScannedUrl(decodedText);
        },
        () => {
          // scanning...
        }
      );

      scannerRef.current = scanner;

      return () => {
        try {
          scanner.clear();
        } catch (e) {}
      };
    }
  }, [scannerActive]);

  const processScannedUrl = async (urlOrUuid: string) => {
    setIsVerifying(true);
    try {
      let targetUrl = urlOrUuid;

      // Extract permit UUID and signature if full URL is scanned
      if (urlOrUuid.includes('/api/enforcement/verify/')) {
        targetUrl = urlOrUuid;
      } else {
        const cleanUuid = urlOrUuid.trim();
        const latParam = geoCoords ? `&lat=${geoCoords.lat}&lng=${geoCoords.lng}` : '';
        targetUrl = `/api/enforcement/verify/${cleanUuid}?officer_id=officer-01${latParam}`;
      }

      // Add officer ID and location parameters
      if (!targetUrl.includes('officer_id') && geoCoords) {
        const joinChar = targetUrl.includes('?') ? '&' : '?';
        targetUrl += `${joinChar}officer_id=officer-01&lat=${geoCoords.lat}&lng=${geoCoords.lng}`;
      }

      const res = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${currentRole}`,
          'X-User-Role': currentRole,
          'X-Officer-Id': 'officer-01',
        },
      });

      const data: EnforcementVerifyResponse = await res.json();
      setScanResult(data);
    } catch (e) {
      console.error(e);
      setScanResult({
        status: 'FRAUD_REVOKED',
        color: 'RED',
        message: 'Network verification error or malformed QR token payload.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Preset Simulation Triggers
  const triggerSimulatedScan = async (type: 'valid' | 'expired' | 'fraud') => {
    setIsVerifying(true);
    setScanResult(null);

    try {
      if (type === 'valid') {
        const seedRes = await fetch('/api/seed', { method: 'POST' });
        const seedData = await seedRes.json();
        const vin = seedData.vins ? seedData.vins[0] : '1HGCR2F83HA000101';

        const approveRes = await fetch(`/api/admin/approve-permit/${vin}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer super_admin`,
            'X-User-Role': 'super_admin',
          },
        });
        const approveData = await approveRes.json();
        if (approveData.verification_url) {
          await processScannedUrl(approveData.verification_url);
          return;
        }
      } else if (type === 'expired') {
        setScanResult({
          status: 'EXPIRED_CANCELED',
          color: 'YELLOW',
          message: 'PERMIT EXPIRED: Vehicle permit expired 45 days ago. Roadside renewal required.',
          vehicleData: {
            vin: '1HGCR2F83HA000999',
            license_plate: 'BK-888-EX',
            engine_capacity_cc: 105,
            is_electric: false,
            owner_name: 'Kittisak Som',
            owner_photo_b2_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
            issue_date: '2025-01-01T00:00:00.000Z',
            expiry_date: '2026-01-01T00:00:00.000Z',
            permit_status: 'expired',
          },
        });
        setIsVerifying(false);
        return;
      } else if (type === 'fraud') {
        setScanResult({
          status: 'FRAUD_REVOKED',
          color: 'RED',
          message: 'CRITICAL SECURITY VIOLATION: Cryptographic HMAC signature mismatch! Sticker payload has been tampered with or forged.',
        });
        setIsVerifying(false);
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  // Chroma Background Color based on scan result
  let chromaClass = 'bg-white border-[#E0E0E0] text-[#212121] mui-elevation-1';
  if (scanResult) {
    if (scanResult.color === 'GREEN') {
      chromaClass = 'bg-[#2E7D32] text-white mui-elevation-4 transition-colors duration-300';
    } else if (scanResult.color === 'YELLOW') {
      chromaClass = 'bg-[#ED6C02] text-white mui-elevation-4 transition-colors duration-300';
    } else if (scanResult.color === 'RED') {
      chromaClass = 'bg-[#D32F2F] text-white mui-elevation-4 transition-colors duration-300';
    }
  }

  return (
    <div className={`min-h-[500px] p-4 sm:p-6 rounded border transition-all duration-500 relative overflow-hidden font-roboto ${lang === 'am' ? 'lang-am' : ''} ${chromaClass}`}>
      
      {/* Antispoofing Running Millisecond Clock Header */}
      <div className="flex items-center justify-between border-b border-current/20 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 animate-pulse shrink-0" />
          <span className="font-bold tracking-wider text-xs uppercase">{t.officerTitle}</span>
        </div>

        {/* Dynamic Millisecond Timestamp Banner */}
        <div className="bg-black/10 px-3 py-1 rounded border border-current/20 font-mono text-[11px] font-bold tracking-wider">
          ⏱️ {timeMs || 'SYNCING...'}
        </div>
      </div>

      {/* Geolocation Tag */}
      <div className="flex items-center justify-between mb-4 text-[11px] font-mono opacity-90 font-medium">
        <span className="flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>GPS: {geoCoords ? `${geoCoords.lat.toFixed(4)}, ${geoCoords.lng.toFixed(4)}` : t.gpsLocating}</span>
        </span>
        <span className="font-bold uppercase tracking-wider">{t.badgeId}</span>
      </div>

      {/* Active Scan Result Chroma Layout */}
      {scanResult ? (
        <div className="space-y-6 max-w-2xl mx-auto py-2">
          
          {/* Status Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-white/20 border border-white/40 shadow-xs">
              {scanResult.color === 'GREEN' && <CheckCircle className="w-14 h-14 text-white" />}
              {scanResult.color === 'YELLOW' && <AlertTriangle className="w-14 h-14 text-white" />}
              {scanResult.color === 'RED' && <ShieldAlert className="w-14 h-14 text-white" />}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider">
              {scanResult.status.replace('_', ' ')}
            </h2>
            <p className="text-xs sm:text-sm font-medium opacity-95 max-w-md mx-auto leading-relaxed">
              {scanResult.message}
            </p>
          </div>

          {/* Vehicle Profile & Driver Photo Cross-Verification */}
          {scanResult.vehicleData && (
            <div className="bg-white border border-[#E0E0E0] rounded p-5 mui-elevation-2 space-y-4 text-[#212121]">
              <div className="flex items-center space-x-4">
                
                {/* Backblaze B2 Driver Photo Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={scanResult.vehicleData.owner_photo_b2_url}
                    alt={scanResult.vehicleData.owner_name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#1976D2] shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 bg-[#1976D2] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full text-white border border-white">
                    B2 PHOTO
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">OPERATOR IDENTITY</span>
                  <h3 className="text-base font-bold text-[#212121]">{scanResult.vehicleData.owner_name}</h3>
                  <p className="text-xs font-mono font-bold text-slate-700">Plate: <strong className="text-[#1976D2] uppercase">{scanResult.vehicleData.license_plate}</strong></p>
                  <p className="text-[11px] font-mono text-slate-500">VIN: {scanResult.vehicleData.vin}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E0E0E0] font-mono text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Engine Specification</span>
                  <p className="font-bold text-[#212121]">{scanResult.vehicleData.is_electric ? 'Pure EV (0cc)' : `${scanResult.vehicleData.engine_capacity_cc} CC`}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Permit Expiry Date</span>
                  <p className="font-bold text-[#212121]">{new Date(scanResult.vehicleData.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reset Scan button */}
          <div className="text-center pt-2">
            <button
              onClick={() => setScanResult(null)}
              className="bg-white text-[#212121] hover:bg-slate-100 font-medium uppercase tracking-wider px-6 py-2.5 rounded shadow-2xs transition flex items-center space-x-2 mx-auto text-sm cursor-pointer active:scale-98 border border-[#E0E0E0]"
            >
              <RefreshCw className="w-4 h-4 text-[#1976D2]" />
              <span>Scan Next Vehicle QR Sticker</span>
            </button>
          </div>

        </div>
      ) : (
        /* Camera Scanner & Test Controls */
        <div className="max-w-xl mx-auto space-y-4 py-2">
          
          {/* Camera Scanner Container */}
          <div id="officer-camera" className="bg-[#F5F5F5] border border-[#E0E0E0] rounded p-5 text-center space-y-3 shadow-2xs">
            <h3 className="text-base font-bold text-[#1976D2] uppercase tracking-wider flex items-center justify-center space-x-2">
              <Camera className="w-5 h-5 text-[#1976D2]" />
              <span>{t.cameraScanner}</span>
            </h3>

            {scannerActive ? (
              <div className="space-y-3">
                <div id="qr-reader-container" className="overflow-hidden rounded bg-black border border-[#E0E0E0] max-w-sm mx-auto shadow-xs" />
                <button
                  onClick={() => setScannerActive(false)}
                  className="text-xs text-[#D32F2F] font-bold uppercase tracking-wider hover:underline cursor-pointer"
                >
                  {t.stopCamera}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setScannerActive(true)}
                className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-medium uppercase tracking-wider py-2.5 px-6 rounded shadow-xs transition flex items-center justify-center space-x-2 mx-auto text-sm cursor-pointer active:scale-98"
              >
                <Camera className="w-4 h-4" />
                <span>{t.activateCamera}</span>
              </button>
            )}
          </div>

          {/* Manual Token Lookup Input */}
          <div id="officer-manual" className="bg-[#F5F5F5] border border-[#E0E0E0] rounded p-5 space-y-2.5 shadow-2xs">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.enterUuidManually}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Paste Permit UUID or scanned verification URL"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 bg-white border border-[#E0E0E0] rounded px-3 py-2 text-xs text-[#212121] placeholder-slate-400 font-mono focus:outline-none focus:border-[#1976D2] shadow-2xs"
              />
              <button
                onClick={() => processScannedUrl(manualInput)}
                disabled={!manualInput || isVerifying}
                className="bg-[#1976D2] hover:bg-[#1565C0] text-white text-xs font-medium uppercase tracking-wider px-4 py-2 rounded shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isVerifying ? t.checking : t.checkVerify}
              </button>
            </div>
          </div>

          {/* Simulation Triggers for Instant Field Testing */}
          <div id="officer-field-test" className="bg-[#F5F5F5] border border-[#E0E0E0] rounded p-5 space-y-3 shadow-2xs">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider block text-center">
              {t.quickFieldSim}
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => triggerSimulatedScan('valid')}
                className="bg-white hover:bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] py-2.5 px-2 rounded text-xs font-medium uppercase tracking-wider transition flex flex-col items-center justify-center space-y-1 text-center cursor-pointer shadow-2xs active:scale-98"
              >
                <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
                <span>Valid (Clear)</span>
              </button>

              <button
                onClick={() => triggerSimulatedScan('expired')}
                className="bg-white hover:bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] py-2.5 px-2 rounded text-xs font-medium uppercase tracking-wider transition flex flex-col items-center justify-center space-y-1 text-center cursor-pointer shadow-2xs active:scale-98"
              >
                <AlertTriangle className="w-4 h-4 text-[#ED6C02]" />
                <span>Expired</span>
              </button>

              <button
                onClick={() => triggerSimulatedScan('fraud')}
                className="bg-white hover:bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C] py-2.5 px-2 rounded text-xs font-medium uppercase tracking-wider transition flex flex-col items-center justify-center space-y-1 text-center cursor-pointer shadow-2xs active:scale-98"
              >
                <ShieldAlert className="w-4 h-4 text-[#D32F2F]" />
                <span>Fraud Alert</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
