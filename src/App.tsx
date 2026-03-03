import React, { useState, useRef, useEffect } from 'react';
import { auth, googleProvider, isFirebaseConfigured } from './services/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  Cpu, 
  Bug, 
  Send, 
  Sparkles, 
  Terminal, 
  Lightbulb, 
  ChevronRight,
  Github,
  Star,
  Code2,
  MessageSquare,
  Info,
  User,
  History as HistoryIcon,
  Award,
  LogOut,
  Trash2,
  X,
  ShieldCheck,
  Zap,
  Settings,
  Key,
  ArrowLeft,
  AlertCircle,
  Menu,
  LogIn,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash,
  Copy,
  Check,
  Radio,
  Headphones,
  Waves,
  Mail,
  Lock,
  Phone,
  Smartphone,
  Shield,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateResponse } from './services/gemini';
import { AppMode, Message, UserProfile, HistoryItem } from './types';
import LiveVoiceView from './components/LiveVoiceView';

interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

const CHANGELOG: ChangelogItem[] = [
  {
    version: '2.2.0',
    date: '2 Mart 2026',
    title: 'Live Voice: Canlı Sesli Sohbet',
    type: 'major',
    changes: [
      'Pro üyeler için "Live Voice" (Canlı Sesli Sohbet) modu eklendi.',
      'Anlık Dinleme (VAD): Konuşma bitene kadar aktif kalan akıllı mikrofon.',
      'Doğal Seslendirme: Gemini\'den gelen yanıtlar akıcı insan sesiyle seslendirilir.',
      'Akıllı Kesme (Interruption): Siz konuşmaya başladığınızda asistan sizi dinlemek için susar.',
      'Bitlis Stüdyo Kimliği: Asistan artık Bitlis Deneyap Atölyeleri kimliğiyle konuşuyor.'
    ]
  },
  {
    version: '2.1.0',
    date: '2 Mart 2026',
    title: 'Modern Arayüz ve Sesli Komut',
    type: 'major',
    changes: [
      'Glassmorphism (Cam Efekti) tabanlı yeni modern tasarım dili.',
      'Sesli komut (Voice Input) desteği eklendi.',
      'Hızlı işlem çipleri (Quick Actions) ile tek tıkla soru sorma.',
      'Mesaj kopyalama özelliği eklendi.',
      'Geçmiş kayıtları tekli veya toplu silme özelliği.',
      'Mobil cihazlar için optimize edilmiş giriş alanı.'
    ]
  },
  {
    version: '2.0.5',
    date: '28 Şubat 2026',
    title: 'Performans İyileştirmeleri',
    type: 'minor',
    changes: [
      'Yapay zeka yanıt hızı %30 artırıldı.',
      'Markdown render motoru güncellendi.',
      'Firebase bağlantı kararlılığı artırıldı.'
    ]
  },
  {
    version: '2.0.0',
    date: '15 Şubat 2026',
    title: 'DeneyapAI v2 Lansmanı',
    type: 'major',
    changes: [
      'Deneyap Kart ve setleri için özel eğitimli model.',
      'Proje Üretici ve Hata Ayıklayıcı modları.',
      'Kullanıcı profili ve seviye sistemi.',
      'Premium üyelik ve lisans aktivasyon sistemi.'
    ]
  }
];

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
      content: 'Selam geleceğin teknoloji fatihi! Ben DeneyapAI. Bitlis\'in teknoloji rüzgarını arkama alarak sana Deneyap projelerinde ve kod hatalarında rehberlik etmeye geldim. \n\nSol taraftan modunu seçebilir veya direkt elindeki malzemeleri yazarak başlayabilirsin!',
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
  const [showChangelog, setShowChangelog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [premiumStep, setPremiumStep] = useState<1 | 2>(1);
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // New Auth States
  const [authView, setAuthView] = useState<'onboarding' | 'email' | 'phone'>('onboarding');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [phoneStep, setPhoneStep] = useState<'number' | 'code'>('number');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Firebase Auth Listener
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? "User logged in" : "No user");
      setFirebaseUser(user);
      
      if (user) {
        // Sync profile with Firebase user if needed
        setProfile(prev => {
          if (!prev) {
            const newProfile: UserProfile = {
              name: user.displayName || 'Gezgin',
              level: 'Başlangıç',
              totalQuestions: 0,
              subscriptionTier: 'FREE',
              isPremium: false,
              deviceId: Math.random().toString(36).substring(7),
              lastLogin: Date.now(),
              securityVerified: true,
              email: user.email || undefined,
              stats: { projectsGenerated: 0, bugsFixed: 0, codeOptimized: 0 },
              achievements: []
            };
            localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
            return newProfile;
          }
          // Update existing profile with email if missing
          if (!prev.email && user.email) {
            const updated = { ...prev, email: user.email };
            localStorage.setItem('tekno_nova_profile', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
        setShowOnboarding(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!auth || authView !== 'phone' || phoneStep !== 'number') return;
    
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          console.log("reCAPTCHA verified");
        },
        'expired-callback': () => {
          setAuthError("reCAPTCHA süresi doldu. Lütfen tekrar deneyin.");
        }
      });
      (window as any).recaptchaVerifier = verifier;
    } catch (err) {
      console.error("reCAPTCHA Init Error:", err);
    }

    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, [auth, authView, phoneStep]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setAuthError('');
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) {
      setAuthError("Lütfen e-posta adresinizi girin.");
      return;
    }
    setAuthError('');
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      setAuthError("Şifre sıfırlama e-postası gönderilemedi. E-posta adresinizi kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setAuthError('');
    setIsLoading(true);
    
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setPhoneStep('code');
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      setAuthError(error.message);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
          (window as any).grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setAuthError('');
    setIsLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (error: any) {
      console.error("Verification Code Error:", error);
      setAuthError("Geçersiz doğrulama kodu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("Starting Google Sign-In...");
    if (!isFirebaseConfigured || !auth) {
      console.error("Firebase not configured or auth not initialized");
      alert("Google ile giriş şu anda devre dışı. Lütfen yönetici ile iletişime geçin.");
      return;
    }
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In Success:", result.user.email);
    } catch (error: any) {
      console.error("Google Sign-In Error Details:", error);
      let msg = "Giriş yapılırken bir hata oluştu.";
      if (error.code === 'auth/unauthorized-domain') {
        msg += "\n\nBu alan adı (domain) Firebase Console'da 'Yetkilendirilmiş Alan Adları' listesine eklenmemiş.";
      } else if (error.code === 'auth/operation-not-allowed') {
        msg += "\n\nGoogle ile Giriş yöntemi Firebase Console'da etkinleştirilmemiş.";
      } else {
        msg += `\n\nHata Kodu: ${error.code || 'Bilinmiyor'}`;
      }
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      // Just sign out of Firebase, but keep local profile if they want?
      // Actually, standard logout should clear the session.
      localStorage.removeItem('tekno_nova_profile');
      localStorage.removeItem('tekno_nova_history');
      window.location.reload();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Tüm verileriniz (mesajlar, başarımlar, istatistikler) kalıcı olarak silinecektir. Bu işlemi onaylıyor musunuz?')) {
      try {
        if (auth) {
          await signOut(auth);
        }
        localStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error("Delete Account Error:", error);
      }
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getDailyLimit = (tier: UserProfile['subscriptionTier'] = 'FREE') => {
    if (tier === 'PRO') return 999999;
    if (tier === 'BASIC') return 90;
    return 5;
  };

  const COOLDOWN_TIME = 20;
  const VALID_LICENSES_BASIC = [
    'TNB-4B2R-9X', 'TNB-7M1L-3A', 'TNB-2K8P-5Z', 'TNB-9W4N-1Y', 'TNB-6H7T-2B'
  ];
  const VALID_LICENSES_PRO = [
    'TNP-1X5C-8D', 'TNP-3V9G-4E', 'TNP-8F2J-6Q', 'TNP-5S1K-7M', 'TNP-4N3W-9L'
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
      const parsedProfile: UserProfile = JSON.parse(storedProfile);
      // Security update: lastLogin and deviceId
      const updatedProfile: UserProfile = {
        ...parsedProfile,
        lastLogin: Date.now(),
        deviceId: parsedProfile.deviceId || Math.random().toString(36).substring(7),
        securityVerified: true,
        subscriptionTier: parsedProfile.subscriptionTier || (parsedProfile.isPremium ? 'PRO' : 'FREE'),
        stats: parsedProfile.stats || { projectsGenerated: 0, bugsFixed: 0, codeOptimized: 0 },
        achievements: parsedProfile.achievements || []
      };
      setProfile(updatedProfile);
      localStorage.setItem('tekno_nova_profile', JSON.stringify(updatedProfile));
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

  const isLimitReached = profile?.subscriptionTier !== 'PRO' && usageCount >= getDailyLimit(profile?.subscriptionTier);

  const getBadge = (count: number) => {
    if (count >= 20) return { name: 'DeneyapAI Fatihi', color: 'text-purple-400', icon: Award };
    if (count >= 10) return { name: 'Kod Ustası', color: 'text-blue-400', icon: Terminal };
    return { name: 'Çaylak Deneyapçı', color: 'text-emerald-400', icon: Sparkles };
  };

  const handleOnboarding = (name: string, level: UserProfile['level']) => {
    const newProfile: UserProfile = { 
      name, 
      level, 
      totalQuestions: 0, 
      subscriptionTier: 'FREE',
      isPremium: false,
      deviceId: Math.random().toString(36).substring(7),
      lastLogin: Date.now(),
      securityVerified: true
    };
    setProfile(newProfile);
    localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
    setShowOnboarding(false);
  };

  const handleLicenseActivation = () => {
    const code = licenseInput.trim().toUpperCase();
    let newTier: UserProfile['subscriptionTier'] | null = null;

    if (VALID_LICENSES_PRO.includes(code)) {
      newTier = 'PRO';
    } else if (VALID_LICENSES_BASIC.includes(code)) {
      newTier = 'BASIC';
    }

    if (newTier) {
      const newProfile: UserProfile = { 
        ...profile!, 
        subscriptionTier: newTier,
        isPremium: newTier === 'PRO' 
      };
      setProfile(newProfile);
      localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
      setShowPremiumModal(false);
      setLicenseInput('');
      setLicenseError('');
      alert(`Tebrikler! ${newTier} üyeliğin aktif edildi. Keyifli kullanımlar! 🚀`);
    } else {
      setLicenseError('Geçersiz lisans kodu. Lütfen kontrol et.');
    }
  };

  const handleRequestLicense = () => {
    const subject = encodeURIComponent('DeneyapAI Lisans Talebi');
    const body = encodeURIComponent(`Merhaba Bitlis Stüdyo,\n\nDeneyapAI Premium için lisans kodu almak istiyorum. Ödeme ve IBAN bilgileri için geri dönüşünü bekliyorum.\n\nAdım: ${profile?.name}\nSeviyem: ${profile?.level}`);
    window.location.href = `mailto:imranyesildag123@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !profile) return;

    if (cooldown > 0) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: `Lütfen biraz bekle! DeneyapAI zekası dinleniyor. ${cooldown} saniye sonra tekrar sorabilirsin. ⏳`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      return;
    }

    if (isLimitReached) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Günlük ücretsiz soru limitine ulaştın! 🚀 Daha fazla soru sormak ve özel modlara erişmek için Pro üye olabilirsin.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      return;
    }

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

    // Update profile stats
    const updatedStats = {
      projectsGenerated: (profile.stats?.projectsGenerated || 0) + (mode === 'PROJECT_GEN' ? 1 : 0),
      bugsFixed: (profile.stats?.bugsFixed || 0) + (mode === 'DEBUGGER' ? 1 : 0),
      codeOptimized: (profile.stats?.codeOptimized || 0) + (mode === 'AI_OPTIMIZER' ? 1 : 0),
    };

    let newAchievements = [...(profile.achievements || [])];
    if (profile.totalQuestions + 1 === 1 && !newAchievements.includes('İlk Adım')) {
      newAchievements.push('İlk Adım');
    }
    if (updatedStats.projectsGenerated === 5 && !newAchievements.includes('Proje Mimarı')) {
      newAchievements.push('Proje Mimarı');
    }
    if (updatedStats.bugsFixed === 5 && !newAchievements.includes('Hata Avcısı')) {
      newAchievements.push('Hata Avcısı');
    }

    const newProfile: UserProfile = { 
      ...profile, 
      totalQuestions: profile.totalQuestions + 1,
      stats: updatedStats,
      achievements: newAchievements
    };
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

    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Bir hata oluştu. Lütfen internet bağlantını kontrol et ve tekrar dene.';
      
      if (error.message === "API_KEY_MISSING") {
        errorMessage = 'Gemini API anahtarı bulunamadı. Lütfen Vercel panelinden GEMINI_API_KEY ortam değişkenini ayarladığınızdan emin olun.';
      } else if (error.message?.includes('API key not valid')) {
        errorMessage = 'Geçersiz API anahtarı. Lütfen API anahtarınızı kontrol edin.';
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    const premiumModes: AppMode[] = ['AI_OPTIMIZER', 'ROADMAP_GEN', 'EXPERT_MENTOR', 'LIVE_VOICE'];
    if (premiumModes.includes(newMode) && profile?.subscriptionTier !== 'PRO') {
      setShowPremiumModal(true);
      setPremiumStep(1);
      return;
    }
    setMode(newMode);
    setActiveTab('chat');
    setShowMobileMenu(false);
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('tekno_nova_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if (window.confirm('Tüm geçmişiniz silinecektir. Emin misiniz?')) {
      setHistory([]);
      localStorage.removeItem('tekno_nova_history');
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız sesli girişi desteklemiyor.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const quickActions = [
    { id: '1', text: 'Deneyap Kart nedir?', icon: Cpu, mode: 'COMPONENT_LIB' },
    { id: '2', text: 'Mesafe sensörü projesi öner', icon: Lightbulb, mode: 'PROJECT_GEN' },
    { id: '3', text: 'Kodumdaki hatayı bul', icon: Bug, mode: 'DEBUGGER' },
    { id: '4', text: 'İHA projesi yol haritası', icon: ChevronRight, mode: 'ROADMAP_GEN' },
  ];

  const badge = profile ? getBadge(profile.totalQuestions) : null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3">
                    <Sparkles className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">Güncelleme Günlüğü</h2>
                    <p className="text-zinc-400 text-sm">DeneyapAI'daki yenilikleri takip et.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChangelog(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-10">
                {CHANGELOG.map((item, idx) => (
                  <div key={idx} className="relative pl-8 border-l border-white/10">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                    <div className="mb-2 flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                        item.type === 'major' ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400"
                      )}>
                        v{item.version}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                    <ul className="space-y-2">
                      {item.changes.map((change, cIdx) => (
                        <li key={cIdx} className="text-sm text-zinc-400 flex items-start gap-2">
                          <div className="mt-1.5 w-1 h-1 bg-emerald-500/50 rounded-full shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowChangelog(false)}
                className="w-full mt-10 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Harika, Devam Et!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding / Auth Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />

              <div className="relative">
                {authView !== 'onboarding' && (
                  <button 
                    onClick={() => {
                      setAuthView('onboarding');
                      setAuthError('');
                      setPhoneStep('number');
                    }}
                    className="absolute -top-2 -left-2 p-2 text-zinc-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4 rotate-3">
                    <ShieldCheck className="text-white w-9 h-9" />
                  </div>
                  <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
                    {authView === 'onboarding' ? 'DeneyapAI\'ya Hoş Geldin' : 
                     authView === 'email' ? (isRegistering ? 'Hesap Oluştur' : 'Giriş Yap') : 
                     'Telefonla Doğrula'}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-2">
                    {authView === 'onboarding' ? 'Geleceğin teknolojisini güvenle inşa etmeye başla.' : 
                     authView === 'email' ? 'E-posta adresinle güvenli oturum aç.' : 
                     'Telefonuna gelecek kod ile hızlıca bağlan.'}
                  </p>
                </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 leading-relaxed font-medium">{authError}</p>
                  </motion.div>
                )}

                {authView === 'onboarding' && (
                  <div className="space-y-4">
                    {isFirebaseConfigured ? (
                      <>
                        <button 
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          className="w-full bg-white text-zinc-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50"
                        >
                          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                          Google ile Devam Et
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setAuthView('email')}
                            className="bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98]"
                          >
                            <Mail className="w-5 h-5 text-emerald-400" />
                            <span className="text-xs">E-posta</span>
                          </button>
                          <button 
                            onClick={() => setAuthView('phone')}
                            className="bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.98]"
                          >
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            <span className="text-xs">Telefon</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                        <Shield className="w-8 h-8 text-amber-500/40 mx-auto mb-3" />
                        <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">Sistem Hazırlanıyor</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">Güvenli giriş sistemleri yapılandırılıyor. Lütfen biraz bekleyin veya yönetici ile iletişime geçin.</p>
                      </div>
                    )}

                    <div className="pt-4 text-center">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">Güvenlik Standartları</p>
                      <div className="flex justify-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="text-[10px]">SSL</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Lock className="w-3 h-3" />
                          <span className="text-[10px]">AES-256</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Smartphone className="w-3 h-3" />
                          <span className="text-[10px]">2FA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {authView === 'email' && (
                  <div className="space-y-4">
                    {resetSent ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl"
                      >
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="text-white w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">E-posta Gönderildi</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                          Şifre sıfırlama bağlantısı <b>{email}</b> adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.
                        </p>
                        <button 
                          onClick={() => {
                            setResetSent(false);
                            setShowForgotPassword(false);
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all"
                        >
                          Giriş Ekranına Dön
                        </button>
                      </motion.div>
                    ) : showForgotPassword ? (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">E-posta Adresi</label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="ornek@mail.com"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Sıfırlama Bağlantısı Gönder'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowForgotPassword(false)}
                          className="w-full text-zinc-500 hover:text-white text-xs font-medium transition-colors py-2"
                        >
                          Giriş ekranına geri dön
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">E-posta Adresi</label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="ornek@mail.com"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Şifre</label>
                            {!isRegistering && (
                              <button 
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest"
                              >
                                Şifremi Unuttum
                              </button>
                            )}
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Hesap Oluştur' : 'Giriş Yap')}
                        </button>

                        <button 
                          type="button"
                          onClick={() => setIsRegistering(!isRegistering)}
                          className="w-full text-zinc-500 hover:text-white text-xs font-medium transition-colors py-2"
                        >
                          {isRegistering ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Yeni hesap oluştur'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {authView === 'phone' && (
                  <div className="space-y-4">
                    {phoneStep === 'number' ? (
                      <form onSubmit={handlePhoneAuth} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Telefon Numarası</label>
                          <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                              type="tel"
                              required
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+90 5XX XXX XX XX"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 ml-1 italic">* Numaranızı ülke koduyla birlikte giriniz (Örn: +905...)</p>
                        </div>

                        <div id="recaptcha-container" className="flex justify-center my-4 scale-90 origin-center"></div>

                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Doğrulama Kodu Gönder'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyCode} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Doğrulama Kodu</label>
                          <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                              type="text"
                              required
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="6 Haneli Kod"
                              maxLength={6}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center tracking-[0.5em] font-mono text-lg"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 text-center mt-2">
                            Kod gelmedi mi? <button type="button" onClick={() => setPhoneStep('number')} className="text-blue-400 hover:underline">Tekrar dene</button>
                          </p>
                        </div>

                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Kodu Doğrula'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[70] w-72 bg-zinc-950 border-r border-zinc-800 lg:hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Star className="text-white w-5 h-5" />
                  </div>
                  <span className="font-display font-bold text-lg">DeneyapAI</span>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Ücretsiz Modlar</div>
                <button
                  onClick={() => handleModeChange('PROJECT_GEN')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'PROJECT_GEN' && activeTab === 'chat'
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Lightbulb className={cn("w-4 h-4", mode === 'PROJECT_GEN' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Proje Üretici</span>
                </button>

                <button
                  onClick={() => handleModeChange('DEBUGGER')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'DEBUGGER' && activeTab === 'chat'
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Bug className={cn("w-4 h-4", mode === 'DEBUGGER' ? "text-blue-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Kod Debugger</span>
                </button>

                <button
                  onClick={() => handleModeChange('COMPONENT_LIB')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'COMPONENT_LIB' && activeTab === 'chat'
                      ? "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Cpu className={cn("w-4 h-4", mode === 'COMPONENT_LIB' ? "text-zinc-300" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Bileşen Kütüphanesi</span>
                </button>

                <button
                  onClick={() => handleModeChange('COMMUNITY_PROJS')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'COMMUNITY_PROJS' && activeTab === 'chat'
                      ? "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Github className={cn("w-4 h-4", mode === 'COMMUNITY_PROJS' ? "text-zinc-300" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Topluluk Projeleri</span>
                </button>

                <div className="pt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Premium Modlar</div>
                <button
                  onClick={() => handleModeChange('AI_OPTIMIZER')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'AI_OPTIMIZER' && activeTab === 'chat'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Zap className={cn("w-4 h-4", mode === 'AI_OPTIMIZER' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">AI Kod Optimizasyonu</span>
                  </div>
                  {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
                </button>

                <button
                  onClick={() => handleModeChange('ROADMAP_GEN')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'ROADMAP_GEN' && activeTab === 'chat'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className={cn("w-4 h-4", mode === 'ROADMAP_GEN' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">Proje Yol Haritası</span>
                  </div>
                  {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
                </button>

                <button
                  onClick={() => handleModeChange('EXPERT_MENTOR')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'EXPERT_MENTOR' && activeTab === 'chat'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Award className={cn("w-4 h-4", mode === 'EXPERT_MENTOR' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">Uzman Mentor</span>
                  </div>
                  {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
                </button>

                <button
                  onClick={() => handleModeChange('LIVE_VOICE')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'LIVE_VOICE' && activeTab === 'chat'
                      ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Radio className={cn("w-4 h-4", mode === 'LIVE_VOICE' ? "text-red-400 animate-pulse" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">Canlı Sesli Sohbet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black px-1 rounded bg-red-500 text-white uppercase">Pro</span>
                    {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
                  </div>
                </button>

                <div className="pt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Kişisel</div>
                <button
                  onClick={() => { setActiveTab('history'); setShowMobileMenu(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    activeTab === 'history'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <HistoryIcon className={cn("w-4 h-4", activeTab === 'history' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Geçmişim</span>
                </button>

                <button
                  onClick={() => { setActiveTab('profile'); setShowMobileMenu(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    activeTab === 'profile'
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <User className={cn("w-4 h-4", activeTab === 'profile' ? "text-purple-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Profilim</span>
                </button>

                {isFirebaseConfigured ? (
                  !firebaseUser && (
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="font-semibold text-sm">Giriş Yap</span>
                    </button>
                  )
                ) : (
                  <div className="px-4 py-2 text-[10px] text-amber-500/60 font-medium uppercase tracking-wider">
                    Firebase Yapılandırması Eksik
                  </div>
                )}
              </nav>

              <div className="p-6 border-t border-zinc-800 space-y-4">
                <button 
                  onClick={() => { setShowChangelog(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm">Neler Yeni? (v2.1.0)</span>
                </button>
                <button 
                  onClick={() => { setShowPrivacyModal(true); setShowMobileMenu(false); }}
                  className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold"
                >
                  Gizlilik Politikası
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="text-emerald-400 w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold">Gizlilik Politikası</h2>
                  <p className="text-zinc-400 text-sm">Verileriniz ve güvenliğiniz bizim için önemli.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6 text-sm text-zinc-300 leading-relaxed">
                <section>
                  <h3 className="text-zinc-100 font-bold mb-2 uppercase tracking-wider text-xs">1. Veri Toplama</h3>
                  <p>DeneyapAI, kullanıcı deneyimini iyileştirmek ve kişiselleştirilmiş mentorluk sunmak amacıyla adınız, teknoloji seviyeniz ve uygulama içi geçmişinizi toplar. Bu veriler tamamen yerel olarak (LocalStorage) cihazınızda saklanır.</p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-bold mb-2 uppercase tracking-wider text-xs">2. AI ve Üçüncü Taraflar</h3>
                  <p>Sorularınız, yanıt üretilmesi amacıyla Google Gemini API'sine gönderilir. Bu süreçte kişisel verileriniz (adınız vb.) anonimleştirilerek veya sadece bağlam sağlamak amacıyla kullanılır. Verileriniz reklam amaçlı üçüncü taraflarla paylaşılmaz.</p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-bold mb-2 uppercase tracking-wider text-xs">3. Premium ve Ödemeler</h3>
                  <p>Premium üyelik için kullanılan lisans kodları ve aktivasyon bilgileri, sistem güvenliği ve hak sahipliği doğrulaması için Bitlis Stüdyo sunucularında (varsa) veya yerel olarak doğrulanır. Ödeme bilgileri doğrudan Bitlis Stüdyo ile iletişime geçilerek manuel olarak yönetilir.</p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-bold mb-2 uppercase tracking-wider text-xs">4. Kullanıcı Hakları</h3>
                  <p>Uygulama içindeki "Verileri Sıfırla" seçeneğini kullanarak cihazınızda saklanan tüm verileri dilediğiniz zaman silebilirsiniz. Bu işlem geri alınamaz.</p>
                </section>

                <section>
                  <h3 className="text-zinc-100 font-bold mb-2 uppercase tracking-wider text-xs">5. İletişim</h3>
                  <p>Gizlilik politikamız hakkında sorularınız için imranyesildag123@gmail.com adresi üzerinden bizimle iletişime geçebilirsiniz.</p>
                </section>

                <div className="pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
                  Son Güncelleme: 28 Şubat 2026 | Bitlis Stüdyo
                </div>
              </div>

              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Anladım
              </button>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {premiumStep === 1 ? (
                <div className="space-y-6 max-h-[90vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Zap className="text-amber-400 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Üyelik Planları</h2>
                    <p className="text-zinc-400 text-xs mt-1">Sana en uygun planı seç, teknolojide öne geç!</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Özellikler</th>
                          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Ücretsiz</th>
                          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 text-center">Basit</th>
                          <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 text-center">Pro</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {[
                          { name: 'Günlük Mesaj Limiti', free: '5', basic: '90', pro: 'Sınırsız' },
                          { name: 'Temel Modlar', free: '✅', basic: '✅', pro: '✅' },
                          { name: 'Kod Hata Ayıklama', free: '✅', basic: '✅', pro: '✅' },
                          { name: 'AI Kod Optimizasyonu', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Proje Yol Haritası', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Uzman Mentorluk', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Öncelikli Destek', free: '✖️', basic: '✖️', pro: '✅' },
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-2 text-zinc-300 font-medium">{row.name}</td>
                            <td className="py-3 px-2 text-center">{row.free}</td>
                            <td className="py-3 px-2 text-center text-blue-400">{row.basic}</td>
                            <td className="py-3 px-2 text-center text-amber-400">{row.pro}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 flex flex-col items-center text-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Basit Sürüm</span>
                      <div className="text-2xl font-bold text-white mb-1">54,99 TL <span className="text-xs text-zinc-500 font-normal">/ Tek Sefer</span></div>
                      <p className="text-[10px] text-zinc-400 mb-3">Daha fazla soru sormak isteyenler için.</p>
                      <button 
                        onClick={() => window.open('https://www.shopier.com/bitlisstudyo/44761101', '_blank')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 mb-2"
                      >
                        Shopier ile Satın Al
                      </button>
                      <button 
                        onClick={() => setPremiumStep(2)}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-bold py-1.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Lisans Kodunu Gir
                      </button>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-tighter">En Popüler</div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Pro Sürüm</span>
                      <div className="text-2xl font-bold text-white mb-1">169,99 TL <span className="text-xs text-zinc-500 font-normal">/ Tek Sefer</span></div>
                      <p className="text-[10px] text-zinc-400 mb-3">Tüm özellikler ve sınırsız mentorluk.</p>
                      <button 
                        onClick={() => window.open('https://www.shopier.com/bitlisstudyo/44761166', '_blank')}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mb-2"
                      >
                        Shopier ile Satın Al
                      </button>
                      <button 
                        onClick={() => setPremiumStep(2)}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] font-bold py-1.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Lisans Kodunu Gir
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-2">
                    <button 
                      onClick={() => setPremiumStep(2)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 underline font-bold uppercase tracking-widest"
                    >
                      Lisans Kodun mu Var?
                    </button>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-zinc-400 leading-relaxed text-center italic">
                      "Ödemeler Shopier güvencesiyle tüm kredi kartları ile yapılabilir. Satın alım sonrası lisans kodunuz e-posta ile gönderilecektir."
                    </p>
                  </div>
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
                      onClick={() => setPremiumStep(1)}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-2"
                    >
                      Lisans kodun yok mu? Shopier ile Satın Al
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 glass-dark flex flex-col hidden lg:flex shrink-0 h-screen sticky top-0 z-20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3">
              <Star className="text-white w-6 h-6" />
            </div>
            <div>
                  <h1 className="font-display font-bold text-xl tracking-tight">DeneyapAI</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Deneyap Mentor</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Ücretsiz Modlar</div>
          <button
            onClick={() => handleModeChange('PROJECT_GEN')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'PROJECT_GEN' && activeTab === 'chat'
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <Lightbulb className={cn("w-4 h-4", mode === 'PROJECT_GEN' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
            <span className="font-semibold text-sm">Proje Üretici</span>
          </button>

          <button
            onClick={() => handleModeChange('DEBUGGER')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'DEBUGGER' && activeTab === 'chat'
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <Bug className={cn("w-4 h-4", mode === 'DEBUGGER' ? "text-blue-400" : "group-hover:text-zinc-200")} />
            <span className="font-semibold text-sm">Kod Debugger</span>
          </button>

          <button
            onClick={() => handleModeChange('COMPONENT_LIB')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'COMPONENT_LIB' && activeTab === 'chat'
                ? "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <Cpu className={cn("w-4 h-4", mode === 'COMPONENT_LIB' ? "text-zinc-300" : "group-hover:text-zinc-200")} />
            <span className="font-semibold text-sm">Bileşen Kütüphanesi</span>
          </button>

          <button
            onClick={() => handleModeChange('COMMUNITY_PROJS')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'COMMUNITY_PROJS' && activeTab === 'chat'
                ? "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <Github className={cn("w-4 h-4", mode === 'COMMUNITY_PROJS' ? "text-zinc-300" : "group-hover:text-zinc-200")} />
            <span className="font-semibold text-sm">Topluluk Projeleri</span>
          </button>

          <div className="pt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Premium Modlar</div>
          <button
            onClick={() => handleModeChange('AI_OPTIMIZER')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'AI_OPTIMIZER' && activeTab === 'chat'
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Zap className={cn("w-4 h-4", mode === 'AI_OPTIMIZER' ? "text-amber-400" : "group-hover:text-zinc-200")} />
              <span className="font-semibold text-sm">AI Kod Optimizasyonu</span>
            </div>
            {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
          </button>

          <button
            onClick={() => handleModeChange('ROADMAP_GEN')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'ROADMAP_GEN' && activeTab === 'chat'
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <ChevronRight className={cn("w-4 h-4", mode === 'ROADMAP_GEN' ? "text-amber-400" : "group-hover:text-zinc-200")} />
              <span className="font-semibold text-sm">Proje Yol Haritası</span>
            </div>
            {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
          </button>

          <button
            onClick={() => handleModeChange('EXPERT_MENTOR')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'EXPERT_MENTOR' && activeTab === 'chat'
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Award className={cn("w-4 h-4", mode === 'EXPERT_MENTOR' ? "text-amber-400" : "group-hover:text-zinc-200")} />
              <span className="font-semibold text-sm">Uzman Mentor</span>
            </div>
            {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
          </button>

          <button
            onClick={() => handleModeChange('LIVE_VOICE')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
              mode === 'LIVE_VOICE' && activeTab === 'chat'
                ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Radio className={cn("w-4 h-4", mode === 'LIVE_VOICE' ? "text-red-400 animate-pulse" : "group-hover:text-zinc-200")} />
              <span className="font-semibold text-sm">Canlı Sesli Sohbet</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-black px-1 rounded bg-red-500 text-white uppercase">Pro</span>
              {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/50" />}
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

          {isFirebaseConfigured ? (
            !firebaseUser && (
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <LogIn className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Giriş Yap</div>
                </div>
              </button>
            )
          ) : (
            <div className="px-4 py-3 text-[10px] text-amber-500/40 font-bold uppercase tracking-widest">
              Bulut Kapalı
            </div>
          )}

          {profile?.subscriptionTier !== 'PRO' && (
            <div className="pt-4 px-2">
              <button
                onClick={() => { setShowPremiumModal(true); setPremiumStep(1); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <Award className="w-5 h-5" />
                <span className="text-sm">
                  {profile?.subscriptionTier === 'BASIC' ? 'Pro\'ya Yükselt' : 'Premium\'a Geç'}
                </span>
              </button>
            </div>
          )}
        </nav>

          <div className="p-6 mt-auto space-y-4">
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowChangelog(true)}
                className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold flex items-center gap-2"
              >
                <Sparkles className="w-3 h-3" />
                Neler Yeni? (v2.1.0)
              </button>
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold text-left"
              >
                Gizlilik Politikası
              </button>
            </div>
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
      <main className="flex-1 flex flex-col relative pb-32 lg:pb-0 min-w-0">
        {/* Header */}
        <header className="p-4 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="flex items-center gap-2 p-2 -ml-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest pr-1">Menü</span>
            </button>
            <div className="flex items-center gap-2">
              <Star className="text-emerald-500 w-5 h-5" />
              <span className="font-display font-bold text-sm">DeneyapAI</span>
            </div>
          </div>
          
          <div className="hidden lg:block">
             <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
               {activeTab === 'chat' ? (
                 mode === 'PROJECT_GEN' ? 'Akıllı Proje Üretici' : 
                 mode === 'DEBUGGER' ? 'Kod Hata Ayıklayıcı' :
                 mode === 'AI_OPTIMIZER' ? 'AI Kod Optimizasyonu' :
                 mode === 'ROADMAP_GEN' ? 'Proje Yol Haritası' :
                 mode === 'COMPONENT_LIB' ? 'Bileşen Kütüphanesi' :
                 mode === 'COMMUNITY_PROJS' ? 'Topluluk Projeleri' :
                 mode === 'LIVE_VOICE' ? 'Canlı Sesli Sohbet' :
                 'Uzman Mentor'
               ) : activeTab === 'history' ? 'Geçmiş Kayıtlar' : 'Kullanıcı Profili'}
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
                  {profile.subscriptionTier === 'PRO' && <span className="bg-amber-500 text-black text-[8px] font-black px-1 rounded uppercase">Pro</span>}
                  {profile.subscriptionTier === 'BASIC' && <span className="bg-blue-500 text-white text-[8px] font-black px-1 rounded uppercase">Basit</span>}
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
            mode === 'LIVE_VOICE' ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                <Radio className="w-12 h-12 animate-pulse text-red-500/50" />
                <p className="text-sm font-medium">Canlı Sesli Sohbet Modu Aktif</p>
                <button 
                  onClick={() => setMode('PROJECT_GEN')}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Sohbetten Çık
                </button>
              </div>
            ) : (
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
                      "max-w-[85%] md:max-w-[70%] rounded-2xl p-4 md:p-6 shadow-xl relative group",
                      msg.role === 'user' 
                        ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-none border border-emerald-500/30" 
                        : "glass border border-white/10 rounded-tl-none"
                    )}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 text-emerald-400">
                          <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">DeneyapAI Mentor</span>
                        </div>
                      )}
                      {msg.role === 'assistant' && (
                        <button 
                          onClick={() => handleCopy(msg.content, idx)}
                          className="absolute top-4 right-4 p-2 glass border border-white/10 rounded-lg text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
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
                    <span className="text-xs text-zinc-500 font-medium">DeneyapAI zekası çalışıyor...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) ) : activeTab === 'history' ? (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <HistoryIcon className="text-amber-400 w-6 h-6" />
                  <h2 className="text-2xl font-display font-bold">Geçmiş Kayıtlarım</h2>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Tümünü Temizle
                  </button>
                )}
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-20 glass border border-dashed border-white/10 rounded-3xl">
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
                      className="glass border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group relative"
                    >
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            item.mode === 'PROJECT_GEN' ? "bg-emerald-500/10 text-emerald-400" : 
                            item.mode === 'LIVE_VOICE' ? "bg-red-500/10 text-red-400" :
                            "bg-blue-500/10 text-blue-400"
                          )}>
                            {item.mode === 'PROJECT_GEN' ? <Lightbulb className="w-4 h-4" /> : 
                             item.mode === 'LIVE_VOICE' ? <Radio className="w-4 h-4" /> :
                             <Bug className="w-4 h-4" />}
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
            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-emerald-400 w-6 h-6" />
                <h2 className="text-2xl font-display font-bold">Profilim</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-zinc-800 border-4 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-xl relative group">
                      <User className="w-12 h-12" />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full shadow-lg">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
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
                        <span className={cn("font-bold", 
                          profile?.subscriptionTier === 'PRO' ? "text-amber-400" : 
                          profile?.subscriptionTier === 'BASIC' ? "text-blue-400" : "text-zinc-500"
                        )}>
                          {profile?.subscriptionTier === 'PRO' ? 'Pro Sürüm' : 
                           profile?.subscriptionTier === 'BASIC' ? 'Basit Sürüm' : 'Ücretsiz'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Başarımlar
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile?.achievements && profile.achievements.length > 0 ? (
                        profile.achievements.map((ach, i) => (
                          <span key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            {ach}
                          </span>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-xs italic">Henüz başarım kazanılmadı. İlk sorunu sor!</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Kullanım İstatistikleri
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Üretilen Projeler</div>
                        <div className="text-2xl font-bold text-white">{profile?.stats?.projectsGenerated || 0}</div>
                      </div>
                      <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Çözülen Hatalar</div>
                        <div className="text-2xl font-bold text-white">{profile?.stats?.bugsFixed || 0}</div>
                      </div>
                      <div className="p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">Optimizasyonlar</div>
                        <div className="text-2xl font-bold text-white">{profile?.stats?.codeOptimized || 0}</div>
                      </div>
                    </div>
                  </div>

                  {profile?.subscriptionTier !== 'PRO' ? (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
                      <Award className="w-10 h-10 mb-4" />
                      <h4 className="text-xl font-bold mb-2">
                        {profile?.subscriptionTier === 'BASIC' ? 'Pro\'ya Yükselt' : 'Premium\'a Yükselt'}
                      </h4>
                      <p className="text-amber-100 text-sm mb-6 leading-relaxed max-w-md">
                        {profile?.subscriptionTier === 'BASIC' 
                          ? 'Sınırsız mesaj ve tüm kilitli modlara erişmek için Pro sürümüne geçin.'
                           : 'Sınırları kaldırın, Bitlis Stüdyo\'dan özel destek alın ve DeneyapAI\'nın tüm gücünü keşfedin.'}
                      </p>
                      <button 
                        onClick={() => { setShowPremiumModal(true); setPremiumStep(1); }}
                        className="w-full sm:w-auto px-8 bg-white text-amber-600 font-bold py-3 rounded-xl hover:bg-amber-50 transition-all shadow-lg"
                      >
                        {profile?.subscriptionTier === 'BASIC' ? 'Pro\'ya Geç' : 'Hemen Yükselt'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-900 border border-emerald-500/20 rounded-3xl p-8 border-dashed flex items-center gap-6">
                      <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                        <Sparkles className="text-emerald-400 w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-emerald-400 mb-1">Premium Aktif</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Sınırsız erişim ve tüm özellikler açık. Teknoloji fatihi olarak yoluna devam et!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Güvenlik Durumu
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Hesap Doğrulama</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Aktif</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">GÜVENLİ</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">2FA (İki Faktörlü Doğrulama)</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              {firebaseUser?.phoneNumber ? 'Telefon ile Aktif' : 'E-posta ile Aktif'}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">AÇIK</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-zinc-500" />
                      Hesap ve Ayarlar
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {isFirebaseConfigured && !firebaseUser && (
                        <button 
                          onClick={handleGoogleSignIn}
                          className="flex items-center justify-center gap-2 text-zinc-900 bg-white hover:bg-zinc-100 text-sm font-bold p-3 rounded-xl transition-all"
                        >
                          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                          Google ile Bağlan
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'DeneyapAI: Deneyap Mentor',
                              text: 'Deneyap projelerinde ve kod hatalarında sana rehberlik edecek akıllı asistan!',
                              url: window.location.href
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Uygulama linki kopyalandı!');
                          }
                        }}
                        className="flex items-center justify-center gap-2 text-zinc-300 hover:text-white text-sm font-bold p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Uygulamayı Paylaş
                      </button>
                      <button 
                        onClick={() => setShowPrivacyModal(true)}
                        className="flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-200 text-xs font-bold p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Gizlilik Politikası
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 text-zinc-300 hover:text-white text-sm font-bold p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                      <button 
                        onClick={handleDeleteAccount}
                        className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold p-3 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hesabı Sil ve Sıfırla
                      </button>
                    </div>
                    {!isFirebaseConfigured && (
                      <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                        <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-widest mb-1">Bulut Senkronizasyonu Kapalı</p>
                        <p className="text-[9px] text-zinc-500">Vercel panelinden Firebase ayarlarını yaparak bulut kaydını aktif edebilirsiniz.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Only in Chat Tab) */}
        {activeTab === 'chat' && mode !== 'LIVE_VOICE' && (
          <div className="p-4 md:p-8 pt-0 fixed bottom-0 left-0 right-0 lg:relative bg-zinc-950/80 backdrop-blur-lg lg:bg-transparent z-20">
            {isLimitReached ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center mb-4"
              >
                <p className="text-amber-200 text-sm md:text-base leading-relaxed">
                  Günlük hakkın doldu teknoloji fatihi! 🚀 API maliyetlerini karşılamak ve sistemi açık tutmak için sınırlı kontenjan kullanıyoruz.
                </p>
                {profile?.subscriptionTier !== 'PRO' && (
                  <button 
                    onClick={() => { setShowPremiumModal(true); setPremiumStep(1); }}
                    className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2 rounded-xl transition-all"
                  >
                    {profile?.subscriptionTier === 'BASIC' ? 'Pro\'ya Yükselt ve Sınırları Kaldır' : 'Premium\'a Geç ve Sınırları Kaldır'}
                  </button>
                )}
              </motion.div>
            ) : (
              <form 
                onSubmit={handleSubmit}
                className="relative max-w-4xl mx-auto"
              >
                <div className="absolute -top-16 left-0 right-0 flex gap-2 overflow-x-auto pb-4 px-2 no-scrollbar">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        setMode(action.mode as AppMode);
                        setInput(action.text);
                      }}
                      className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 glass-emerald rounded-full text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/30"
                    >
                      <action.icon className="w-3 h-3" />
                      {action.text}
                    </button>
                  ))}
                </div>
                <div className="absolute -top-8 left-0 flex gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                    mode === 'PROJECT_GEN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                    mode === 'DEBUGGER' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>
                    {mode === 'PROJECT_GEN' ? 'Akıllı Proje Üretici' : 
                     mode === 'DEBUGGER' ? 'Kod Hata Ayıklayıcı' :
                     mode === 'AI_OPTIMIZER' ? 'AI Kod Optimizasyonu' :
                     mode === 'ROADMAP_GEN' ? 'Proje Yol Haritası' :
                     mode === 'COMPONENT_LIB' ? 'Bileşen Kütüphanesi' :
                     mode === 'COMMUNITY_PROJS' ? 'Topluluk Projeleri' :
                     'Uzman Mentor'}
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
                  placeholder={
                    mode === 'PROJECT_GEN' ? "Elindeki malzemeleri yaz (Örn: Deneyap Kart, Mesafe Sensörü...)" : 
                    mode === 'DEBUGGER' ? "Hatalı kodunu veya hata mesajını buraya yapıştır..." :
                    mode === 'AI_OPTIMIZER' ? "Optimize etmek istediğin kodu buraya yapıştır..." :
                    mode === 'ROADMAP_GEN' ? "Hangi proje için yol haritası istiyorsun? (Örn: Akıllı Tarım Sistemi)" :
                    mode === 'COMPONENT_LIB' ? "Hangi bileşen hakkında bilgi almak istersin? (Örn: DHT11, Servo Motor)" :
                    mode === 'COMMUNITY_PROJS' ? "Ne tür projelerden ilham almak istersin? (Örn: İHA, Robotik)" :
                    "Uzman mentora ne danışmak istersin?"
                  }
                  className="w-full glass border border-white/10 rounded-2xl p-4 pr-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all min-h-[60px] max-h-[200px] resize-none text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      isListening ? "bg-red-500 text-white animate-pulse" : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading || cooldown > 0}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 min-w-[44px] flex items-center justify-center"
                  >
                    {cooldown > 0 ? (
                      <span className="text-xs font-bold">{cooldown}</span>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            )}
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-center text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                DeneyapAI • Bitlis Stüdyo • Milli Teknoloji Hamlesi
              </p>
              <p className="text-[9px] text-zinc-700 font-medium">
                Bitlis Stüdyo tarafından Bitlis'te geliştirildi.
              </p>
            </div>
          </div>
        )}
        {/* Live Voice Overlay */}
      <AnimatePresence>
        {mode === 'LIVE_VOICE' && activeTab === 'chat' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <LiveVoiceView 
              isPremium={profile?.isPremium || profile?.subscriptionTier === 'PRO'} 
              onClose={() => setMode('PROJECT_GEN')} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-800 px-6 py-3 flex items-center justify-between z-50">
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
                    <p>DeneyapAI, kullanıcının deneyimini kişiselleştirmek için adınız ve teknoloji seviyeniz gibi temel bilgileri toplar. Bu veriler tamamen tarayıcınızın yerel depolamasında (localStorage) saklanır ve sunucularımıza gönderilmez.</p>
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
                    <p>Gizlilikle ilgili her türlü sorunuz için Bitlis Stüdyo ekibine <strong>imranyesildag123@gmail.com</strong> adresinden ulaşabilirsiniz.</p>
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
