import { useState, useEffect } from 'react';
import { UserRole } from './types';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ClerkPortal from './components/ClerkPortal';
import AdminDashboard from './components/AdminDashboard';
import VendorPortal from './components/VendorPortal';
import OfficerScanner from './components/OfficerScanner';
import EnforcementAudits from './components/EnforcementAudits';
import { Language, translations } from './lib/translations';
import { 
  PlusCircle, 
  ListFilter, 
  UserCheck, 
  Printer, 
  Camera, 
  Search, 
  Zap, 
  Activity, 
  X,
  FileCheck,
  Shield,
  Clock,
  LogOut
} from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeInterface, setActiveInterface] = useState<string>('clerk');
  const [isSeeding, setIsSeeding] = useState(false);
  const [lang, setLang] = useState<Language>('am');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const t = translations[lang];

  // Sync route if `/enforcement` path is opened
  useEffect(() => {
    if (window.location.pathname.startsWith('/enforcement')) {
      setActiveInterface('officer');
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (selectedRole: string) => {
    setActiveInterface(selectedRole);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const getRoleForInterface = (interfaceId: string): UserRole => {
    switch (interfaceId) {
      case 'clerk':
        return 'registration_clerk';
      case 'admin':
        return 'super_admin';
      case 'vendor':
        return 'printing_provider';
      case 'officer':
        return 'traffic_officer';
      case 'audits':
        return 'super_admin';
      default:
        return 'registration_clerk';
    }
  };

  const currentRole = getRoleForInterface(activeInterface);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const rolesList = [
    { id: 'clerk', label: t.clerkRole, badge: 'CLERK', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: FileCheck },
    { id: 'admin', label: t.adminRole, badge: 'ADMIN', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Shield },
    { id: 'vendor', label: t.vendorRole, badge: 'VENDOR', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Printer },
    { id: 'officer', label: t.officerRole, badge: 'OFFICER PWA', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Camera },
    { id: 'audits', label: t.auditsRole, badge: 'AUDIT', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Activity },
  ];

  // RENDER LOGIN PAGE IF NOT LOGGED IN
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={handleLogin}
        lang={lang}
        onLangChange={setLang}
        initialRole={activeInterface}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col pb-24 lg:pb-0 relative overflow-hidden ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Background Soft Ambient Blobs */}
      <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header with System Controls Popover */}
      <Header
        activeInterface={activeInterface}
        onInterfaceChange={setActiveInterface}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        lang={lang}
        onLangChange={setLang}
        onLogout={handleLogout}
      />

      {/* Main Content Container - Displays ONLY the Specific Selected User UI */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-6 relative z-10">
        {activeInterface === 'clerk' && (
          <ClerkPortal currentRole={currentRole} onVehicleRegistered={() => {}} lang={lang} />
        )}

        {activeInterface === 'admin' && (
          <AdminDashboard currentRole={currentRole} onPermitsUpdated={() => {}} lang={lang} />
        )}

        {activeInterface === 'vendor' && (
          <VendorPortal currentRole={currentRole} lang={lang} />
        )}

        {activeInterface === 'officer' && (
          <OfficerScanner currentRole={currentRole} lang={lang} />
        )}

        {activeInterface === 'audits' && (
          <EnforcementAudits currentRole={currentRole} lang={lang} />
        )}
      </main>

      {/* Role Switcher Dialog / Bottom Sheet Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 text-slate-900 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-slate-700" />
                <span>{t.systemUserSelection}</span>
              </span>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {rolesList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveInterface(item.id);
                    setIsRoleModalOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer flex items-center justify-between ${
                    activeInterface === item.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span className="truncate pr-2">{item.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                    activeInterface === item.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  handleLogout();
                }}
                className="w-full bg-[#181C24] hover:bg-[#0B0D12] text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm border border-slate-900"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logoutDesc}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/80 border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-sans mt-12 relative z-10">
        <p className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">{t.footerTitle}</p>
      </footer>
    </div>
  );
}
