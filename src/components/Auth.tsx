import React, { useState } from 'react';
import { LogIn, User, ShieldCheck, Mail, LogOut, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Navigation({ onDashboardOpen }: { onDashboardOpen: () => void }) {
  const { user, signInWithGoogle, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-4 md:px-12 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
        {/* Language Switcher */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-black/5 p-1 rounded-full px-3 shadow-sm">
          <Globe className="w-3.5 h-3.5 opacity-40" />
          <button 
            onClick={() => setLanguage('en')}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full transition-all",
              language === 'en' ? "bg-black text-white" : "text-black/40 hover:text-black"
            )}
          >
            EN
          </button>
          <button 
            onClick={() => setLanguage('zh')}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full transition-all",
              language === 'zh' ? "bg-black text-white" : "text-black/40 hover:text-black"
            )}
          >
            中文
          </button>
        </div>

        {/* Auth section */}
        <div className="relative">
          {user ? (
            <div className="flex items-center gap-4">
               <button 
                onClick={onDashboardOpen}
                className="hidden md:flex items-center gap-3 bg-white border-2 border-black px-6 py-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('dashboard')}</span>
              </button>
              
              <div 
                className="flex items-center gap-4 bg-black text-white px-5 py-2.5 rounded-sm shadow-xl cursor-pointer hover:bg-zinc-800 transition-all"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 border border-white/20">
                  <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" />
                </div>
                <div className="hidden sm:flex flex-col items-start mr-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 italic">User Online</span>
                  <span className="text-[10px] font-black uppercase tracking-tight">{user.displayName?.split(' ')[0]}</span>
                </div>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showDropdown && "rotate-180")} />
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-4 bg-white border-2 border-black p-2 min-w-[200px] shadow-2xl flex flex-col gap-1"
                  >
                    <button 
                      className="md:hidden flex items-center gap-3 p-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100"
                      onClick={() => {
                        onDashboardOpen();
                        setShowDropdown(false);
                      }}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{t('dashboard')}</span>
                    </button>
                    <button 
                      onClick={() => {
                         logout();
                         setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 p-3 text-left hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] font-serif italic">{t('logout')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="group flex items-center gap-4 bg-white border-2 border-black px-6 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
            >
              <LogIn className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em]">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export function ProtectedAction({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  const { user, signInWithGoogle } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      signInWithGoogle();
    } else {
      onClick();
    }
  };

  return (
    <div onClick={handleClick} className="w-full">
      {children}
    </div>
  );
}
