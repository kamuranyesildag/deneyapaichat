import React, { useState, useRef, useEffect } from 'react';
import { 
  Cpu, 
  Bug, 
  Send, 
  Sparkles, 
  Terminal, 
  Lightbulb, 
  ChevronRight,
  Github,
  Rocket,
  Code2,
  MessageSquare,
  Info,
  User,
  History as HistoryIcon,
  Award,
  LogOut,
  X,
  ShieldCheck,
  Zap,
  Key,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateResponse } from './services/gemini';
import { AppMode, Message, UserProfile, HistoryItem } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('PROJECT_GEN');
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'profile'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Selam geleceğin teknoloji fatihi! Ben Tekno Nova. Bitlis\'in teknoloji rüzgarını arkama alarak sana Deneyap projelerinde ve kod hatalarında rehberlik etmeye geldim. \n\nSol taraftan modunu seçebilir veya direkt elindeki malzemeleri yazarak başlayabilirsin!',
      timestamp: Date.now(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [premiumStep, setPremiumStep] = useState<1 | 2>(1);
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const DAILY_LIMIT = 5;
  const COOLDOWN_TIME = 20;
  const VALID_LICENSES = [
    'TN-2026-X1', 'TN-2026-X2', 'TN-2026-X3', 'TN-2026-X4', 'TN-2026-X5',
    'TN-2026-X6', 'TN-2026-X7', 'TN-2026-X8', 'TN-2026-X9', 'TN-2026-X10'
  ];

  // Initialize and sync usage, profile, and history from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Usage
    const storedUsage = localStorage.getItem('tekno_nova_usage');
    if (storedUsage) {
      const { date, count } = JSON.parse(storedUsage);
      if (date === today) {
        setUsageCount(count);
      } else {
        localStorage.setItem('tekno_nova_usage', JSON.stringify({ date: today, count: 0 }));
        setUsageCount(0);
      }
    } else {
      localStorage.setItem('tekno_nova_usage', JSON.stringify({ date: today, count: 0 }));
    }

    // Profile
    const storedProfile = localStorage.getItem('tekno_nova_profile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      setShowOnboarding(true);
    }

    // History
    const storedHistory = localStorage.getItem('tekno_nova_history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Cooldown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isLimitReached = !profile?.isPremium && usageCount >= DAILY_LIMIT;

  const getBadge = (count: number) => {
    if (count >= 20) return { name: 'Tekno Nova Fatihi', color: 'text-purple-400', icon: Award };
    if (count >= 10) return { name: 'Kod Ustası', color: 'text-blue-400', icon: Terminal };
    return { name: 'Çaylak Deneyapçı', color: 'text-emerald-400', icon: Sparkles };
  };

  const handleOnboarding = (name: string, level: UserProfile['level']) => {
    const newProfile: UserProfile = { name, level, totalQuestions: 0, isPremium: false };
    setProfile(newProfile);
    localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
    setShowOnboarding(false);
  };

  const handleLicenseActivation = () => {
    if (VALID_LICENSES.includes(licenseInput.trim().toUpperCase())) {
      const newProfile = { ...profile!, isPremium: true };
      setProfile(newProfile);
      localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
      setShowPremiumModal(false);
      setLicenseInput('');
      setLicenseError('');
      alert('Tebrikler! Premium üyeliğin aktif edildi. Artık sınırsız sorgu yapabilirsin! 🚀');
    } else {
      setLicenseError('Geçersiz lisans kodu. Lütfen kontrol et.');
    }
  };

  const handleRequestLicense = () => {
    const subject = encodeURIComponent('Tekno Nova Lisans Talebi');
    const body = encodeURIComponent(`Merhaba İmran,\n\nTekno Nova Premium için lisans kodu almak istiyorum. Ödeme ve IBAN bilgileri için geri dönüşünü bekliyorum.\n\nAdım: ${profile?.name}\nSeviyem: ${profile?.level}`);
    window.location.href = `mailto:imranyesildag123@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || cooldown > 0 || isLimitReached || !profile) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setCooldown(COOLDOWN_TIME);

    // Update usage count
    const today = new Date().toISOString().split('T')[0];
    const newUsageCount = usageCount + 1;
    setUsageCount(newUsageCount);
    localStorage.setItem('tekno_nova_usage', JSON.stringify({ date: today, count: newUsageCount }));

    // Update profile total questions
    const newProfile = { ...profile, totalQuestions: profile.totalQuestions + 1 };
    setProfile(newProfile);
    localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));

    try {
      const responseText = await generateResponse(currentInput, mode, profile);
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        mode,
        title: currentInput.slice(0, 40) + (currentInput.length > 40 ? '...' : ''),
        timestamp: Date.now(),
        content: responseText
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('tekno_nova_history', JSON.stringify(updatedHistory));

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Bir hata oluştu. Lütfen internet bağlantını kontrol et ve tekrar dene.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const badge = profile ? getBadge(profile.totalQuestions) : null;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <Rocket className="text-white w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold">Tekno Nova'ya Katıl</h2>
                  <p className="text-zinc-400 text-sm">Geleceğin teknolojisini birlikte inşa edelim.</p>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleOnboarding(
                  formData.get('name') as string,
                  formData.get('level') as UserProfile['level']
                );
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Adın Ne?</label>
                  <input 
                    name="name"
                    required
                    placeholder="Örn: Ahmet"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Teknoloji Seviyen Nedir?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Başlangıç', 'Orta', 'İleri'].map((lvl) => (
                      <label key={lvl} className="relative cursor-pointer group">
                        <input type="radio" name="level" value={lvl} required className="peer sr-only" defaultChecked={lvl === 'Başlangıç'} />
                        <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-3 text-center text-sm font-semibold transition-all peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500 peer-checked:text-emerald-400 group-hover:bg-zinc-700">
                          {lvl}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                  Başlayalım!
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {premiumStep === 1 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Award className="text-amber-400 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-display font-bold">Tekno Nova Premium</h2>
                    <p className="text-zinc-400 text-sm mt-1">Sınırları kaldır, teknolojiyi fethet!</p>
                  </div>

                  <ul className="space-y-4">
                    {[
                      { icon: Sparkles, text: 'Sınırsız Sorgu Hakkı' },
                      { icon: Terminal, text: 'Derin Analiz ve Karmaşık Çözümler' },
                      { icon: User, text: 'İmran\'dan Özel Teknik Destek' }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30">
                        <item.icon className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-medium">{item.text}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => setPremiumStep(2)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Şimdi Satın Al
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-bold">Lisans Aktivasyonu</h2>
                    <p className="text-zinc-400 text-sm mt-1">Lisans kodunu girerek Premium'u başlat.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Lisans Kodunu Gir</label>
                      <input 
                        value={licenseInput}
                        onChange={(e) => {
                          setLicenseInput(e.target.value);
                          setLicenseError('');
                        }}
                        placeholder="Örn: TN-2026-X1"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono uppercase"
                      />
                      {licenseError && <p className="text-red-400 text-[10px] mt-1 font-bold">{licenseError}</p>}
                    </div>

                    <button 
                      onClick={handleLicenseActivation}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Aktive Et
                    </button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-zinc-900 px-2 text-zinc-600">Veya</span></div>
                    </div>

                    <button 
                      onClick={handleRequestLicense}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-2"
                    >
                      Lisans kodun yok mu? IBAN ve Bilgi Al
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-80 border-r border-zinc-800 bg-zinc-900/50 flex flex-col hidden md:flex">
        <div className="p-6 border-bottom border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Rocket className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight">Tekno Nova</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Deneyap Mentor</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Modlar</div>
          <button
            onClick={() => { setMode('PROJECT_GEN'); setActiveTab('chat'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              mode === 'PROJECT_GEN' && activeTab === 'chat'
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <Lightbulb className={cn("w-5 h-5", mode === 'PROJECT_GEN' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
            <div className="text-left">
              <div className="font-semibold text-sm">Proje Üretici</div>
            </div>
          </button>

          <button
            onClick={() => { setMode('DEBUGGER'); setActiveTab('chat'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              mode === 'DEBUGGER' && activeTab === 'chat'
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <Bug className={cn("w-5 h-5", mode === 'DEBUGGER' ? "text-blue-400" : "group-hover:text-zinc-200")} />
            <div className="text-left">
              <div className="font-semibold text-sm">Kod Debugger</div>
            </div>
          </button>

          <div className="pt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Kişisel</div>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === 'history'
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <HistoryIcon className={cn("w-5 h-5", activeTab === 'history' ? "text-amber-400" : "group-hover:text-zinc-200")} />
            <div className="text-left">
              <div className="font-semibold text-sm">Geçmişim</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === 'profile'
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <User className={cn("w-5 h-5", activeTab === 'profile' ? "text-purple-400" : "group-hover:text-zinc-200")} />
            <div className="text-left">
              <div className="font-semibold text-sm">Profilim</div>
            </div>
          </button>

          {!profile?.isPremium && (
            <div className="pt-4 px-2">
              <button
                onClick={() => { setShowPremiumModal(true); setPremiumStep(1); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <Award className="w-5 h-5" />
                <span className="text-sm">Premium'a Geç</span>
              </button>
            </div>
          )}
        </nav>

          <div className="p-6 mt-auto space-y-4">
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold"
            >
              Gizlilik Politikası
            </button>
            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Bitlis Vizyonu</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed italic">
              "Bitlis'ten yükselen teknoloji meşalesi, Deneyap atölyelerinde geleceği aydınlatıyor."
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <Rocket className="text-emerald-500 w-6 h-6" />
            <span className="font-display font-bold">Tekno Nova</span>
          </div>
          
          <div className="hidden md:block">
             <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
               {activeTab === 'chat' ? (mode === 'PROJECT_GEN' ? 'Akıllı Proje Üretici' : 'Kod Hata Ayıklayıcı') : activeTab === 'history' ? 'Geçmiş Kayıtlar' : 'Kullanıcı Profili'}
             </span>
          </div>

          {profile && (
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-4 hover:bg-zinc-800/50 p-2 rounded-xl transition-all group text-left"
            >
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2">
                  <div className="text-sm font-bold group-hover:text-emerald-400 transition-colors">Hoş geldin, {profile.name}!</div>
                  {profile.isPremium && <span className="bg-amber-500 text-black text-[8px] font-black px-1 rounded uppercase">Premium</span>}
                </div>
                <div className={cn("text-[10px] font-bold flex items-center justify-end gap-1", badge?.color)}>
                  {badge && <badge.icon className="w-3 h-3" />}
                  {badge?.name}
                </div>
              </div>
              <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-emerald-400 shadow-inner group-hover:border-emerald-500/50 transition-all">
                <User className="w-6 h-6" />
              </div>
            </button>
          )}
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat' ? (
            <div className="p-4 md:p-8 space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex w-full",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] md:max-w-[70%] rounded-2xl p-4 md:p-6 shadow-sm",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-zinc-900 border border-zinc-800 rounded-tl-none"
                    )}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 text-emerald-400">
                          <Cpu className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Nova Mentor</span>
                        </div>
                      )}
                      <div className={cn(
                        "prose prose-invert max-w-none",
                        msg.role === 'assistant' ? "markdown-body" : "text-sm md:text-base font-medium"
                      )}>
                        {msg.role === 'assistant' ? (
                          <Markdown>{msg.content}</Markdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">Tekno Nova zekası çalışıyor...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : activeTab === 'history' ? (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <HistoryIcon className="text-amber-400 w-6 h-6" />
                <h2 className="text-2xl font-display font-bold">Geçmiş Kayıtlarım</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                  <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">Henüz bir kayıt bulunmuyor. İlk sorunu sorarak başlayabilirsin!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            item.mode === 'PROJECT_GEN' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                          )}>
                            {item.mode === 'PROJECT_GEN' ? <Lightbulb className="w-4 h-4" /> : <Bug className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-200">{item.title}</div>
                            <div className="text-[10px] text-zinc-500">{new Date(item.timestamp).toLocaleString('tr-TR')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="markdown-body text-sm line-clamp-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Markdown>{item.content}</Markdown>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-purple-400 w-6 h-6" />
                <h2 className="text-2xl font-display font-bold">Profilim</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-zinc-800 border-4 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
                    <User className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold">{profile?.name}</h3>
                  <div className={cn("text-sm font-bold mt-1 flex items-center gap-1", badge?.color)}>
                    {badge && <badge.icon className="w-4 h-4" />}
                    {badge?.name}
                  </div>
                  
                  <div className="mt-6 w-full space-y-3">
                    <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                      <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Seviye</span>
                      <span className="text-emerald-400 font-bold">{profile?.level}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                      <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Toplam Soru</span>
                      <span className="text-blue-400 font-bold">{profile?.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                      <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Üyelik Tipi</span>
                      <span className={cn("font-bold", profile?.isPremium ? "text-amber-400" : "text-zinc-500")}>
                        {profile?.isPremium ? 'Premium' : 'Ücretsiz'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {!profile?.isPremium ? (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-amber-500/20">
                      <Award className="w-10 h-10 mb-4" />
                      <h4 className="text-xl font-bold mb-2">Premium'a Yükselt</h4>
                      <p className="text-amber-100 text-sm mb-6 leading-relaxed">
                        Sınırları kaldırın, İmran'dan özel destek alın ve Tekno Nova'nın tüm gücünü keşfedin.
                      </p>
                      <button 
                        onClick={() => { setShowPremiumModal(true); setPremiumStep(1); }}
                        className="w-full bg-white text-amber-600 font-bold py-3 rounded-xl hover:bg-amber-50 transition-all shadow-lg"
                      >
                        Hemen Yükselt
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-900 border border-emerald-500/20 rounded-3xl p-8 border-dashed">
                      <Sparkles className="text-emerald-400 w-10 h-10 mb-4" />
                      <h4 className="text-xl font-bold text-emerald-400 mb-2">Premium Aktif</h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        Sınırsız erişim ve tüm özellikler açık. Teknoloji fatihi olarak yoluna devam et!
                      </p>
                    </div>
                  )}

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-zinc-500" />
                      Hesap Ayarları
                    </h4>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'Tekno Nova: Deneyap Mentor',
                              text: 'Deneyap projelerinde ve kod hatalarında sana rehberlik edecek akıllı asistan!',
                              url: window.location.href
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Uygulama linki kopyalandı!');
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 text-zinc-300 hover:text-white text-sm font-bold p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Uygulamayı Paylaş
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Tüm verilerin silinecek. Emin misin?')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold p-3 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Verileri Sıfırla ve Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Only in Chat Tab) */}
        {activeTab === 'chat' && (
          <div className="p-4 md:p-8 pt-0">
            {isLimitReached ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center mb-4"
              >
                <p className="text-amber-200 text-sm md:text-base leading-relaxed">
                  Günlük hakkın doldu teknoloji fatihi! 🚀 API maliyetlerini karşılamak ve sistemi açık tutmak için sınırlı kontenjan kullanıyoruz.
                </p>
                {!profile?.isPremium && (
                  <button 
                    onClick={() => { setShowPremiumModal(true); setPremiumStep(1); }}
                    className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2 rounded-xl transition-all"
                  >
                    Premium'a Geç ve Sınırları Kaldır
                  </button>
                )}
              </motion.div>
            ) : (
              <form 
                onSubmit={handleSubmit}
                className="relative max-w-4xl mx-auto"
              >
                <div className="absolute -top-8 left-0 flex gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                    mode === 'PROJECT_GEN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {mode === 'PROJECT_GEN' ? 'Akıllı Proje Üretici' : 'Kod Hata Ayıklayıcı'}
                  </span>
                  {cooldown > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-800 text-zinc-400 border-zinc-700">
                      Bekleme Süresi: {cooldown}s
                    </span>
                  )}
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading || cooldown > 0}
                  placeholder={mode === 'PROJECT_GEN' ? "Elindeki malzemeleri yaz (Örn: Deneyap Kart, Mesafe Sensörü...)" : "Hatalı kodunu veya hata mesajını buraya yapıştır..."}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all min-h-[60px] max-h-[200px] resize-none text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || cooldown > 0}
                  className="absolute right-3 bottom-3 p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 min-w-[44px] flex items-center justify-center"
                >
                  {cooldown > 0 ? (
                    <span className="text-xs font-bold">{cooldown}</span>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            )}
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-center text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                Tekno Nova • Bitlis Stüdyo • Milli Teknoloji Hamlesi
              </p>
              <p className="text-[9px] text-zinc-700 font-medium">
                İmran Yeşildağ (Tekno Nova) tarafından Bitlis'te geliştirildi.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-800 px-6 py-3 flex items-center justify-between z-50">
        <button 
          onClick={() => { setMode('PROJECT_GEN'); setActiveTab('chat'); }}
          className={cn("flex flex-col items-center gap-1", mode === 'PROJECT_GEN' && activeTab === 'chat' ? "text-emerald-400" : "text-zinc-500")}
        >
          <Lightbulb className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Proje</span>
        </button>
        <button 
          onClick={() => { setMode('DEBUGGER'); setActiveTab('chat'); }}
          className={cn("flex flex-col items-center gap-1", mode === 'DEBUGGER' && activeTab === 'chat' ? "text-blue-400" : "text-zinc-500")}
        >
          <Bug className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Debug</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-amber-400" : "text-zinc-500")}
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Geçmiş</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'profile' ? "text-purple-400" : "text-zinc-500")}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Profil</span>
        </button>
      </div>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacyModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    <h2 className="text-3xl font-display font-bold">Gizlilik Politikası</h2>
                  </div>
                  <button 
                    onClick={() => setShowPrivacyModal(false)}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
                  <section>
                    <h3 className="text-white font-bold text-lg mb-2">1. Veri Güvenliği</h3>
                    <p>Tekno Nova, kullanıcının deneyimini kişiselleştirmek için adınız ve teknoloji seviyeniz gibi temel bilgileri toplar. Bu veriler tamamen tarayıcınızın yerel depolamasında (localStorage) saklanır ve sunucularımıza gönderilmez.</p>
                  </section>
                  <section>
                    <h3 className="text-white font-bold text-lg mb-2">2. Yapay Zeka İşleme</h3>
                    <p>Sorularınız ve kod parçacıklarınız, yanıt üretilmesi amacıyla Google Gemini AI API'sine gönderilir. Bu süreçte kişisel kimlik bilgileriniz paylaşılmaz.</p>
                  </section>
                  <section>
                    <h3 className="text-white font-bold text-lg mb-2">3. Çerezler ve Takip</h3>
                    <p>Uygulamamız reklam amaçlı çerezler veya üçüncü taraf takip kodları kullanmaz. Sadece uygulamanın çalışması için gerekli olan teknik veriler yerel olarak tutulur.</p>
                  </section>
                  <section>
                    <h3 className="text-white font-bold text-lg mb-2">4. İletişim</h3>
                    <p>Gizlilikle ilgili her türlü sorunuz için geliştiricimiz İmran Yeşildağ'a <strong>imranyesildag123@gmail.com</strong> adresinden ulaşabilirsiniz.</p>
                  </section>
                </div>

                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-full mt-10 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Anladım
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
