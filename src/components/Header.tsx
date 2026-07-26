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
    <header className={`bg-[#1976D2] text-white mui-elevation-4 sticky top-0 z-40 font-roboto ${lang === 'am' ? 'lang-am' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & System Title */}
          <div className="flex items-center space-x-3">
            <img 
              src={appLogo} 
              alt="Digital Permit Logo" 
              className="w-9 h-9 rounded object-cover border border-white/30 shrink-0 bg-white shadow-xs" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wide text-white uppercase">
                {t.systemTitle}
              </h1>
              <p className="text-[11px] text-white/80 font-mono hidden sm:block">
                Sub-110cc & EV Transport Compliance Platform
              </p>
            </div>
          </div>

          {/* Header Role Navigation Tabs for Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 h-full">
            {interfaces.map((item) => {
              const Icon = item.icon;
              const isActive = activeInterface === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onInterfaceChange(item.id)}
                  className={`h-full px-3 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 border-b-2 ${
                    isActive
                      ? 'border-white text-white font-bold bg-white/10'
                      : 'border-transparent text-white/85 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls & Popover Trigger */}
          <div className="flex items-center space-x-2">
            
            {/* Active View Badge Chip for Mobile / Small Screens */}
            <div className="flex lg:hidden items-center space-x-1 bg-white/15 border border-white/25 px-2.5 py-1 rounded text-xs text-white">
              <span className="font-bold text-[10px] bg-white text-[#1976D2] px-2 py-0.5 rounded uppercase tracking-wider">
                {activeMeta.badge}
              </span>
            </div>

            {/* Menu & Settings Toggle Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  isMenuOpen
                    ? 'bg-white text-[#1976D2] shadow-xs'
                    : 'text-white hover:bg-white/15'
                }`}
                title="Settings & Controls"
                aria-label="Settings"
              >
                <Settings className={`w-5 h-5 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Popover Settings Menu - Material Design 2 Surface */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E0E0E0] rounded mui-elevation-8 p-4 z-50 text-[#212121] space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 font-roboto">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E0E0E0]">
                    <span className="text-xs font-bold text-[#1976D2] uppercase tracking-wider flex items-center space-x-1.5">
                      <Settings className="w-4 h-4 text-[#1976D2]" />
                      <span>System Settings</span>
                    </span>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="text-slate-400 hover:text-[#212121] p-1 rounded cursor-pointer transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5 text-[#1976D2]" />
                      <span>Language / ቋንቋ</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-[#F5F5F5] p-1 rounded border border-[#E0E0E0]">
                      <button
                        onClick={() => onLangChange('en')}
                        className={`py-1.5 text-xs font-medium uppercase tracking-wider rounded transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                          lang === 'en'
                            ? 'bg-[#1976D2] text-white shadow-xs'
                            : 'text-slate-700 hover:text-[#212121]'
                        }`}
                      >
                        <span>🇺🇸</span>
                        <span>English</span>
                      </button>
                      <button
                        onClick={() => onLangChange('am')}
                        className={`py-1.5 text-xs font-medium uppercase tracking-wider rounded transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                          lang === 'am'
                            ? 'bg-[#1976D2] text-white shadow-xs'
                            : 'text-slate-700 hover:text-[#212121]'
                        }`}
                      >
                        <span>🇪🇹</span>
                        <span>አማርኛ</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Role Switching Navigation */}
                  <div className="space-y-1.5 block lg:hidden">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#1976D2]" />
                      <span>Switch Portal</span>
                    </label>
                    <div className="space-y-1 bg-[#F5F5F5] p-1.5 rounded border border-[#E0E0E0] max-h-48 overflow-y-auto">
                      {interfaces.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onInterfaceChange(item.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-xs font-medium uppercase tracking-wider transition cursor-pointer flex items-center justify-between ${
                            activeInterface === item.id
                              ? 'bg-[#1976D2] text-white shadow-xs'
                              : 'text-slate-800 hover:bg-slate-200'
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
                  </div>

                  {/* System Tools & Actions */}
                  <div className="pt-2 border-t border-[#E0E0E0] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleInstallPWA}
                        className={`flex items-center justify-center space-x-1 text-[11px] font-medium uppercase tracking-wider py-2 px-2.5 rounded border transition cursor-pointer ${
                          isInstalled
                            ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                            : 'bg-white hover:bg-slate-100 text-[#212121] border-[#E0E0E0]'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 shrink-0" />
                        <span>{isInstalled ? t.pwaInstalled : t.pwaReady}</span>
                      </button>

                      <button
                        onClick={onSeedData}
                        disabled={isSeeding}
                        className="flex items-center justify-center space-x-1 text-[11px] font-medium uppercase tracking-wider bg-white hover:bg-slate-100 text-[#212121] py-2 px-2.5 rounded border border-[#E0E0E0] transition disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[#1976D2] ${isSeeding ? 'animate-spin' : ''}`} />
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
                        className="w-full bg-[#1976D2] hover:bg-[#1565C0] text-white font-medium uppercase text-xs tracking-wider py-2 rounded transition cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3 text-[#1976D2] animate-pulse" />
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
      </div>
    </header>
  );
}
