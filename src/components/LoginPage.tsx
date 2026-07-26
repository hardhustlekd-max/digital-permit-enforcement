import React, { useState } from 'react';
import { Language, translations } from '../lib/translations';
import appLogo from '../assets/images/app_logo_1784938981556.jpg';
import { 
  FileCheck, 
  Shield, 
  Printer, 
  Camera, 
  Activity, 
  Globe, 
  LogIn, 
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (selectedRole: string) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  initialRole?: string;
}

export default function LoginPage({ onLogin, lang, onLangChange, initialRole = 'clerk' }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [username, setUsername] = useState<string>('clerk.registration@permit.gov.et');
  const [password, setPassword] = useState<string>('••••••••');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false);

  const t = translations[lang];

  const roles = [
    {
      id: 'clerk',
      title: t.clerkRole,
      badge: 'CLERK',
      icon: FileCheck,
      defaultUser: 'clerk.registration@permit.gov.et',
    },
    {
      id: 'admin',
      title: t.adminRole,
      badge: 'ADMIN',
      icon: Shield,
      defaultUser: 'admin.hq@permit.gov.et',
    },
    {
      id: 'vendor',
      title: t.vendorRole,
      badge: 'VENDOR',
      icon: Printer,
      defaultUser: 'vendor.print@permit.gov.et',
    },
    {
      id: 'officer',
      title: t.officerRole,
      badge: 'OFFICER',
      icon: Camera,
      defaultUser: 'officer.tp4021@traffic.gov.et',
    },
    {
      id: 'audits',
      title: t.auditsRole,
      badge: 'AUDITOR',
      icon: Activity,
      defaultUser: 'auditor.compliance@permit.gov.et',
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const matchedRole = roles.find(r => r.id === roleId);
    if (matchedRole) {
      setUsername(matchedRole.defaultUser);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans antialiasing selection:bg-blue-100 selection:text-blue-900 ${lang === 'am' ? 'lang-am' : ''}`}>
      
      {/* Separate Top Navbar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <img 
            src={appLogo} 
            alt="Logo" 
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs bg-white"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              {t.systemTitle}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Transport Compliance Portal
            </p>
          </div>
        </div>

        {/* Top Navbar Language Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-slate-600" />
            <span>{lang === 'en' ? 'EN' : 'አማ'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isLangOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setIsLangOpen(false)} 
              />
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    onLangChange('en');
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                    lang === 'en' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>English (EN)</span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLangChange('am');
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                    lang === 'am' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>አማርኛ (አማ)</span>
                  {lang === 'am' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Centered MUI Template Card Container */}
      <main className="max-w-[420px] w-full mx-auto my-auto px-4 py-8">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-7 sm:p-9 transition-all">
          
          {/* Classic Tab Navigation for Roles */}
          <div className="mb-6 border-b border-slate-200">
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`flex-1 min-w-[65px] flex items-center justify-center space-x-1 py-2.5 px-2 text-xs transition-all cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
                      isSelected
                        ? 'border-slate-900 text-slate-900 font-extrabold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span className="text-[11px] tracking-tight">{r.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Heading for Active Tab Role */}
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
                {(() => {
                  const activeRoleObj = roles.find(r => r.id === selectedRole);
                  const Icon = activeRoleObj ? activeRoleObj.icon : ShieldCheck;
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  {roles.find(r => r.id === selectedRole)?.badge} ACCESS
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                  {roles.find(r => r.id === selectedRole)?.title}
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md border border-slate-200/80">
              {selectedRole.toUpperCase()}
            </span>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email / Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {t.usernameLabel}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs font-sans placeholder:text-slate-400"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs font-mono placeholder:text-slate-400"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Remember me Checkbox */}
            <div className="flex items-center space-x-2.5 pt-0.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-slate-700 font-medium cursor-pointer select-none">
                {t.rememberMe}
              </label>
            </div>

            {/* Sign In Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#181C24] hover:bg-[#0B0D12] text-white font-bold text-sm py-3 rounded-xl border border-slate-900 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99] mt-2"
            >
              <span>{t.loginButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[420px] w-full mx-auto text-center text-slate-400 text-xs py-2">
        <p className="font-medium text-slate-600 uppercase tracking-wider text-[10px]">{t.footerTitle}</p>
        <p className="text-slate-400 mt-0.5 font-mono text-[10px]">{t.footerSub}</p>
      </footer>
    </div>
  );
}


