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
    <div className={`min-h-screen bg-[#F5F5F5] text-[#212121] font-roboto antialiased selection:bg-[#1976D2] selection:text-white flex flex-col pb-24 lg:pb-0 relative overflow-hidden ${lang === 'am' ? 'lang-am' : ''}`}>
      {/* Background Soft Material Blobs */}
      <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-[#1976D2]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-[#9C27B0]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-[#0288D1]/8 rounded-full blur-3xl pointer-events-none" />

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

      {/* Bottom Navigation for Mobile / Tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] py-1 px-2 z-40 mui-elevation-8">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {rolesList.map((item) => {
            const Icon = item.icon;
            const isActive = activeInterface === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveInterface(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded transition cursor-pointer ${
                  isActive
                    ? 'text-[#1976D2] font-bold'
                    : 'text-slate-600 hover:text-[#1976D2]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1976D2]' : 'text-slate-500'}`} />
                <span className="text-[10px] uppercase tracking-wider text-center mt-0.5 truncate w-full px-0.5">
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Switcher Dialog / Bottom Sheet Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-[#E0E0E0] rounded max-w-sm w-full p-5 space-y-4 mui-elevation-8 animate-in fade-in slide-in-from-bottom-4 duration-200 text-[#212121] font-roboto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0]">
              <span className="text-xs font-bold text-[#1976D2] uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-[#1976D2]" />
                <span>{t.systemUserSelection}</span>
              </span>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-[#212121] p-1 rounded cursor-pointer transition"
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
                  className={`w-full text-left px-3.5 py-2.5 rounded text-xs font-medium uppercase tracking-wider transition cursor-pointer flex items-center justify-between ${
                    activeInterface === item.id
                      ? 'bg-[#1976D2] text-white shadow-xs'
                      : 'bg-[#F5F5F5] text-slate-800 hover:bg-slate-200 border border-[#E0E0E0]'
                  }`}
                >
                  <span className="truncate pr-2">{item.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    activeInterface === item.id ? 'bg-[#0D47A1] text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E0E0E0]">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  handleLogout();
                }}
                className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white font-medium uppercase tracking-wider text-xs py-2.5 rounded transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logoutDesc}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/80 border-t border-[#E0E0E0] py-6 text-center text-xs text-slate-500 font-roboto mt-12 relative z-10">
        <p className="font-medium text-[#212121] uppercase tracking-wider">{t.footerTitle}</p>
        <p className="mt-1 text-[11px] text-slate-500 font-mono">{t.footerSub}</p>
      </footer>
    </div>
  );
}
