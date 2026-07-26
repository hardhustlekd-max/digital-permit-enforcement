import { useState, useEffect, useRef } from 'react';
import { QrCode, Cpu, RefreshCw, Smartphone, ChevronDown, UserCheck, Shield, FileCheck, Printer, Camera, Activity, Globe, Sparkles, Settings, X, Menu, LogOut } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import appLogo from '../assets/images/app_logo_1784938981556.jpg';

interface HeaderProps {
  activeInterface: string;
  onInterfaceChange: (interfaceId: string) => void;
  onSeedData: () => void;
  isSeeding: boolean;
  lang: Language;
  onLangChange: (lang: Language) => void;
  onLogout?: () => void;
}

export default function Header({ activeInterface, onInterfaceChange, onSeedData, isSeeding, lang, onLangChange, onLogout }: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').replace('Z', '');
      setTime(timeStr);
    };
    updateClock();
    const interval = setInterval(updateClock, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('PWA is ready! You can add this application to your Home Screen from your browser menu.');
    }
  };

  const interfaces = [
    { id: 'clerk', label: t.clerkRole, badge: 'CLERK', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: FileCheck },
    { id: 'admin', label: t.adminRole, badge: 'ADMIN', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Shield },
    { id: 'vendor', label: t.vendorRole, badge: 'VENDOR', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Printer },
    { id: 'officer', label: t.officerRole, badge: 'OFFICER PWA', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Camera },
    { id: 'audits', label: t.auditsRole, badge: 'AUDIT', color: 'bg-zinc-100 text-zinc-900 border-zinc-300', icon: Activity },
  ];

  const activeMeta = interfaces.find(i => i.id === activeInterface) || interfaces[0];

  return (
    <header className={`bg-[#181C24] text-white border-b border-slate-800 sticky top-0 z-40 font-sans ${lang === 'am' ? 'lang-am' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & System Title */}
          <div className="flex items-center space-x-3">
            <img 
              src={appLogo} 
              alt="Digital Permit Logo" 
              className="w-8 h-8 rounded-lg object-cover border border-slate-700/80 shrink-0 bg-white shadow-xs" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                {t.systemTitle}
              </h1>
            </div>
          </div>

          {/* Header Role Navigation Tabs for Desktop - Classic Tab Style */}
          <nav className="hidden lg:flex items-center space-x-6">
            {interfaces.map((item) => {
              const Icon = item.icon;
              const isActive = activeInterface === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onInterfaceChange(item.id)}
                  className={`py-3 px-1 text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center space-x-2 border-b-2 -mb-px ${
                    isActive
                      ? 'border-white text-white font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls & Popover Trigger */}
          <div className="flex items-center space-x-2">
            
            {/* Active View Badge Chip for Mobile / Small Screens */}
            <div className="flex lg:hidden items-center space-x-1 bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs text-white">
              <span className="font-bold text-[10px] bg-white text-slate-900 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {activeMeta.badge}
              </span>
            </div>

            {/* Menu & Settings Toggle Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                  isMenuOpen
                    ? 'bg-white text-slate-900 border-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                }`}
                title="Settings & Controls"
                aria-label="Settings"
              >
                <Settings className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Popover Settings Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-5 z-50 text-slate-900 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-slate-700" />
                      <span>System Settings</span>
                    </span>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Language Selector Dropdown / Pills in Settings */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-600" />
                      <span>Language / ቋንቋ</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                      <button
                        onClick={() => onLangChange('en')}
                        className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                          lang === 'en'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🇺🇸</span>
                        <span>English</span>
                      </button>
                      <button
                        onClick={() => onLangChange('am')}
                        className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                          lang === 'am'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🇪🇹</span>
                        <span>አማርኛ</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Role Switching Navigation */}
                  <div className="space-y-1.5 block lg:hidden">
                    <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                      <span>Switch Portal</span>
                    </label>
                    <div className="space-y-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 max-h-48 overflow-y-auto">
                      {interfaces.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onInterfaceChange(item.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition cursor-pointer flex items-center justify-between ${
                            activeInterface === item.id
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-200/80'
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
                  </div>

                  {/* System Tools & Actions */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleInstallPWA}
                        className={`flex items-center justify-center space-x-1 text-xs font-semibold py-2 px-2.5 rounded-xl border transition cursor-pointer ${
                          isInstalled
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 shrink-0" />
                        <span>{isInstalled ? t.pwaInstalled : t.pwaReady}</span>
                      </button>

                      <button
                        onClick={onSeedData}
                        disabled={isSeeding}
                        className="flex items-center justify-center space-x-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 py-2 px-2.5 rounded-xl border border-slate-200 transition disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isSeeding ? 'animate-spin' : ''}`} />
                        <span>{isSeeding ? t.seeding : t.seedData}</span>
                      </button>
                    </div>

                    {/* Sign Out Button */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full bg-[#181C24] hover:bg-[#0B0D12] text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-sm border border-slate-900 flex items-center justify-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3 text-slate-700 animate-pulse" />
                        <span>System Clock</span>
                      </span>
                      <span>{time ? time.split(' ')[1] : '00:00:00'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Scrollable Navigation Tab Bar - Classic Tab Style */}
        <div className="lg:hidden border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-4 min-w-max px-3">
            {interfaces.map((item) => {
              const Icon = item.icon;
              const isActive = activeInterface === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onInterfaceChange(item.id)}
                  className={`py-2.5 px-1 text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border-b-2 -mb-px ${
                    isActive
                      ? 'border-white text-white font-extrabold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
