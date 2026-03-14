import React, { useState, useRef, useEffect } from 'react';
import { auth, googleProvider, isFirebaseConfigured, db, firebaseConfigError } from './services/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Lock,
  Settings,
  Key,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
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
  Share2,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Image as ImageIcon,
  CreditCard,
  HelpCircle,
  FileText,
  Bell,
  Trophy,
  GraduationCap,
  Monitor,
  MapPin,
  Smartphone,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateResponse, generateQuiz } from './services/gemini';
import { AppMode, Message, UserProfile, HistoryItem } from './types';
import LiveVoiceView from './components/LiveVoiceView';
import Leaderboard from './components/Leaderboard';
import { OTP } from 'otplib';
import { QRCodeSVG } from 'qrcode.react';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// Create a robust authenticator instance for otplib v13+
const authenticator = new OTP();

// Check if otplib is loaded
if (!authenticator) {
  console.error("otplib authenticator is not initialized correctly");
}

interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: 'major' | 'minor' | 'patch';
}

const CHANGELOG: ChangelogItem[] = [
  {
    version: '4.2.0',
    date: '14 Mart 2026',
    title: 'Güvenlik ve Hesap Yönetimi Güncellemesi',
    type: 'minor',
    changes: [
      'Güvenlik Paneli: Giriş yapılan cihazlar ve detaylı konum bilgileri eklendi.',
      'Yeni Giriş Uyarısı: Hesabınıza farklı bir cihazdan giriş yapıldığında anlık bildirim.',
      'Şifre Değiştirme: Profil ayarlarından güvenli şifre güncelleme özelliği.',
      'Oturum Yönetimi: Aktif oturumları görüntüleme ve takip etme imkanı.'
    ]
  },
  {
    version: '4.1.0',
    date: '7 Mart 2026',
    title: 'Topluluk ve Görsel Üretici Güncellemesi',
    type: 'minor',
    changes: [
      'Görsel Üretici Limitleri: Ücretsiz (2), Basic (25), Pro (Sınırsız) olarak güncellendi.',
      'Topluluk Vitrini İyileştirmeleri: Projeler için detaylı görünüm ve görsel URL desteği eklendi.',
      'Hesap Oluşturma: Başarılı kayıt sonrası bilgilendirme bildirimi eklendi.',
      'Hata Düzeltmeleri: Çalışmayan bazı butonlar ve UI hataları giderildi.',
      'Performans: Sayfa geçişleri ve modal animasyonları optimize edildi.'
    ]
  },
  {
    version: '4.0.0',
    date: '6 Mart 2026',
    title: 'Büyük Yeni Özellik Paketi: Quiz, Vitrin ve İstatistikler',
    type: 'major',
    changes: [
      'Teknoloji Bilgi Yarışması (Quiz): Gemini destekli interaktif bilgi yarışması eklendi.',
      'Topluluk Vitrini (Showcase): Projelerinizi paylaşabileceğiniz ve diğerlerini görebileceğiniz alan.',
      'Gelişmiş İstatistikler: Recharts ile görselleştirilmiş kullanım ve başarı grafikleri.',
      'Yeni UI Bileşenleri: Daha akıcı geçişler ve modern yan panel kategorileri.',
      'Performans Optimizasyonu: Uygulama yükleme hızı ve bellek kullanımı iyileştirildi.'
    ]
  },
  {
    version: '3.0.0',
    date: '4 Mart 2026',
    title: 'Büyük Deneyim Güncellemesi: Abonelik Sayfası ve SSS',
    type: 'major',
    changes: [
      'Abonelik Yönetimi: Artık bir popup değil, tam kapsamlı bir sayfa.',
      'Sıkça Sorulan Sorular (SSS): Uygulama hakkında tüm merak edilenler tek bir yerde.',
      'Hizmet Şartları: Kullanım koşulları ve yasal bilgilendirme eklendi.',
      'Uygulama İçi Bildirimler: Tarayıcı uyarıları yerine modern in-app bildirimler.',
      'Yeni Özellikler: AI Görsel Üretici ve Canlı Sesli Sohbet daha stabil hale getirildi.',
      'Gelişmiş Profil: Kullanım istatistikleri ve başarımlar daha detaylı.'
    ]
  },
  {
    version: '2.5.0',
    date: '5 Mart 2026',
    title: 'Büyük Güncelleme: AI Görsel Üretici ve Güvenlik',
    type: 'major',
    changes: [
      'AI Görsel Üretici (Gemini 2.5 Flash Image) ile teknolojik tasarımlar üretme.',
      'Google ile giriş yaparken yaşanan "Siyah Ekran" hatası giderildi.',
      '2FA (İki Faktörlü Doğrulama) sistemi tamamen stabilize edildi.',
      'Yeni "Splash Screen" (Açılış Ekranı) ile daha hızlı ve güvenli yükleme.',
      'Günlük Teknoloji İpucu özelliği eklendi.',
      'Sidebar kategorileri ve modern ikon seti güncellendi.'
    ]
  },
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

const LICENSE_CODES = [
  'DENEYAP_PRO_2026',
  'BITLIS_STUDIO_PRO',
  'TEKNOFEST_GURU',
  'KAMURAN_SPECIAL',
  'EGITMEN_PRO_V3'
];

const DAILY_TIPS = [
  "Deneyap Kart'ın dahili Wi-Fi ve Bluetooth özelliği ile IoT projeleri geliştirebilirsin.",
  "HC-SR04 mesafe sensörü ile engel tanımayan robotlar yapabilirsin.",
  "TEKNOFEST raporlarında teknik detaylara ve özgünlüğe önem vermelisin.",
  "Bitlis'in soğuk kış günlerinde akıllı ev sistemleri ile ısınma kontrolü yapabilirsin.",
  "LDR sensörü kullanarak karanlıkta yanan akıllı sokak lambaları tasarlayabilirsin.",
  "Kod yazarken yorum satırı eklemek, projeni başkalarının anlamasını kolaylaştırır.",
  "DeneyapAI ile kodundaki hataları saniyeler içinde bulabilirsin!"
];

const getDeviceInfo = async () => {
  const userAgent = navigator.userAgent;
  let deviceName = 'Bilinmeyen Cihaz';
  
  if (/android/i.test(userAgent)) deviceName = 'Android Cihaz';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) deviceName = 'iOS Cihaz';
  else if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';
  else if (/Macintosh/i.test(userAgent)) deviceName = 'MacBook';
  else if (/Linux/i.test(userAgent)) deviceName = 'Linux PC';

  let location = 'Bilinmeyen Konum';
  let ip = '0.0.0.0';

  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data.city) {
      location = `${data.city}, ${data.region}, ${data.country_name}`;
      ip = data.ip;
    }
  } catch (e) {
    console.error("Location fetch error:", e);
  }

  return { deviceName, location, ip };
};

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-2 py-1">
    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }} />
    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-typing-dot" style={{ animationDelay: '200ms' }} />
    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-typing-dot" style={{ animationDelay: '400ms' }} />
  </div>
);

const Typewriter = ({ text, speed = 15, onComplete }: { text: string, speed?: number, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  
  // Update ref whenever onComplete changes without triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    setIsComplete(false);
    
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      
      if (i >= text.length) {
        clearInterval(timer);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed]); // onComplete is intentionally excluded from dependencies

  return (
    <div className="relative">
      <Markdown>{displayedText}</Markdown>
      {!isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-1.5 h-5 bg-emerald-500 ml-1 align-middle"
        />
      )}
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('PROJECT_GEN');
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'profile' | 'modes'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Selam geleceğin teknoloji fatihi! Ben DeneyapAI. Bitlis\'in teknoloji rüzgarını arkama alarak sana Deneyap projelerinde ve kod hatalarında rehberlik etmeye geldim. \n\nSol taraftan modunu seçebilir veya direkt elindeki malzemeleri yazarak başlayabilirsin!',
      timestamp: Date.now(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showDailyTip, setShowDailyTip] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQRCode, setTwoFAQRCode] = useState('');
  const [twoFAVerifyCode, setTwoFAVerifyCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{url: string, prompt: string, timestamp: number}[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<{title: string, description: string, level: string, points: number} | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<{question: string, options: string[], correctIdx: number}[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{id: string, title: string, author: string, description: string, likes: number, category: string, image?: string} | null>(null);
  const [showcaseProjects, setShowcaseProjects] = useState<{id: string, title: string, author: string, description: string, likes: number, category: string, image?: string}[]>([]);
  const [licenseInput, setLicenseInput] = useState('');
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editLevel, setEditLevel] = useState<'Başlangıç' | 'Orta' | 'İleri'>('Başlangıç');
  const [showNewFeaturesPopup, setShowNewFeaturesPopup] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showNewLoginPopup, setShowNewLoginPopup] = useState(false);
  const [lastSession, setLastSession] = useState<any>(null);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallNotification, setShowInstallNotification] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PREMIUM_MODES: AppMode[] = ['AI_OPTIMIZER', 'ROADMAP_GEN', 'EXPERT_MENTOR', 'LIVE_VOICE', 'IMAGE_GEN', 'REPORT_GEN', 'CIRCUIT_ASSISTANT', 'CODE_CONVERTER'];

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('deneyap_ai_last_seen_version');
    const currentVersion = '4.2.0';
    
    if (lastSeenVersion !== currentVersion) {
      const timer = setTimeout(() => {
        setShowNewFeaturesPopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show the notification after a short delay if not already installed
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      if (!isInstalled) {
        setTimeout(() => setShowInstallNotification(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      addNotification("DeneyapAI başarıyla yükleniyor! 🚀", "success");
    }
    
    setDeferredPrompt(null);
    setShowInstallNotification(false);
  };

  const closeNewFeaturesPopup = () => {
    localStorage.setItem('deneyap_ai_last_seen_version', '4.2.0');
    setShowNewFeaturesPopup(false);
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !profile) return;
    
    const subject = encodeURIComponent(`DeneyapAI Geri Bildirim: ${profile.name}`);
    const body = encodeURIComponent(
      `Yeni Geri Bildirim\n` +
      `------------------\n` +
      `Gönderen: ${profile.name} (${profile.email})\n` +
      `Rol: ${profile.role || 'Öğrenci'}\n` +
      `Şehir: ${profile.city || 'Belirtilmemiş'}\n\n` +
      `Mesaj:\n${feedbackText}`
    );
    
    const mailtoUrl = `mailto:imranyesildag123@gmail.com?subject=${subject}&body=${body}`;
    
    // Varsayılan e-posta uygulamasını aç
    window.location.href = mailtoUrl;
    
    addNotification("E-posta uygulaması açıldı! Lütfen mesajı gönderin. ❤️", "success");
    setFeedbackText('');
    setShowFeedbackModal(false);

    // İsteğe bağlı: Firestore'a yine de kaydet
    if (db) {
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'feedbacks'), {
          name: profile.name,
          email: profile.email,
          message: feedbackText,
          timestamp: serverTimestamp(),
          type: 'gmail_draft_initiated'
        });
      } catch (e) {
        console.error("Firestore backup error:", e);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    const updated: UserProfile = {
      ...profile,
      name: editName,
      city: editCity,
      institution: editInstitution,
      level: editLevel
    };
    
    setProfile(updated);
    localStorage.setItem('deneyapai_profile', JSON.stringify(updated));
    
    if (firebaseUser && db) {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', firebaseUser.uid), updated, { merge: true });
    }
    
    setShowEditProfileModal(false);
    addNotification("Profil başarıyla güncellendi! ✨", "success");
  };

  const handleActivateLicense = async () => {
    if (!profile) return;
    
    const code = licenseInput.trim().toUpperCase();
    if (LICENSE_CODES.includes(code)) {
      const updated: UserProfile = { 
        ...profile, 
        role: 'INSTRUCTOR', 
        subscriptionTier: 'PRO',
        isPremium: true
      };
      setProfile(updated);
      localStorage.setItem('deneyapai_profile', JSON.stringify(updated));
      
      if (firebaseUser && db) {
        await setDoc(doc(db, 'users', firebaseUser.uid), updated, { merge: true });
      }
      
      addNotification("Lisans başarıyla aktif edildi! Pro özellikler açıldı. 🎓", "success");
      setLicenseInput('');
    } else {
      addNotification("Geçersiz lisans kodu. Lütfen kontrol edin.", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser || !currentPassword || !newPassword) {
      addNotification("Lütfen tüm alanları doldurun.", "error");
      return;
    }

    if (newPassword.length < 6) {
      addNotification("Yeni şifre en az 6 karakter olmalıdır.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      
      addNotification("Şifreniz başarıyla güncellendi! 🔐", "success");
      setShowPasswordChangeModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      console.error("Password change error:", error);
      let msg = "Şifre değiştirilemedi.";
      if (error.code === 'auth/wrong-password') msg = "Mevcut şifreniz hatalı.";
      else if (error.code === 'auth/too-many-requests') msg = "Çok fazla deneme yapıldı. Lütfen sonra tekrar deneyin.";
      addNotification(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = () => {
    try {
      if (profile?.twoFAEnabled) return;
      
      console.log("Enabling 2FA for profile:", profile?.email);
      
      if (!authenticator) {
        throw new Error("Authenticator kütüphanesi yüklenemedi.");
      }

      // Generate a secret
      const secret = authenticator.generateSecret();
      console.log("Secret generated:", secret ? "Yes" : "No");
      
      // Generate otpauth URL for QR code
      const otpauth = authenticator.generateURI({
        secret,
        label: profile?.email || 'user',
        issuer: 'DeneyapAI'
      });
      console.log("OTPAuth URL generated:", otpauth ? "Yes" : "No");
      
      if (!secret || !otpauth) {
        throw new Error("2FA anahtarı oluşturulamadı.");
      }

      setTwoFASecret(secret);
      setTwoFAQRCode(otpauth);
      setShow2FAModal(true);
      setTwoFAError('');
    } catch (error: any) {
      console.error("2FA Error:", error);
      addNotification("2FA sistemi şu anda kullanılamıyor: " + (error.message || "Bilinmeyen hata"), "error");
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!twoFAVerifyCode) {
      setTwoFAError('Lütfen doğrulama kodunu girin.');
      return;
    }

    const result = authenticator.verifySync({
      token: twoFAVerifyCode,
      secret: twoFASecret
    });
    if (result.valid) {
      const updatedProfile: UserProfile = { 
        ...profile!, 
        twoFAEnabled: true, 
        twoFASecret 
      };
      setProfile(updatedProfile);
      localStorage.setItem('deneyapai_profile', JSON.stringify(updatedProfile));
      
      if (firebaseUser && db) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile, { merge: true });
        } catch (e) {
          console.error("Error saving 2FA to Firebase:", e);
        }
      }
      
      setShow2FAModal(false);
      setTwoFAVerifyCode('');
      setTwoFASecret('');
      setTwoFAQRCode('');
      alert('2FA Başarıyla Aktif Edildi!');
    } else {
      setTwoFAError('Hatalı kod! Lütfen Authenticator uygulamanızdaki kodu kontrol edin.');
    }
  };

  const handle2FAVerify = () => {
    if (!profile?.twoFASecret) return;
    
    const result = authenticator.verifySync({
      token: twoFAVerifyCode,
      secret: profile.twoFASecret
    });
    if (result.valid) {
      setFirebaseUser(tempFirebaseUser);
      setShow2FAVerify(false);
      setTwoFAVerifyCode('');
      setTwoFAError('');
      addNotification("2FA Doğrulandı. Giriş başarılı!", "success");
      setIsLoggingIn(false);
    } else {
      setTwoFAError('Hatalı kod! Lütfen Authenticator uygulamanızdaki kodu kontrol edin.');
    }
  };

  const handleSendEmailCode = () => {
    addNotification("2FA kodu e-posta adresinize gönderildi (Simülasyon).", "info");
    // In a real app, you would call a backend API here
  };
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) e.preventDefault();
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  const [premiumStep, setPremiumStep] = useState<1 | 2>(1);
  const [licenseError, setLicenseError] = useState('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Sync current chat to Firestore
  useEffect(() => {
    if (firebaseUser && db && messages.length > 0) {
      const chatRef = doc(db, 'current_chat', firebaseUser.uid);
      setDoc(chatRef, { messages }, { merge: true })
        .catch(e => console.error("Error syncing current chat:", e));
    }
  }, [messages, firebaseUser]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // New Auth States
  const [authView, setAuthView] = useState<'onboarding' | 'email'>('onboarding');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const registerNameRef = useRef('');
  
  useEffect(() => {
    registerNameRef.current = registerName;
  }, [registerName]);

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [tempFirebaseUser, setTempFirebaseUser] = useState<FirebaseUser | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isLoggingInRef = useRef(false);
  
  const setLoggingIn = (val: boolean) => {
    setIsLoggingIn(val);
    isLoggingInRef.current = val;
  };

  // Check for Firebase Config Errors on mount
  useEffect(() => {
    if (firebaseConfigError) {
      setAuthError(firebaseConfigError);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed:", user ? "User logged in" : "No user");
      
      try {
        if (user) {
          try {
            // Force token refresh to check if user is disabled in Auth
            await user.getIdToken(true);
          } catch (e: any) {
            if (e.code === 'auth/user-disabled' || (e.message && e.message.includes('user-disabled'))) {
              console.error("User is disabled in Firebase Auth");
              setIsBanned(true);
              setIsAuthLoading(false);
              return;
            }
          }

          // Fetch profile, history and current chat from Firestore in parallel
          let fetchedProfile: UserProfile | null = null;
          let fetchedHistory: HistoryItem[] = [];
          let fetchedMessages: Message[] = [];
          
          if (db) {
            try {
              const [userDoc, historyDoc, chatDoc] = await Promise.all([
                getDoc(doc(db, 'users', user.uid)),
                getDoc(doc(db, 'history', user.uid)),
                getDoc(doc(db, 'current_chat', user.uid))
              ]);

              if (userDoc.exists()) {
                fetchedProfile = userDoc.data() as UserProfile;
              }
              
              if (historyDoc.exists()) {
                fetchedHistory = (historyDoc.data() as { items: HistoryItem[] }).items || [];
              }

              if (chatDoc.exists()) {
                fetchedMessages = (chatDoc.data() as { messages: Message[] }).messages || [];
              }
            } catch (e) {
              console.error("Error fetching data from Firestore:", e);
            }
          }

          // Check if user is banned
          if (fetchedProfile?.isBanned) {
            setFirebaseUser(user);
            setIsBanned(true);
            setProfile(fetchedProfile);
            setIsAuthLoading(false);
            return;
          }

          // If 2FA is enabled, we need to verify before setting firebaseUser
          if (fetchedProfile?.twoFAEnabled) {
            setTempFirebaseUser(user);
            setProfile(fetchedProfile);
            setHistory(fetchedHistory);
            if (fetchedMessages.length > 0) {
              setMessages(fetchedMessages);
            }
            setShow2FAVerify(true);
            setIsAuthLoading(false);
            if (isLoggingIn) {
              addNotification("Kimlik doğrulandı. Lütfen 2FA kodunuzu girin.", "info");
            }
            return;
          }

          setFirebaseUser(user);
          setHistory(fetchedHistory);
          if (fetchedMessages.length > 0) {
            setMessages(fetchedMessages);
          }
          setShowOnboarding(false);
          setIsAuthLoading(false);
          
          const deviceInfo = await getDeviceInfo();
          const currentSessionId = Math.random().toString(36).substring(7);

          setProfile(prev => {
            const profileToUse = fetchedProfile || prev;
            let finalProfile: UserProfile;
            if (!profileToUse) {
              finalProfile = {
                name: registerNameRef.current || user.displayName || 'Gezgin',
                level: 'Başlangıç',
                totalQuestions: 0,
                subscriptionTier: 'FREE',
                isPremium: false,
                deviceId: Math.random().toString(36).substring(7),
                lastLogin: Date.now(),
                securityVerified: true,
                email: user.email || undefined,
                stats: { projectsGenerated: 0, bugsFixed: 0, codeOptimized: 0 },
                achievements: [],
                sessions: [{
                  id: currentSessionId,
                  ...deviceInfo,
                  lastActive: Date.now(),
                  isCurrent: true
                }]
              };
            } else {
              // Update existing profile with email if missing
              finalProfile = { ...profileToUse };
              if (!finalProfile.email && user.email) {
                finalProfile.email = user.email;
              }
              
              // Check for new login (different device or long time)
              const isNewDevice = !finalProfile.sessions?.some(s => s.ip === deviceInfo.ip && s.deviceName === deviceInfo.deviceName);
              if (isNewDevice && finalProfile.sessions && finalProfile.sessions.length > 0) {
                finalProfile.newLoginDetected = true;
                setLastSession(finalProfile.sessions[finalProfile.sessions.length - 1]);
              }

              finalProfile.lastLogin = Date.now();
              
              // Update sessions
              const otherSessions = (finalProfile.sessions || [])
                .filter(s => s.id !== currentSessionId)
                .map(s => ({ ...s, isCurrent: false }));
              
              finalProfile.sessions = [
                {
                  id: currentSessionId,
                  ...deviceInfo,
                  lastActive: Date.now(),
                  isCurrent: true
                },
                ...otherSessions.slice(0, 4) // Keep last 5 sessions
              ];
            }
            
            localStorage.setItem('deneyapai_profile', JSON.stringify(finalProfile));
            
            // Show welcome notification if logging in
            if (isLoggingInRef.current) {
              addNotification(`Hoş geldiniz, ${finalProfile.name}! ✨`, "success");
              setLoggingIn(false);
            }

            // Show new login popup if detected
            if (finalProfile.newLoginDetected) {
              setShowNewLoginPopup(true);
            }
            
            // Sync to Firestore if it's a new profile or updated
            if (db) {
              setDoc(doc(db, 'users', user.uid), finalProfile, { merge: true })
                .catch(e => console.error("Error syncing profile to Firestore:", e));
            }
            
            return finalProfile;
          });
        } else {
          setFirebaseUser(null);
          setTempFirebaseUser(null);
          setShow2FAVerify(false);
          setIsBanned(false);
          
          // If no user and no local profile, show onboarding
          const storedProfile = localStorage.getItem('deneyapai_profile');
          if (!storedProfile) {
            setShowOnboarding(true);
          }
          setIsAuthLoading(false);
        }
      } catch (error) {
        console.error("Error in auth state listener:", error);
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setAuthError('');
    setIsLoading(true);
    setLoggingIn(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        addNotification("Hesap başarıyla oluşturuldu! Hoş geldin. 🚀", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/user-disabled') {
        setIsBanned(true);
        setIsLoading(false);
        return;
      }
      let msg = error.message || "Giriş işlemi başarısız oldu.";
      if (error.code === 'auth/network-request-failed') {
        msg = "Ağ hatası: Firebase sunucularına bağlanılamadı. Lütfen internet bağlantınızı kontrol edin. Eğer bağlantınızda sorun yoksa, Firebase API anahtarınızın (API Key) veya Auth Domain ayarınızın doğru olduğundan emin olun.";
      }
      setAuthError(msg);
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

  const handleGoogleSignIn = async () => {
    console.log("Starting Google Sign-In...");
    if (!isFirebaseConfigured || !auth) {
      console.error("Firebase not configured or auth not initialized");
      addNotification("Google ile giriş şu anda devre dışı. Lütfen yönetici ile iletişime geçin.", "error");
      return;
    }

    // Check for common configuration error
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    if (authDomain && (authDomain.includes("run.app") || authDomain.includes("vercel.app"))) {
      const errorMsg = "HATA: VITE_FIREBASE_AUTH_DOMAIN yanlış yapılandırılmış. \n\nBu değer 'project-id.firebaseapp.com' şeklinde olmalıdır, uygulamanın kendi URL'si değil. Lütfen .env dosyanızı güncelleyin.";
      setAuthError(errorMsg);
      addNotification(errorMsg, "error");
      return;
    }
    try {
      setIsLoading(true);
      setLoggingIn(true);
      setAuthError("");
      
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Calling signInWithPopup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In Success:", result.user.email);
      
      // Proactively hide onboarding if successful
      if (result.user) {
        setShowOnboarding(false);
        setIsAuthLoading(false);
      }
    } catch (error: any) {
      console.error("Google Sign-In Error Details:", error);
      if (error.code === 'auth/user-disabled') {
        setIsBanned(true);
        setIsLoading(false);
        return;
      }
      let msg = "Giriş yapılırken bir hata oluştu.";
      
      if (error.code === 'auth/popup-blocked') {
        msg = "Tarayıcınız giriş penceresini engelledi. Lütfen adres çubuğundaki engelleyiciyi kaldırın ve tekrar deneyin.";
      } else if (error.code === 'auth/unauthorized-domain') {
        msg = "Bu alan adı (domain) Firebase Console'da 'Yetkilendirilmiş Alan Adları' listesine eklenmemiş. Lütfen Firebase ayarlarınızı kontrol edin.";
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = "Google ile Giriş yöntemi Firebase Console'da etkinleştirilmemiş.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        msg = "Giriş penceresi kapatıldı. Lütfen işlemi tamamlayın.";
      } else if (error.code === 'auth/network-request-failed') {
        msg = "Ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin. \n\nNot: Eğer VPN kullanıyorsanız kapatmayı deneyin. Ayrıca Firebase Console'da API anahtarınızın ve Yetkilendirilmiş Alan Adları (Authorized Domains) ayarlarınızın doğru olduğundan emin olun.";
      } else {
        msg += `\n\nHata: ${error.message || error.code || 'Bilinmiyor'}`;
      }
      setAuthError(msg);
      addNotification(msg, "error");
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
      localStorage.removeItem('deneyapai_profile');
      localStorage.removeItem('deneyapai_history');
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
    return 10;
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
    const storedUsage = localStorage.getItem('deneyapai_usage');
    if (storedUsage) {
      const { date, count } = JSON.parse(storedUsage);
      if (date === today) {
        setUsageCount(count);
      } else {
        localStorage.setItem('deneyapai_usage', JSON.stringify({ date: today, count: 0 }));
        setUsageCount(0);
      }
    } else {
      localStorage.setItem('deneyapai_usage', JSON.stringify({ date: today, count: 0 }));
    }

    // Profile
    const storedProfile = localStorage.getItem('deneyapai_profile');
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
      localStorage.setItem('deneyapai_profile', JSON.stringify(updatedProfile));
      
      if (!updatedProfile.kvkkAccepted) {
        setShowKvkkModal(true);
      }
    } else {
      setShowOnboarding(true);
    }

    // History
    const storedHistory = localStorage.getItem('deneyapai_history');
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
    localStorage.setItem('deneyapai_profile', JSON.stringify(newProfile));
    
    if (firebaseUser && db) {
      setDoc(doc(db, 'users', firebaseUser.uid), newProfile, { merge: true })
        .catch(e => console.error("Error syncing profile to Firestore:", e));
    }
    
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
      localStorage.setItem('deneyapai_profile', JSON.stringify(newProfile));
      
      if (firebaseUser && db) {
        setDoc(doc(db, 'users', firebaseUser.uid), newProfile, { merge: true })
          .catch(e => console.error("Error syncing subscription to Firestore:", e));
      }
      
      setShowPremiumModal(false);
      setLicenseInput('');
      setLicenseError('');
      addNotification(`Tebrikler! ${newTier} üyeliğin aktif edildi. Keyifli kullanımlar! 🚀`, 'success');
    } else {
      setLicenseError('Geçersiz lisans kodu. Lütfen kontrol et.');
    }
  };

  const handleRequestLicense = () => {
    const subject = encodeURIComponent('DeneyapAI Lisans Talebi');
    const body = encodeURIComponent(`Merhaba DeneyapAI Ekibi,\n\nDeneyapAI Premium için lisans kodu almak istiyorum. Ödeme ve IBAN bilgileri için geri dönüşünü bekliyorum.\n\nAdım: ${profile?.name}\nSeviyem: ${profile?.level}`);
    window.location.href = `mailto:imranyesildag123@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleAcceptKvkk = () => {
    if (profile) {
      const updatedProfile = { ...profile, kvkkAccepted: true };
      setProfile(updatedProfile);
      localStorage.setItem('deneyapai_profile', JSON.stringify(updatedProfile));
      setShowKvkkModal(false);
      addNotification('KVKK Aydınlatma Metni kabul edildi.', 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || !profile) return;

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
      content: input || (selectedImage ? "Bir resim yükledi." : ""),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    setCooldown(COOLDOWN_TIME);

    // Add status message
    const statusMessage: Message = {
      role: 'assistant',
      content: mode === 'IMAGE_GEN' ? 'Resim oluşturuluyor...' : 'Mesajınız Analiz Ediliyor...',
      timestamp: Date.now(),
      isTyping: true,
    };
    setMessages(prev => [...prev, statusMessage]);

    // Update usage count
    const today = new Date().toISOString().split('T')[0];
    const newUsageCount = usageCount + 1;
    setUsageCount(newUsageCount);
    localStorage.setItem('deneyapai_usage', JSON.stringify({ date: today, count: newUsageCount }));

    // Image generation limit check
    if (mode === 'IMAGE_GEN') {
      const tier = profile.subscriptionTier || 'FREE';
      const count = (profile.stats as any)?.imagesGenerated || 0;
      let limit = 2;
      if (tier === 'BASIC') limit = 25;
      if (tier === 'PRO') limit = Infinity;
      
      if (count >= limit) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: `Görsel oluşturma limitine ulaştın! 🎨 ${tier === 'FREE' ? 'Ücretsiz planda 2, Basic planda 25 görsel oluşturabilirsin.' : 'Basic planda 25 görsel oluşturabilirsin.'} Sınırsız görsel ve daha fazlası için Pro'ya geçebilirsin.`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }
    }

    // Update profile stats
    const updatedStats = {
      projectsGenerated: (profile.stats?.projectsGenerated || 0) + (mode === 'PROJECT_GEN' ? 1 : 0),
      bugsFixed: (profile.stats?.bugsFixed || 0) + (mode === 'DEBUGGER' ? 1 : 0),
      codeOptimized: (profile.stats?.codeOptimized || 0) + (mode === 'AI_OPTIMIZER' ? 1 : 0),
      imagesGenerated: ((profile.stats as any)?.imagesGenerated || 0) + (mode === 'IMAGE_GEN' ? 1 : 0),
      challengesCompleted: ((profile.stats as any)?.challengesCompleted || 0) + (mode === 'DAILY_CHALLENGE' ? 1 : 0),
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
    if (updatedStats.challengesCompleted === 1 && !newAchievements.includes('Görev Başladı')) {
      newAchievements.push('Görev Başladı');
    }

    const newProfile: UserProfile = { 
      ...profile, 
      totalQuestions: profile.totalQuestions + 1,
      stats: updatedStats,
      achievements: newAchievements
    };
    setProfile(newProfile);
    localStorage.setItem('deneyapai_profile', JSON.stringify(newProfile));
    
    if (firebaseUser && db) {
      setDoc(doc(db, 'users', firebaseUser.uid), newProfile, { merge: true })
        .catch(e => console.error("Error syncing profile to Firestore:", e));
    }

    try {
      const responseText = await generateResponse(currentInput, mode, profile, currentImage || undefined);
      
      if (mode === 'IMAGE_GEN') {
        setGeneratedImages(prev => [{ url: responseText, prompt: currentInput, timestamp: Date.now() }, ...prev]);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        isTyping: mode !== 'IMAGE_GEN', // Only type out text responses
      };
      
      // Replace the status message with the actual response
      setMessages(prev => [...prev.slice(0, -1), assistantMessage]);

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
      localStorage.setItem('deneyapai_history', JSON.stringify(updatedHistory));
      
      if (firebaseUser && db) {
        setDoc(doc(db, 'history', firebaseUser.uid), { items: updatedHistory })
          .catch(e => console.error("Error syncing history to Firestore:", e));
      }

    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Bir hata oluştu. Lütfen internet bağlantını kontrol et ve tekrar dene.';
      
      if (error.message === "API_KEY_MISSING") {
        errorMessage = 'Gemini API anahtarı bulunamadı. Lütfen Vercel panelinden GEMINI_API_KEY ortam değişkenini ayarladığınızdan emin olun.';
      } else if (error.message?.includes('API key not valid')) {
        errorMessage = 'Geçersiz API anahtarı. Lütfen API anahtarınızı kontrol edin.';
      } else if (error.status === 429 || error.message?.includes('429')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin (Kota dolmuş olabilir).';
      } else if (error.message?.includes('safety')) {
        errorMessage = 'Üzgünüm, bu içerik güvenlik filtrelerine takıldı. Lütfen farklı bir şekilde sormayı deneyin.';
      } else if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        errorMessage = 'İnternet bağlantısı sorunu oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
      }

      setMessages(prev => [...prev.slice(0, -1), {
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!profile) return;
    setIsLoading(true);
    setQuizQuestions([]);
    setCurrentQuizIdx(0);
    setQuizScore(0);
    setShowQuizResult(false);
    setMode('QUIZ');
    setActiveTab('chat');

    try {
      const questions = await generateQuiz(profile);
      if (questions && questions.length > 0) {
        setQuizQuestions(questions);
      } else {
        throw new Error("No questions generated");
      }
    } catch (error) {
      console.error("Quiz Error:", error);
      addNotification("Quiz yüklenirken bir hata oluştu.", "error");
      // Fallback questions
      setQuizQuestions([
        { question: "Arduino Uno'nun kalbi olan mikrodenetleyici hangisidir?", options: ["ATmega328P", "ESP32", "STM32", "PIC16F877A"], correctIdx: 0 },
        { question: "Python'da liste sonuna eleman eklemek için hangi metod kullanılır?", options: ["add()", "push()", "append()", "insert()"], correctIdx: 2 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizAnswer = (selectedIdx: number) => {
    const currentQuestion = quizQuestions[currentQuizIdx];
    const isCorrect = selectedIdx === currentQuestion.correctIdx;
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      addNotification("Doğru cevap! 🎉", "success");
    } else {
      addNotification(`Yanlış cevap. Doğru: ${currentQuestion.options[currentQuestion.correctIdx]}`, "error");
    }

    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
    } else {
      setShowQuizResult(true);
      // Update profile stats
      if (profile) {
        const finalScore = isCorrect ? quizScore + 1 : quizScore;
        const updatedProfile: UserProfile = {
          ...profile,
          stats: {
            ...profile.stats!,
            quizScore: (profile.stats?.quizScore || 0) + finalScore,
            quizCount: (profile.stats?.quizCount || 0) + 1
          }
        };
        setProfile(updatedProfile);
        localStorage.setItem('deneyapai_profile', JSON.stringify(updatedProfile));
        
        if (firebaseUser && db) {
          setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile, { merge: true })
            .catch(e => console.error("Error syncing quiz score to Firestore:", e));
        }
      }
    }
  };

  const isUserPro = (p: UserProfile | null) => {
    if (!p) return false;
    return p.subscriptionTier === 'PRO' || p.role === 'INSTRUCTOR' || p.role === 'REPRESENTATIVE';
  };

  useEffect(() => {
    if (db) {
      const fetchShowcase = async () => {
        try {
          const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
          const q = query(collection(db, 'showcase'), orderBy('likes', 'desc'), limit(50));
          const querySnapshot = await getDocs(q);
          const projects: any[] = [];
          querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
          });
          setShowcaseProjects(projects);
        } catch (e) {
          console.error("Error fetching showcase:", e);
        }
      };
      fetchShowcase();
    }
  }, [db]);

  const handleLikeProject = async (id: string) => {
    if (!db) return;
    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'showcase', id), {
        likes: increment(1)
      });
      setShowcaseProjects(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
      if (selectedProject?.id === id) {
        setSelectedProject({ ...selectedProject, likes: selectedProject.likes + 1 });
      }
      addNotification("Proje beğenildi! ❤️", "success");
    } catch (e) {
      console.error("Error liking project:", e);
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    if (PREMIUM_MODES.includes(newMode) && !isUserPro(profile)) {
      setMode('SUBSCRIPTION');
      setActiveTab('modes');
      setShowMobileMenu(false);
      addNotification("Bu özellik için Pro üyelik gereklidir.", "info");
      return;
    }
    
    if (newMode === 'QUIZ') {
      handleStartQuiz();
      return;
    }
    
    setMode(newMode);
    if (['SUBSCRIPTION', 'FAQ', 'TERMS', 'PRIVACY'].includes(newMode)) {
      setActiveTab('modes');
    } else {
      setActiveTab('chat');
    }
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
      addNotification('Tarayıcınız sesli girişi desteklemiyor.', 'error');
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
    { id: '5', text: 'Günün görevini ver', icon: Sparkles, mode: 'DAILY_CHALLENGE' },
  ];

  const badge = profile ? getBadge(profile.totalQuestions) : null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const renderTabContent = () => {
    if (activeTab === 'history') {
      return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 lg:pb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <HistoryIcon className="text-amber-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Geçmiş Kayıtlarım</h2>
                <p className="text-zinc-500 text-sm font-medium">Daha önce yaptığın tüm çalışmalar burada saklanır.</p>
              </div>
            </div>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Trash2 className="w-3 h-3" />
                Tümünü Temizle
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-32 glass-card rounded-[2.5rem] border-dashed border-white/5">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-display font-bold text-zinc-400 mb-2">Henüz Kayıt Yok</h3>
              <p className="text-zinc-600 text-sm max-w-xs mx-auto">Henüz bir kayıt bulunmuyor. İlk sorunu sorarak teknoloji yolculuğuna başlayabilirsin!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[2rem] p-8 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      item.mode === 'PROJECT_GEN' ? "bg-emerald-500/10 text-emerald-400" : 
                      item.mode === 'LIVE_VOICE' ? "bg-red-500/10 text-red-400" :
                      "bg-blue-500/10 text-blue-400"
                    )}>
                      {item.mode === 'PROJECT_GEN' ? <Lightbulb className="w-6 h-6" /> : 
                       item.mode === 'LIVE_VOICE' ? <Radio className="w-6 h-6" /> :
                       <Bug className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-lg font-display font-bold text-white line-clamp-1">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{new Date(item.timestamp).toLocaleString('tr-TR')}</div>
                    </div>
                  </div>

                  <div className="markdown-body text-sm line-clamp-4 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    <Markdown>{item.content}</Markdown>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                      Mod: {item.mode}
                    </span>
                    <button 
                      onClick={() => {
                        setMode(item.mode as AppMode);
                        setActiveTab('chat');
                        setMessages([{ role: 'user', content: item.title, timestamp: Date.now() }, { role: 'assistant', content: item.content, timestamp: Date.now() }]);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Tekrar Görüntüle →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12 pb-24 lg:pb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <User className="text-emerald-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Kullanıcı Paneli</h2>
              <p className="text-zinc-500 text-sm font-medium">Teknoloji yolculuğundaki ilerlemeni takip et.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              {profile?.subscriptionTier !== 'PRO' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-[2.5rem] p-8 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/30 relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-500 text-black rounded-xl flex items-center justify-center shadow-lg">
                        <Zap className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-display font-bold text-white">Pro'ya Yükselt</h4>
                    </div>
                    <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                      Sınırsız mesaj, AI görsel üretimi ve uzman mentorluk için hemen Pro'ya geç!
                    </p>
                    <button 
                      onClick={() => handleModeChange('SUBSCRIPTION')}
                      className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-xl"
                    >
                      Planları Görüntüle
                    </button>
                  </div>
                </motion.div>
              )}
              <div className="glass-card rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                  <button 
                    onClick={() => {
                      if (profile) {
                        setEditName(profile.name);
                        setEditCity(profile.city || '');
                        setEditInstitution(profile.institution || '');
                        setEditLevel(profile.level);
                        setShowEditProfileModal(true);
                      }
                    }}
                    className="p-2 text-zinc-600 hover:text-emerald-400 transition-colors"
                    title="Profili Düzenle"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="w-28 h-28 bg-zinc-900 border-4 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-2xl relative">
                  <User className="w-14 h-14" />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-2 rounded-full shadow-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-display font-bold text-white mb-1">{profile?.name}</h3>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4">{profile?.email}</p>
                
                <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", badge?.color)}>
                  {badge?.name}
                </div>

                <div className="mt-8 w-full space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <span>Seviye İlerlemesi</span>
                    <span className="text-emerald-400">{profile?.level}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(profile?.totalQuestions || 0) % 10 * 10}%` }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Lisans Aktivasyonu</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Mevcut Rol</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">
                          {profile?.role === 'INSTRUCTOR' ? 'Eğitmen' : profile?.role === 'REPRESENTATIVE' ? 'İl Temsilcisi' : 'Öğrenci'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {profile?.role !== 'INSTRUCTOR' && profile?.role !== 'REPRESENTATIVE' ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={licenseInput}
                          onChange={(e) => setLicenseInput(e.target.value)}
                          placeholder="Lisans Kodunu Girin"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all uppercase"
                        />
                      </div>
                      <button 
                        onClick={handleActivateLicense}
                        className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
                      >
                        Lisansı Aktifleştir
                      </button>
                      <button 
                        onClick={() => setShowInstructorModal(true)}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Eğitmenim
                      </button>
                      <p className="text-[9px] text-zinc-500 text-center italic">
                        Eğitmen veya İl Temsilcisiyseniz lisans kodu için Kamuran Yeşildağ ile iletişime geçin.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-[10px] text-emerald-400 font-bold text-center">
                        Lisansınız aktif! Tüm Pro özelliklere erişiminiz var.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Destek & Geri Bildirim</h4>
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
                  >
                    <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    Geri Bildirim Gönder
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                    Uygulamayı geliştirmemize yardımcı olun. Görüşleriniz bizim için çok değerli!
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Hesap Güvenliği</h4>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">2FA Koruması</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">
                          {profile?.twoFAEnabled ? 'Aktif' : 'Devre Dışı'}
                        </div>
                      </div>
                    </div>
                    {!profile?.twoFAEnabled && (
                      <button 
                        onClick={handleEnable2FA}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Aktif Et
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowPasswordChangeModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">Şifre Değiştir</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">Güvenliğinizi Güncelleyin</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </button>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4 text-zinc-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Son Oturumlar</span>
                  </div>
                  
                  <div className="space-y-3">
                    {profile?.sessions?.map((session, idx) => (
                      <div key={session.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                        {session.isCurrent && (
                          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Aktif</div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {session.deviceName.includes('PC') || session.deviceName.includes('Mac') ? (
                              <Monitor className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <Smartphone className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{session.deviceName}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3 h-3 text-zinc-600" />
                              <span className="text-[10px] text-zinc-500 truncate">{session.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Globe className="w-3 h-3 text-zinc-600" />
                              <span className="text-[10px] text-zinc-600 font-mono">{session.ip}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!profile?.sessions || profile.sessions.length === 0) && (
                      <div className="text-center py-4 text-zinc-600 text-[10px] font-medium italic">Oturum bilgisi bulunamadı.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-white mb-1">{profile?.totalQuestions}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Toplam Soru</div>
                  </div>
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-white mb-1">{profile?.stats?.quizScore || 0}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Quiz Puanı ({profile?.stats?.quizCount || 0} Quiz)</div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[2.5rem] p-8 md:p-12 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-bold">İlerleme Analizi</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aktivite</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Pzt', value: 4 },
                        { name: 'Sal', value: 7 },
                        { name: 'Çar', value: 5 },
                        { name: 'Per', value: 9 },
                        { name: 'Cum', value: 12 },
                        { name: 'Cmt', value: 8 },
                        { name: 'Paz', value: 15 },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          border: '1px solid #ffffff10',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-white mb-1">{profile?.stats?.imagesGenerated || 0}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Görsel</div>
                  </div>
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Bug className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-white mb-1">{profile?.stats?.bugsFixed || 0}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Hata</div>
                  </div>
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Github className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-display font-bold text-white mb-1">{profile?.stats?.projectsShared || 0}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Vitrinde</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'modes') {
      if (mode === 'SUBSCRIPTION') {
        return (
          <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12 pb-24 lg:pb-8">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest"
              >
                <Zap className="w-3 h-3" />
                Premium Deneyim
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-display font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Üyelik Planları</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">Sana en uygun planı seç, teknolojide öne geç! Tüm ödemeler Shopier güvencesiyle yapılır ve lisans kodunuz anında e-postanıza iletilir.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col relative overflow-hidden group">
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">Ücretsiz</h3>
                  <div className="text-3xl font-bold text-white mb-1">0 TL</div>
                  <p className="text-zinc-500 text-xs">Temel kullanım için ideal.</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    { text: 'Günlük 5 Mesaj', active: true },
                    { text: 'Proje Üretici', active: true },
                    { text: 'Kod Hata Ayıklama', active: true },
                    { text: 'AI Görsel Üretici (2 Adet)', active: true },
                    { text: 'AI Optimizasyon', active: false },
                    { text: 'Canlı Sesli Sohbet', active: false },
                  ].map((item, i) => (
                    <li key={i} className={cn("flex items-center gap-3 text-sm", item.active ? "text-zinc-300" : "text-zinc-600")}>
                      {item.active ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4" />}
                      {item.text}
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-500 font-bold text-sm cursor-not-allowed">
                  Şu Anki Planın
                </button>
              </div>

              <div className="glass p-8 rounded-[2.5rem] border border-blue-500/20 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest">Popüler</div>
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2 text-blue-400">Basit</h3>
                  <div className="text-3xl font-bold text-white mb-1">54,99 TL</div>
                  <p className="text-zinc-500 text-xs">Daha fazla soru sormak isteyenler için.</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    { text: 'Günlük 90 Mesaj', active: true },
                    { text: 'Tüm Temel Modlar', active: true },
                    { text: 'AI Görsel Üretici (20 Adet)', active: true },
                    { text: 'Reklamsız Deneyim', active: true },
                    { text: 'AI Optimizasyon', active: false },
                    { text: 'Canlı Sesli Sohbet', active: false },
                  ].map((item, i) => (
                    <li key={i} className={cn("flex items-center gap-3 text-sm", item.active ? "text-zinc-300" : "text-zinc-600")}>
                      {item.active ? <Check className="w-4 h-4 text-blue-500" /> : <X className="w-4 h-4" />}
                      {item.text}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => window.open('https://www.shopier.com/bitlisstudyo/44761101', '_blank')}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                >
                  Hemen Satın Al
                </button>
              </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-8 rounded-[2.5rem] border border-amber-500/30 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest">En Güçlü</div>
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-2 text-amber-400">Pro</h3>
                    <div className="text-3xl font-bold text-white mb-1">169,99 TL</div>
                    <p className="text-zinc-500 text-xs text-amber-500/60">Sınırları zorlayan teknoloji fatihleri için.</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      { text: 'Sınırsız Mesaj', active: true },
                      { text: 'Sınırsız AI Görsel Üretici', active: true },
                      { text: 'Gelişmiş AI Modelleri (3.1 Pro)', active: true },
                      { text: 'TEKNOFEST Rapor Asistanı', active: true },
                      { text: 'Devre Şeması & Kod Dönüştürücü', active: true },
                      { text: 'Canlı Sesli Sohbet & Mentorluk', active: true },
                    ].map((item, i) => (
                      <li key={i} className={cn("flex items-center gap-3 text-sm", item.active ? "text-zinc-300" : "text-zinc-600")}>
                        {item.active ? <Check className="w-4 h-4 text-amber-500" /> : <X className="w-4 h-4" />}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => window.open('https://www.shopier.com/bitlisstudyo/44761166', '_blank')}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20 mb-6"
                  >
                    Pro'ya Geç
                  </button>
                  
                  <div className="p-4 bg-black/40 rounded-2xl border border-amber-500/20">
                    <p className="text-[10px] text-amber-500/80 leading-relaxed italic mb-2">
                      "Değerli Deneyap Atölyeleri Hocalarım Ve İl Temsilcileri Hocalarım Sizlerin Erişimi İçin Pro Sürüm sizlere Her Zaman açık Başım Gözüm Üstüne Hoşgeldiniz:) Lisans kodu almak için lütfen benimle iletişime geçin."
                    </p>
                    <p className="text-[9px] text-zinc-500 font-bold text-right">
                      — Kamuran Yeşildağ<br/>DeneyapAI Kurucusu
                    </p>
                  </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Lisans Aktivasyonu</h3>
                <p className="text-zinc-500 text-sm">Satın aldığın lisans kodunu aşağıya girerek üyeliğini anında başlatabilirsin.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="TNP-XXXX-XXXX"
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all uppercase font-mono"
                />
                <button 
                  onClick={handleLicenseActivation}
                  className="bg-white text-black font-bold px-8 py-4 rounded-2xl hover:bg-zinc-200 transition-all"
                >
                  Aktif Et
                </button>
              </div>
              {licenseError && <p className="text-red-400 text-xs text-center font-bold">{licenseError}</p>}
            </div>
          </div>
        );
      }
      if (mode === 'FAQ') {
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-24 lg:pb-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => handleModeChange('PROJECT_GEN')} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-display font-bold">Sıkça Sorulan Sorular</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "DeneyapAI nedir?", a: "DeneyapAI, Bitlis Deneyap Atölyeleri öğrencileri ve teknoloji meraklıları için geliştirilmiş bir yapay zeka mentordur." },
                { q: "Uygulama ücretli mi?", a: "Temel özellikler ücretsizdir, ancak günlük limitler bulunmaktadır." },
                { q: "Lisans kodumu nasıl alırım?", a: "Shopier mağazamızdan satın alabilirsiniz." }
              ].map((item, i) => (
                <div key={i} className="glass p-6 rounded-3xl border border-white/5 space-y-3">
                  <h4 className="text-lg font-bold text-white flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                    {item.q}
                  </h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
      if (mode === 'PRIVACY') {
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-24 lg:pb-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => handleModeChange('PROJECT_GEN')} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-display font-bold">Gizlilik Politikası</h2>
            </div>
            <div className="prose prose-invert max-w-none text-zinc-400 space-y-8">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">1. Veri Toplama ve Kullanım</h3>
                <p>DeneyapAI, kullanıcı deneyimini iyileştirmek ve kişiselleştirilmiş mentorluk sunmak amacıyla kullanıcı adı, eğitim seviyesi, proje istatistikleri ve cihaz bilgilerini toplar. Bu veriler, Firebase altyapısı üzerinde yüksek güvenlik standartlarıyla saklanır.</p>
              </section>

              <section className="space-y-4 bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl">
                <h3 className="text-xl font-bold text-emerald-400">2. Eğitmen ve İl Temsilcisi Güvenliği</h3>
                <p>DeneyapAI, Deneyap Atölyeleri'nde görev yapan <strong>Eğitmenlerin</strong> ve <strong>İl Temsilcilerinin</strong> kişisel güvenliğini ve gizliliğini en üst düzeyde tutar. Bu kapsamda:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Eğitmenlerin ve İl Temsilcilerinin kişisel iletişim bilgileri (telefon, e-posta, sosyal medya) uygulama üzerinden asla paylaşılmaz.</li>
                  <li>Kullanıcılar, yapay zeka ile etkileşimleri sırasında bu yetkililerin özel hayatına dair bilgi talep edemez veya paylaşamaz.</li>
                  <li>Yetkililerin güvenliğini tehlikeye atacak her türlü veri sızıntısı girişimi yasal işlem sebebidir.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">3. Veri Paylaşımı</h3>
                <p>Kullanıcı verileri hiçbir koşulda üçüncü şahıslara satılmaz veya ticari amaçla paylaşılmaz. Veriler sadece uygulamanın temel fonksiyonlarını yerine getirmek için kullanılır.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">4. Kullanıcı Hakları</h3>
                <p>Kullanıcılar, diledikleri zaman hesaplarını silme ve verilerinin temizlenmesini talep etme hakkına sahiptir. KVKK kapsamında tüm haklarınız DeneyapAI güvencesi altındadır.</p>
              </section>
            </div>
          </div>
        );
      }
      if (mode === 'TERMS') {
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-24 lg:pb-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => handleModeChange('PROJECT_GEN')} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-display font-bold">Hizmet Şartları</h2>
            </div>
            <div className="prose prose-invert max-w-none text-zinc-400 space-y-8">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">1. Kullanım Amacı</h3>
                <p>DeneyapAI, Deneyap Teknoloji Atölyeleri müfredatına destek olmak ve öğrencilerin teknik gelişimine katkı sağlamak amacıyla tasarlanmıştır. Uygulamanın bu amaç dışında kullanımı yasaktır.</p>
              </section>

              <section className="space-y-4 bg-red-500/5 border border-red-500/10 p-6 rounded-3xl">
                <h3 className="text-xl font-bold text-red-400">2. Etik Kurallar ve Güvenlik</h3>
                <p>Uygulama içerisinde aşağıdaki davranışlar kesinlikle yasaktır ve hesabın anında kapatılmasına yol açar:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Eğitmenlere ve İl Temsilcilerine</strong> yönelik her türlü hakaret, siber zorbalık veya asılsız ithamda bulunmak.</li>
                  <li>Atölye hiyerarşisini bozacak veya yetkililerin itibarını zedeleyecek içerikler üretmek.</li>
                  <li>Diğer kullanıcıların veya yetkililerin hesaplarına yetkisiz erişim denemeleri.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">3. Sorumluluk Reddi</h3>
                <p>DeneyapAI tarafından üretilen içerikler yapay zeka tabanlıdır. Teknik projelerde son karar ve güvenlik onayı her zaman ilgili <strong>Deneyap Eğitmeni</strong> tarafından verilmelidir. Uygulama kaynaklı teknik hatalardan DeneyapAI sorumlu tutulamaz.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white">4. Hesap İptali</h3>
                <p>DeneyapAI yönetimi, topluluk kurallarını veya yetkililerin güvenliğini ihlal eden kullanıcıların erişimini önceden haber vermeksizin kısıtlama hakkını saklı tutar.</p>
              </section>
            </div>
          </div>
        );
      }
    }

    if (activeTab === 'chat') {
      if (mode === 'LEADERBOARD') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64">
            <Leaderboard profile={profile} onUpgrade={() => handleModeChange('SUBSCRIPTION')} />
          </div>
        );
      }

      if (mode === 'QUIZ') {
        return (
          <div className="p-4 md:p-12 max-w-4xl mx-auto pb-64">
            <div className="text-center space-y-8">
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-4xl font-display font-bold">Bilgi Yarışması</h2>
              
              {showQuizResult ? (
                <div className="glass-card rounded-[2.5rem] p-12 space-y-8">
                  <div className="text-6xl font-display font-bold text-amber-500">{quizScore} / {quizQuestions.length}</div>
                  <h3 className="text-2xl font-bold">Harika İş Çıkardın!</h3>
                  <p className="text-zinc-400">Puanların profilinize eklendi. Liderlik tablosunda yükselmek için daha fazla quiz çöz!</p>
                  <button 
                    onClick={() => { setShowQuizResult(false); setMode('PROJECT_GEN'); }}
                    className="bg-white text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs"
                  >
                    Ana Sayfaya Dön
                  </button>
                </div>
              ) : quizQuestions.length > 0 ? (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12 space-y-8 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Soru {currentQuizIdx + 1} / {quizQuestions.length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Puan: {quizScore}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-tight">{quizQuestions[currentQuizIdx].question}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {quizQuestions[currentQuizIdx].options.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleQuizAnswer(i)}
                        className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 hover:border-amber-500/50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold group-hover:bg-amber-500 group-hover:text-black transition-colors">
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-zinc-300 group-hover:text-white font-medium">{opt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center gap-6">
                  <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
                  <p className="text-zinc-500 font-medium">Sorular hazırlanıyor...</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'SHOWCASE') {
        return (
          <div className="p-4 md:p-12 max-w-7xl mx-auto pb-64 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                  <Star className="w-3 h-3" />
                  Topluluk Vitrini
                </div>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">İlham Veren Projeler</h2>
                <p className="text-zinc-500 max-w-xl">Diğer teknoloji fatihlerinin neler inşa ettiğini gör ve kendi projeni paylaş.</p>
              </div>
              <button 
                onClick={() => setShowShowcaseModal(true)}
                className="bg-purple-500 hover:bg-purple-400 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 flex items-center gap-3"
              >
                <Share2 className="w-4 h-4" />
                Projemi Paylaş
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {showcaseProjects.map((project) => (
                <motion.div 
                  key={project.id}
                  whileHover={{ y: -10 }}
                  className="glass-card rounded-[2.5rem] overflow-hidden group border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                      {project.category}
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{project.title}</h3>
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold">{project.likes}</span>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">{project.description}</p>
                    <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {project.author[0]}
                      </div>
                      <span className="text-xs font-bold text-zinc-400">{project.author}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      }

      if (mode === 'IMAGE_GEN') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-display font-bold">AI Görsel Üretici</h2>
                <p className="text-zinc-500 text-sm">Hayalindeki teknolojik tasarımı gerçeğe dönüştür.</p>
              </div>
              <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                  Kalan Hak: {isUserPro(profile) ? 'Sınırsız' : profile?.subscriptionTier === 'BASIC' ? 25 - ((profile?.stats as any)?.imagesGenerated || 0) : 2 - ((profile?.stats as any)?.imagesGenerated || 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.length === 0 ? (
                <div className="col-span-full py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Henüz bir görsel üretmedin. Aşağıdaki kutuya hayalini yaz!</p>
                </div>
              ) : (
                generatedImages.map((img, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-[2rem] overflow-hidden group relative"
                  >
                    <img src={img.url} alt={img.prompt} className="w-full aspect-square object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                      <p className="text-white text-xs font-medium line-clamp-2 mb-4">{img.prompt}</p>
                      <a href={img.url} download={`deneyapai-${i}.png`} className="w-full py-2 bg-white text-black text-center rounded-xl text-[10px] font-black uppercase tracking-widest">İndir</a>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      }

      if (mode === 'DEBUGGER') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Bug className="text-blue-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Hata Ayıklayıcı</h2>
                <p className="text-zinc-500 text-sm">Kodundaki hataları bulalım ve birlikte düzeltelim.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Hatalı Kodun</h4>
                <div className="glass-card rounded-[2rem] p-6 min-h-[300px] bg-zinc-900/50 border-white/5">
                  <pre className="text-sm font-mono text-zinc-400 whitespace-pre-wrap">
                    {messages.filter(m => m.role === 'user').pop()?.content || "// Kodunu aşağıya yapıştır..."}
                  </pre>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-2">Çözüm ve Öneriler</h4>
                <div className="glass-card rounded-[2rem] p-6 min-h-[300px] border-emerald-500/20">
                  <div className="markdown-body text-sm">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || "Henüz bir analiz yapılmadı."}
                    </Markdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (mode === 'PROJECT_GEN') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Lightbulb className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Proje Üretici</h2>
                <p className="text-zinc-500 text-sm">Malzemelerini yaz, sana en uygun projeyi tasarlayalım.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <Sparkles className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Hangi malzemelerin var? Örn: "Arduino, LDR, Buzzer"</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'DAILY_CHALLENGE') {
        return (
          <div className="p-4 md:p-12 max-w-4xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-amber-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Günün Görevi</h2>
                <p className="text-zinc-500 text-sm">Her gün yeni bir meydan okuma, yeni bir başarı!</p>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="glass-card rounded-[2.5rem] p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-10 h-10 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-display font-bold">Bugünkü Görevini Almaya Hazır Mısın?</h3>
                  <p className="text-zinc-500">Aşağıdaki butona basarak veya "Günün görevini ver" yazarak başlayabilirsin.</p>
                  <button 
                    onClick={() => { setInput('Günün görevini ver'); handleSubmit({ preventDefault: () => {} } as any); }}
                    className="bg-amber-500 text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20"
                  >
                    Görevi Başlat
                  </button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[2.5rem] p-8 md:p-12 border-amber-500/20"
                >
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'TECH_NEWS') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <FileText className="text-blue-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Teknoloji Haberleri</h2>
                <p className="text-zinc-500 text-sm">Dünyadan ve Türkiye'den en güncel teknoloji özetleri.</p>
              </div>
            </div>

            <div className="space-y-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <Radio className="w-12 h-12 text-blue-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Gündemi yakalamak için "Son haberleri getir" yazabilirsin.</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'REPORT_GEN') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <FileText className="text-blue-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">TEKNOFEST Rapor Asistanı</h2>
                <p className="text-zinc-500 text-sm">Proje özetini profesyonel bir teknik rapora dönüştürelim.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <FileText className="w-12 h-12 text-blue-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Projenin amacını, yöntemini ve beklenen sonuçlarını yaz.</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'CIRCUIT_ASSISTANT') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Cpu className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Devre Şeması Çizici</h2>
                <p className="text-zinc-500 text-sm">Hangi bileşenleri kullanacaksın? Bağlantıları planlayalım.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <Cpu className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Örn: "Arduino Uno, LDR ve Buzzer bağlantısı nasıl yapılır?"</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'CODE_CONVERTER') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <Code2 className="text-purple-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Kod Dönüştürücü</h2>
                <p className="text-zinc-500 text-sm">Kodunu farklı dillere veya platformlara çevirelim.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <Code2 className="w-12 h-12 text-purple-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Dönüştürmek istediğin kodu ve hedef dili yaz.</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'AI_OPTIMIZER') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Zap className="text-amber-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">AI Kod Optimizasyonu</h2>
                <p className="text-zinc-500 text-sm">Kodunu daha hızlı ve temiz hale getirelim.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <Zap className="w-12 h-12 text-amber-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Optimize etmek istediğin kodu buraya yapıştır.</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'ROADMAP_GEN') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                <ChevronRight className="text-indigo-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Proje Yol Haritası</h2>
                <p className="text-zinc-500 text-sm">Projeni 4 haftalık bir başarı planına dönüştürelim.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <ChevronRight className="w-12 h-12 text-indigo-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Hangi projeyi planlamak istiyorsun? Örn: "Akıllı Ev Sistemi"</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'EXPERT_MENTOR') {
        return (
          <div className="p-4 md:p-12 max-w-6xl mx-auto pb-64 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="text-red-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold">Uzman Mentor</h2>
                <p className="text-zinc-500 text-sm">Yarışmalar ve teknik raporlar için profesyonel rehberlik.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {messages.filter(m => m.role === 'assistant').length === 0 ? (
                <div className="py-20 text-center glass-card rounded-[2.5rem] border-dashed border-white/5">
                  <ShieldCheck className="w-12 h-12 text-red-500/20 mx-auto mb-4" />
                  <p className="text-zinc-500 text-sm">Mentoruna sormak istediğin teknik veya stratejik soruyu yaz.</p>
                </div>
              ) : (
                <div className="glass-card rounded-[2.5rem] p-8 md:p-12">
                  <div className="markdown-body">
                    <Markdown>
                      {messages.filter(m => m.role === 'assistant').pop()?.content || ""}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (mode === 'LIVE_VOICE') {
        return (
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
        );
      }

      // Default Chat View
      return (
        <div className="p-4 md:p-12 max-w-6xl mx-auto space-y-12 pb-64">
          {messages.length === 1 ? (
            <div className="space-y-12">
              <div className="space-y-4 text-center md:text-left">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl md:text-6xl font-display font-bold text-white tracking-tight"
                >
                  Hoşgeldin, <span className="text-emerald-400">{profile?.name}</span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-zinc-500 text-base md:text-xl max-w-2xl"
                >
                  Teknoloji yolculuğunda bugün ne inşa etmek istersin? Senin için en gelişmiş araçları hazırladım.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleModeChange('PROJECT_GEN')}
                  className="md:col-span-2 bento-item group cursor-pointer border-emerald-500/20 bg-emerald-500/5"
                >
                  <div className="flex flex-col h-full justify-between gap-8">
                    <div className="w-14 h-14 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Lightbulb className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-2">Proje Üretici</h3>
                      <p className="text-zinc-400 text-sm">Elindeki malzemeleri söyle, sana en yaratıcı Deneyap projesini tasarlayayım.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleModeChange('IMAGE_GEN')}
                  className="bento-item group cursor-pointer border-purple-500/20 bg-purple-500/5"
                >
                  <div className="flex flex-col h-full justify-between gap-8">
                    <div className="w-14 h-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-2">Görsel Üretici</h3>
                      <p className="text-zinc-400 text-sm">Hayalindeki teknolojik tasarımı gerçeğe dönüştür.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleStartQuiz()}
                  className="bento-item group cursor-pointer border-amber-500/20 bg-amber-500/5"
                >
                  <div className="flex flex-col h-full justify-between gap-8">
                    <div className="w-14 h-14 bg-amber-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-2">Bilgi Quiz</h3>
                      <p className="text-zinc-400 text-sm">Bilgini test et, puanları topla ve liderliğe oyna.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleModeChange('DEBUGGER')}
                  className="md:col-span-2 bento-item group cursor-pointer border-blue-500/20 bg-blue-500/5"
                >
                  <div className="flex flex-col h-full justify-between gap-8">
                    <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Bug className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white mb-2">Kod Debugger</h3>
                      <p className="text-zinc-400 text-sm">Hatalı kodlarını yapıştır, saniyeler içinde çözümünü bulalım.</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {showDailyTip && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[2rem] p-8 relative overflow-hidden group border-emerald-500/20"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button 
                      onClick={() => setShowDailyTip(false)}
                      className="p-2 hover:bg-white/5 rounded-xl text-zinc-600 hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      <Lightbulb className="text-emerald-400 w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Günün İpucu</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Teknoloji Rehberi</span>
                      </div>
                      <p className="text-base text-zinc-300 leading-relaxed font-medium">
                        {DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length]}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex w-full mb-8",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[90%] md:max-w-[85%] rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative group transition-all duration-500",
                      msg.role === 'user' 
                        ? "bg-white text-black rounded-tr-none shadow-white/5" 
                        : "glass-card rounded-tl-none border-white/5"
                    )}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-4 mb-6">
                          <div className={cn(
                            "w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500",
                            msg.isTyping ? "shadow-emerald-500/50 scale-110 animate-pulse" : "shadow-emerald-500/20"
                          )}>
                            <Cpu className={cn("w-5 h-5 text-white", msg.isTyping && "animate-spin-slow")} />
                          </div>
                          <div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-[0.2em] block transition-all duration-500",
                              msg.isTyping ? "text-emerald-300 animate-text-glow" : "text-emerald-400"
                            )}>
                              DeneyapAI Mentor
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Sistem v5.0 • {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      )}

                      {msg.role === 'user' && (
                        <div className="flex items-center gap-3 mb-4 opacity-40">
                          <User className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Siz • {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}

                      <div className="markdown-body text-base md:text-lg leading-relaxed">
                        {msg.isTyping && msg.content.includes('Analiz') ? (
                          <div className="flex flex-col gap-3">
                            <span className="text-emerald-400/70 font-medium italic">{msg.content}</span>
                            <TypingIndicator />
                          </div>
                        ) : msg.isTyping && msg.role === 'assistant' && idx === messages.length - 1 ? (
                          <Typewriter 
                            text={msg.content} 
                            onComplete={() => {
                              const newMessages = [...messages];
                              newMessages[idx].isTyping = false;
                              setMessages(newMessages);
                            }} 
                          />
                        ) : (
                          <Markdown>{msg.content}</Markdown>
                        )}
                      </div>

                      {msg.role === 'assistant' && (
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleCopy(msg.content, idx)}
                              className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all flex items-center gap-2"
                            >
                              {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              <span className="text-[10px] font-black uppercase tracking-widest">Kopyala</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[200]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-12 mb-8 overflow-hidden">
            <img src="https://r.resimlink.com/UsHJvfCn.png" alt="DeneyapAI Logo" className="w-full h-full object-cover" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-emerald-500/20 rounded-full"
          />
        </motion.div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">DeneyapAI</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.3em]">DeneyapAI</p>
        <div className="mt-12 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[200] p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-8"
        >
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </motion.div>
        <h2 className="text-3xl font-display font-bold text-white mb-4">Hesabınız Yasaklandı</h2>
        <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
          Topluluk kurallarımızı ihlal ettiğiniz tespit edildiği için hesabınız kalıcı olarak askıya alınmıştır.
        </p>
        
        {profile?.banReason && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 mb-8 w-full max-w-md text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block mb-2">Yasaklanma Sebebi</span>
            <p className="text-zinc-300 text-sm">{profile.banReason}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-md">
          <button 
            onClick={() => window.location.href = `mailto:imranyesildag123@gmail.com?subject=Hesap Yasaklanma İtirazı (${firebaseUser?.uid})`}
            className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all"
          >
            İtiraz Et / İletişime Geç
          </button>
          <button 
            onClick={() => auth?.signOut()}
            className="w-full bg-zinc-900 text-zinc-400 font-black py-4 rounded-2xl uppercase tracking-widest text-xs border border-white/5 hover:bg-zinc-800 transition-all"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

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
                     (isRegistering ? 'Hesap Oluştur' : 'Giriş Yap')}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-2">
                    {authView === 'onboarding' ? 'Geleceğin teknolojisini güvenle inşa etmeye başla.' : 
                     'E-posta adresinle güvenli oturum aç.'}
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
                          {isLoading ? (
                            <RefreshCw className="w-5 h-5 animate-spin text-zinc-900" />
                          ) : (
                            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                          )}
                          {isLoading ? 'Giriş Yapılıyor...' : 'Google ile Devam Et'}
                        </button>

                        <button 
                          onClick={() => setAuthView('email')}
                          className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 hover:bg-white/10 active:scale-[0.98]"
                        >
                          <Mail className="w-5 h-5 text-emerald-400" />
                          E-posta ile Devam Et
                        </button>
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
                          <Mail className="w-3 h-3" />
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

                        {isRegistering && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Ad Soyad</label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                              <input 
                                type="text"
                                required
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                placeholder="Ad Soyad"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                              />
                            </div>
                          </div>
                        )}

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

                {/* Phone view removed */}
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
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                    <img src="https://r.resimlink.com/UsHJvfCn.png" alt="DeneyapAI Logo" className="w-full h-full object-cover" />
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
                  onClick={() => handleModeChange('CHAT')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'CHAT' && activeTab === 'chat'
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <MessageSquare className={cn("w-4 h-4", mode === 'CHAT' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Normal Sohbet</span>
                </button>

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
                  onClick={() => handleModeChange('QUIZ')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'QUIZ' && activeTab === 'chat'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Award className={cn("w-4 h-4", mode === 'QUIZ' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Teknoloji Quiz</span>
                </button>

                <button
                  onClick={() => handleModeChange('SHOWCASE')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'SHOWCASE' && activeTab === 'chat'
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <ImageIcon className={cn("w-4 h-4", mode === 'SHOWCASE' ? "text-purple-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Topluluk Vitrini</span>
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
                  onClick={() => handleModeChange('DAILY_CHALLENGE')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'DAILY_CHALLENGE' && activeTab === 'chat'
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <Sparkles className={cn("w-4 h-4", mode === 'DAILY_CHALLENGE' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Günün Görevi</span>
                </button>

                <button
                  onClick={() => handleModeChange('TECH_NEWS')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'TECH_NEWS' && activeTab === 'chat'
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <FileText className={cn("w-4 h-4", mode === 'TECH_NEWS' ? "text-blue-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Teknoloji Haberleri</span>
                </button>

                <div className="pt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Premium Modlar</div>
                <button
                  onClick={() => handleModeChange('IMAGE_GEN')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'IMAGE_GEN' && activeTab === 'chat'
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon className={cn("w-4 h-4", mode === 'IMAGE_GEN' ? "text-purple-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">AI Görsel Üretici</span>
                  </div>
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-purple-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-purple-500/20 text-purple-400 uppercase">Pro</span>
                  )}
                </button>

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
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-amber-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-amber-500/20 text-amber-400 uppercase">Pro</span>
                  )}
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
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-amber-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-amber-500/20 text-amber-400 uppercase">Pro</span>
                  )}
                </button>

                <button
                  onClick={() => handleModeChange('REPORT_GEN')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'REPORT_GEN' && activeTab === 'chat'
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={cn("w-4 h-4", mode === 'REPORT_GEN' ? "text-blue-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">TEKNOFEST Raporu</span>
                  </div>
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-blue-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-blue-500/20 text-blue-400 uppercase">Pro</span>
                  )}
                </button>

                <button
                  onClick={() => handleModeChange('CIRCUIT_ASSISTANT')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'CIRCUIT_ASSISTANT' && activeTab === 'chat'
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Code2 className={cn("w-4 h-4", mode === 'CIRCUIT_ASSISTANT' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">Devre Şeması</span>
                  </div>
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-emerald-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-emerald-500/20 text-emerald-400 uppercase">Pro</span>
                  )}
                </button>

                <button
                  onClick={() => handleModeChange('CODE_CONVERTER')}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'CODE_CONVERTER' && activeTab === 'chat'
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className={cn("w-4 h-4", mode === 'CODE_CONVERTER' ? "text-indigo-400" : "group-hover:text-zinc-200")} />
                    <span className="font-semibold text-sm">Kod Dönüştürücü</span>
                  </div>
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-indigo-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-indigo-500/20 text-indigo-400 uppercase">Pro</span>
                  )}
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
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-amber-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-amber-500/20 text-amber-400 uppercase">Pro</span>
                  )}
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
                    <span className="font-semibold text-sm">Sesli Sohbet</span>
                  </div>
                  {profile?.subscriptionTier !== 'PRO' ? (
                    <Lock className="w-3 h-3 text-red-500/40" />
                  ) : (
                    <span className="text-[8px] font-black px-1 rounded bg-red-500 text-white uppercase">Pro</span>
                  )}
                </button>

                <div className="pt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Destek & Bilgi</div>
                <button
                  onClick={() => handleModeChange('SUBSCRIPTION')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'SUBSCRIPTION'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <CreditCard className={cn("w-4 h-4", mode === 'SUBSCRIPTION' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Abonelik & Planlar</span>
                </button>

                <button
                  onClick={() => handleModeChange('FAQ')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                    mode === 'FAQ'
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <HelpCircle className={cn("w-4 h-4", mode === 'FAQ' ? "text-blue-400" : "group-hover:text-zinc-200")} />
                  <span className="font-semibold text-sm">Sıkça Sorulan Sorular</span>
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
                  <span className="text-sm">Neler Yeni? (v3.0.0)</span>
                </button>
                <button 
                  onClick={() => { handleModeChange('TERMS'); setShowMobileMenu(false); }}
                  className="w-full text-center text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-bold"
                >
                  Hizmet Şartları
                </button>
                <button 
                  onClick={() => { handleModeChange('PRIVACY'); setShowMobileMenu(false); }}
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
                          { name: 'TEKNOFEST Raporu', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Devre Şeması Çizici', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Kod Dönüştürücü', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'AI Kod Optimizasyonu', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Proje Yol Haritası', free: '✖️', basic: '✖️', pro: '✅' },
                          { name: 'Uzman Mentorluk', free: '✖️', basic: '✖️', pro: '✅' },
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
      <aside className="fixed left-6 top-6 bottom-6 w-20 lg:w-80 glass-dark rounded-[2.5rem] flex flex-col hidden md:flex z-50 transition-all duration-500 group/sidebar shadow-2xl">
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleModeChange('PROJECT_GEN')}>
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-emerald-500/40 overflow-hidden">
              <img src="https://r.resimlink.com/UsHJvfCn.png" alt="DeneyapAI Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:block opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-500">
              <h1 className="font-display font-bold text-2xl tracking-tight text-white leading-none mb-1">DeneyapAI</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Next-Gen v5.0</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 lg:px-6 pb-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Main Tools */}
          <div className="space-y-3">
            <div className="hidden lg:block px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Akıllı Araçlar</div>
            <div className="space-y-1.5">
              {[
                { id: 'CHAT', icon: MessageSquare, label: 'Normal Sohbet', color: 'emerald' },
                { id: 'PROJECT_GEN', icon: Lightbulb, label: 'Proje Üretici', color: 'emerald' },
                { id: 'QUIZ', icon: Award, label: 'Bilgi Yarışması', color: 'amber' },
                { id: 'LEADERBOARD', icon: Trophy, label: 'Liderlik Tablosu', color: 'amber' },
                { id: 'SHOWCASE', icon: ImageIcon, label: 'Topluluk Vitrini', color: 'purple' },
                { id: 'DEBUGGER', icon: Bug, label: 'Kod Debugger', color: 'blue' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.id === 'QUIZ' ? handleStartQuiz() : handleModeChange(item.id as AppMode)}
                  className={cn(
                    "w-full flex items-center gap-4 px-3 lg:px-5 py-3.5 rounded-2xl transition-all duration-500 group/item relative overflow-hidden",
                    mode === item.id && activeTab === 'chat'
                      ? `bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/20 shadow-lg shadow-${item.color}-500/5` 
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-colors duration-500 shrink-0", mode === item.id ? `text-${item.color}-400` : "group-hover/item:text-zinc-200")} />
                  <span className="font-bold text-sm hidden lg:block tracking-tight">{item.label}</span>
                  {mode === item.id && (
                    <motion.div layoutId="sidebar-active" className={cn("absolute left-0 w-1 h-6 rounded-full", `bg-${item.color}-500`)} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* AI Power */}
          <div className="space-y-3">
            <div className="hidden lg:block px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Premium Zeka</div>
            <div className="space-y-1.5">
              {[
                { id: 'IMAGE_GEN', icon: ImageIcon, label: 'Görsel Üretici', color: 'purple', premium: true },
                { id: 'REPORT_GEN', icon: FileText, label: 'TEKNOFEST Raporu', color: 'blue', premium: true },
                { id: 'CIRCUIT_ASSISTANT', icon: Code2, label: 'Devre Şeması', color: 'emerald', premium: true },
                { id: 'CODE_CONVERTER', icon: RefreshCw, label: 'Kod Dönüştürücü', color: 'indigo', premium: true },
                { id: 'AI_OPTIMIZER', icon: Zap, label: 'Optimizasyon', color: 'amber', premium: true },
                { id: 'ROADMAP_GEN', icon: ChevronRight, label: 'Yol Haritası', color: 'blue', premium: true },
                { id: 'LIVE_VOICE', icon: Mic, label: 'Sesli Sohbet', color: 'red', premium: true },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleModeChange(item.id as AppMode)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 lg:px-5 py-3.5 rounded-2xl transition-all duration-500 group/item relative overflow-hidden",
                    mode === item.id && activeTab === 'chat'
                      ? `bg-${item.color}-500/10 text-${item.color}-400 border border-${item.color}-500/20 shadow-lg shadow-${item.color}-500/5` 
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={cn("w-5 h-5 transition-colors duration-500 shrink-0", mode === item.id ? `text-${item.color}-400` : "group-hover/item:text-zinc-200")} />
                    <span className="font-bold text-sm hidden lg:block tracking-tight">{item.label}</span>
                  </div>
                  {item.premium && profile?.subscriptionTier !== 'PRO' && (
                    <Lock className="w-3.5 h-3.5 text-zinc-600 lg:block hidden opacity-40" />
                  )}
                  {mode === item.id && (
                    <motion.div layoutId="sidebar-active" className={cn("absolute left-0 w-1 h-6 rounded-full", `bg-${item.color}-500`)} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-6 lg:p-8 mt-auto">
          <div className="glass-card rounded-[2.5rem] p-6 space-y-4 border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Info className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="hidden lg:block">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">DeneyapAI</span>
                <span className="text-[9px] text-zinc-600 font-bold">Geleceği İnşa Et</span>
              </div>
            </div>
            <button 
              onClick={() => setShowChangelog(true)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-all duration-300 border border-white/5 hidden lg:block"
            >
              Yenilikler v5.0
            </button>
            <div className="flex items-center justify-center gap-4 pt-2 lg:hidden">
              <button 
                onClick={() => handleModeChange('PRIVACY')}
                className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Gizlilik
              </button>
              <span className="w-1 h-1 bg-zinc-800 rounded-full" />
              <button 
                onClick={() => handleModeChange('TERMS')}
                className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Şartlar
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative pb-64 lg:pb-0 min-w-0 md:ml-32 lg:ml-96">
        {/* Welcome Rail */}
        {profile && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="fixed left-24 lg:left-[22rem] top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-8 pointer-events-none"
          >
            <motion.div 
              animate={{ height: [0, 100, 100], opacity: [0, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-px bg-gradient-to-b from-transparent via-emerald-500 to-transparent" 
            />
            <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black uppercase tracking-[0.6em] text-zinc-700 whitespace-nowrap flex items-center gap-4 group">
              <span className="opacity-40 group-hover:opacity-100 transition-opacity duration-500">Hoşgeldin</span>
              <motion.span 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-emerald-500/60 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                {profile.name}
              </motion.span>
            </div>
            <motion.div 
              animate={{ height: [0, 100, 100], opacity: [0, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 1 }}
              className="w-px bg-gradient-to-b from-transparent via-emerald-500 to-transparent" 
            />
          </motion.div>
        )}

        {/* Header */}
        <header className="h-24 px-8 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-6 lg:hidden">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 shadow-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                <img src="https://r.resimlink.com/UsHJvfCn.png" alt="DeneyapAI Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-display font-bold text-xl tracking-tight text-white">DeneyapAI</h1>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-bold text-zinc-300 tracking-tight">Sistem Çevrimiçi</span>
            </div>
            
            <div className="h-8 w-px bg-white/5" />
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === 'chat' ? "bg-white text-black shadow-xl scale-105" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Zeka
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === 'history' ? "bg-white text-black shadow-xl scale-105" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Geçmiş
              </button>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-6">
              {profile?.subscriptionTier !== 'PRO' && (
                <button 
                  onClick={() => handleModeChange('SUBSCRIPTION')}
                  className="hidden md:flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Pro'ya Geç
                </button>
              )}
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">{profile.name}</span>
                  {isUserPro(profile) && (
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/20">Pro</span>
                  )}
                </div>
                <div className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5", badge?.color)}>
                  <div className={cn("w-1 h-1 rounded-full", badge?.color.replace('text-', 'bg-'))} />
                  {badge?.name}
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all duration-300 active:scale-95 shadow-2xl group"
              >
                <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderTabContent()}
        </div>

        {/* Input Area (Only in Chat Tab) */}
        {activeTab === 'chat' && !['LIVE_VOICE', 'SUBSCRIPTION', 'FAQ', 'TERMS'].includes(mode) && (
          <div className="p-4 md:p-10 pt-0 fixed bottom-0 left-0 right-0 lg:relative bg-gradient-to-t from-black via-black/95 to-transparent lg:bg-transparent z-20">
            {isLimitReached ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto glass-card border-amber-500/20 rounded-[3rem] p-12 text-center mb-8"
              >
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Zap className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">Günlük Limitine Ulaştın!</h3>
                <p className="text-zinc-400 text-base leading-relaxed max-w-lg mx-auto mb-10">
                  Geleceğin teknoloji fatihi, bugünlük zeka kapasitemizi doldurdun! API maliyetlerini dengelemek için sınırlı kontenjan kullanıyoruz.
                </p>
                {profile?.subscriptionTier !== 'PRO' && (
                  <button 
                    onClick={() => handleModeChange('SUBSCRIPTION')}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black px-12 py-5 rounded-2xl transition-all shadow-2xl shadow-amber-500/20 uppercase tracking-widest text-xs scale-105 active:scale-95"
                  >
                    {profile?.subscriptionTier === 'BASIC' ? 'Pro\'ya Yükselt ve Sınırları Kaldır' : 'Premium\'a Geç ve Sınırları Kaldır'}
                  </button>
                )}
              </motion.div>
            ) : (
              <form 
                onSubmit={handleSubmit}
                className="relative max-w-5xl mx-auto group"
              >
                {/* Quick Actions */}
                <div className="absolute -top-24 left-0 right-0 flex gap-3 overflow-x-auto pb-8 px-4 no-scrollbar">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        setMode(action.mode as AppMode);
                        setInput(action.text);
                      }}
                      className="whitespace-nowrap flex items-center gap-3.5 px-7 py-3.5 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-500 shadow-2xl active:scale-95"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.text}
                    </button>
                  ))}
                </div>

                {/* Input Container */}
                <div className="relative bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-3 shadow-2xl transition-all duration-700 group-focus-within:border-emerald-500/50 group-focus-within:bg-zinc-900 group-focus-within:shadow-emerald-500/10">
                  {profile?.subscriptionTier !== 'PRO' && (
                    <div className="absolute -top-14 right-8 flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full cursor-pointer hover:bg-amber-500/20 transition-all duration-500 shadow-lg" onClick={() => handleModeChange('SUBSCRIPTION')}>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pro'ya Geç ve Sınırları Kaldır</span>
                    </div>
                  )}
                  <div className="absolute -top-5 left-10 px-4 py-1.5 bg-zinc-900 border border-white/10 rounded-full shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Mod: {mode === 'PROJECT_GEN' ? 'Proje Üretici' : 
                            mode === 'DEBUGGER' ? 'Hata Ayıklayıcı' :
                            mode === 'AI_OPTIMIZER' ? 'Kod Optimizasyonu' :
                            mode === 'ROADMAP_GEN' ? 'Yol Haritası' :
                            mode === 'COMPONENT_LIB' ? 'Bileşen Kütüphanesi' :
                            mode === 'SHOWCASE' ? 'Topluluk' :
                            mode === 'IMAGE_GEN' ? 'Görsel Üretici' :
                            mode === 'DAILY_CHALLENGE' ? 'Günün Görevi' :
                            mode === 'TECH_NEWS' ? 'Teknoloji Haberleri' :
                            mode === 'CHAT' ? 'Normal Sohbet' :
                            'Uzman Mentor'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {selectedImage && (
                      <div className="px-8 pt-4 relative group/img">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                          <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-end gap-3">
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
                          mode === 'PROJECT_GEN' ? "Neler tasarlamak istersin? Malzemelerini yaz..." : 
                          mode === 'DEBUGGER' ? "Hatalı kodunu buraya yapıştır..." :
                          mode === 'IMAGE_GEN' ? "Hayalindeki teknolojik tasarımı tarif et..." :
                          mode === 'CHAT' ? "DeneyapAI ile sohbete başla..." :
                          "DeneyapAI'ya bir soru sor..."
                        }
                        className="w-full bg-transparent border-none rounded-[3rem] p-8 pr-48 focus:outline-none transition-all min-h-[120px] max-h-[450px] resize-none text-base md:text-lg font-medium placeholder:text-zinc-700 custom-scrollbar"
                        rows={1}
                      />
                      
                      <div className="absolute right-6 bottom-6 flex items-center gap-3">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSelectedImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-4 rounded-2xl transition-all duration-500 shadow-xl text-zinc-500 hover:text-white hover:bg-white/5"
                        >
                          <ImageIcon className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={toggleVoiceInput}
                          className={cn(
                            "p-4 rounded-2xl transition-all duration-500 shadow-xl",
                            isListening ? "bg-red-500 text-white animate-pulse shadow-red-500/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        
                        <button 
                          type="submit"
                          disabled={(!input.trim() && !selectedImage) || isLoading || cooldown > 0}
                          className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 group/btn",
                            (!input.trim() && !selectedImage) || isLoading || cooldown > 0
                              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                              : "bg-white text-black hover:scale-105 shadow-white/10"
                          )}
                        >
                          {cooldown > 0 ? (
                            <span className="text-sm font-black">{cooldown}</span>
                          ) : isLoading ? (
                            <RefreshCw className="w-6 h-6 animate-spin" />
                          ) : (
                            <Send className="w-6 h-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <button onClick={() => handleModeChange('FAQ')} className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-black transition-colors">Destek</button>
                <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                <button onClick={() => handleModeChange('TERMS')} className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-black transition-colors">Şartlar</button>
                <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                <button onClick={() => handleModeChange('PRIVACY')} className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-black transition-colors">Gizlilik</button>
              </div>
              <div className="flex items-center gap-3 opacity-30">
                <div className="w-10 h-[1px] bg-zinc-700" />
                <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black">
                  DeneyapAI • v5.0
                </p>
                <div className="w-10 h-[1px] bg-zinc-700" />
              </div>
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
            className="fixed inset-0 z-[200] bg-zinc-950"
          >
            <LiveVoiceView 
              isPremium={profile?.isPremium || isUserPro(profile)} 
              onClose={() => setMode('PROJECT_GEN')} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/5 px-6 py-4 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => { setMode('PROJECT_GEN'); setActiveTab('chat'); }}
          className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", mode === 'PROJECT_GEN' && activeTab === 'chat' ? "text-emerald-400 scale-110" : "text-zinc-600")}
        >
          <Lightbulb className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Proje</span>
        </button>
        <button 
          onClick={() => { setMode('LEADERBOARD'); setActiveTab('chat'); }}
          className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", mode === 'LEADERBOARD' && activeTab === 'chat' ? "text-amber-400 scale-110" : "text-zinc-600")}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Liderler</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", activeTab === 'history' ? "text-blue-400 scale-110" : "text-zinc-600")}
        >
          <HistoryIcon className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Geçmiş</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn("flex flex-col items-center gap-1.5 transition-all duration-300", activeTab === 'profile' ? "text-purple-400 scale-110" : "text-zinc-600")}
        >
          <User className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Profil</span>
        </button>
      </div>

      {/* 2FA Verification Modal (Login) */}
      <AnimatePresence>
        {show2FAVerify && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">2FA Doğrulaması</h3>
                  <p className="text-sm text-zinc-400">
                    Hesabınız iki faktörlü doğrulama ile korunmaktadır. Lütfen Authenticator uygulamanızdaki kodu girin.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block text-left ml-1">Doğrulama Kodu</label>
                    <input 
                      type="text"
                      maxLength={6}
                      value={twoFAVerifyCode}
                      onChange={(e) => setTwoFAVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  {twoFAError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{twoFAError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handle2FAVerify}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                      Doğrula
                    </button>
                    <button 
                      onClick={handleSendEmailCode}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all border border-zinc-700 text-[10px] uppercase tracking-tighter"
                    >
                      E-posta ile Kod Al
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => signOut(auth!)}
                    className="w-full text-zinc-500 hover:text-white text-xs font-medium transition-colors py-2"
                  >
                    Girişten vazgeç
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow2FAModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShow2FAModal(false)}
                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">2FA Aktif Et</h3>
                  <p className="text-sm text-zinc-400">
                    Google Authenticator veya benzeri bir uygulama ile aşağıdaki QR kodu taratın.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
                  <QRCodeSVG value={twoFAQRCode} size={180} />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block text-left ml-1">Doğrulama Kodu</label>
                    <input 
                      type="text"
                      maxLength={6}
                      value={twoFAVerifyCode}
                      onChange={(e) => setTwoFAVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>

                  {twoFAError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold uppercase">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{twoFAError}</span>
                    </div>
                  )}

                  <button 
                    onClick={verifyAndEnable2FA}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Doğrula ve Aktif Et
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KVKK Modal */}
      <AnimatePresence>
        {showKvkkModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-bold text-white">KVKK Bilgilendirmesi</h3>
                    <p className="text-zinc-500 text-sm font-medium">Kişisel Verilerin Korunması Kanunu</p>
                  </div>
                </div>

                <div className="max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar space-y-4 text-zinc-400 text-sm leading-relaxed">
                  <p>Değerli Kullanıcımız,</p>
                  <p>DeneyapAI olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla, kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.</p>
                  <p><strong>1. Veri İşleme Amacı:</strong> DeneyapAI uygulamasını kullanırken paylaştığınız veriler (ad, e-posta, kullanım istatistikleri), size daha iyi bir yapay zeka deneyimi sunmak, hesap güvenliğinizi sağlamak ve ilerlemenizi takip etmek amacıyla işlenmektedir.</p>
                  <p><strong>2. Veri Paylaşımı:</strong> Kişisel verileriniz, yasal yükümlülükler dışında üçüncü taraflarla paylaşılmamaktadır. Yapay zeka modelleriyle paylaşılan veriler anonimleştirilerek iletilmektedir.</p>
                  <p><strong>3. Haklarınız:</strong> KVKK’nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme ve silinmesini talep etme haklarına sahipsiniz.</p>
                  <p>Uygulamayı kullanmaya devam ederek, KVKK Aydınlatma Metni'ni okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={handleAcceptKvkk}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs"
                  >
                    Okudum, Kabul Ediyorum
                  </button>
                  <button 
                    onClick={() => handleLogout()}
                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest"
                  >
                    Reddet ve Çıkış Yap
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Showcase Modal */}
      <AnimatePresence>
        {showShowcaseModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShowcaseModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-display font-bold text-white">Proje Paylaş</h3>
                      <p className="text-zinc-500 text-sm font-medium">Toplulukla çalışmanı paylaş ve ilham ver.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowShowcaseModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newProject = {
                    title: formData.get('title') as string,
                    author: profile?.name || 'Anonim',
                    description: formData.get('description') as string,
                    likes: 0,
                    category: formData.get('category') as string,
                    image: (formData.get('image_url') as string) || `https://picsum.photos/seed/${Math.random()}/800/600`,
                    timestamp: Date.now()
                  };

                  if (db) {
                    try {
                      const { collection, addDoc } = await import('firebase/firestore');
                      const docRef = await addDoc(collection(db, 'showcase'), newProject);
                      setShowcaseProjects([{ id: docRef.id, ...newProject }, ...showcaseProjects]);
                    } catch (e) {
                      console.error("Error sharing project:", e);
                    }
                  } else {
                    setShowcaseProjects([{ id: Math.random().toString(), ...newProject }, ...showcaseProjects]);
                  }

                  if (profile) {
                    const updatedProfile = {
                      ...profile,
                      stats: {
                        ...profile.stats,
                        projectsShared: (profile.stats?.projectsShared || 0) + 1
                      }
                    } as UserProfile;
                    setProfile(updatedProfile);
                    localStorage.setItem('deneyapai_profile', JSON.stringify(updatedProfile));
                    if (firebaseUser && db) {
                      const { doc, setDoc } = await import('firebase/firestore');
                      setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile, { merge: true });
                    }
                  }
                  setShowShowcaseModal(false);
                  addNotification("Projeniz başarıyla paylaşıldı! 🚀", "success");
                }}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Proje Başlığı</label>
                      <input 
                        name="title"
                        required
                        placeholder="Örn: Akıllı Ev Sistemi"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Kategori</label>
                        <select 
                          name="category"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none"
                        >
                          <option value="Robotik">Robotik</option>
                          <option value="Yazılım">Yazılım</option>
                          <option value="Tarım">Tarım</option>
                          <option value="Enerji">Enerji</option>
                          <option value="Sağlık">Sağlık</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Görsel URL (Opsiyonel)</label>
                        <input 
                          name="image_url"
                          placeholder="https://..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Proje Açıklaması</label>
                      <textarea 
                        name="description"
                        required
                        rows={4}
                        placeholder="Projeniz ne işe yarıyor? Hangi malzemeleri kullandınız?"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-purple-500 hover:bg-purple-400 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-500/20 uppercase tracking-widest text-xs"
                  >
                    Hemen Paylaş
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showInstructorModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowInstructorModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 md:p-12 space-y-8"
            >
              <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <GraduationCap className="w-10 h-10 text-purple-500" />
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-display font-bold text-white">Eğitmen Doğrulaması</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Eğitmen lisansı almak için kurucumuz <span className="text-white font-bold">Kamuran Yeşildağ</span> ile iletişime geçmeniz gerekmektedir. 
                  <br/><br/>
                  "Tamam" butonuna bastığınızda e-posta uygulamanız otomatik olarak açılacaktır.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    window.location.href = `mailto:imranyesildag123@gmail.com?subject=DeneyapAI Eğitmen Lisansı Talebi&body=Merhaba Kamuran Bey,%0D%0A%0D%0ADeneyapAI platformu için eğitmen lisansı almak istiyorum.%0D%0A%0D%0AAd Soyad: ${profile?.name}%0D%0AE-posta: ${profile?.email}%0D%0AGörev Yeri: `;
                    setShowInstructorModal(false);
                    addNotification("E-posta uygulaması açılıyor...", "info");
                  }}
                  className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 transition-all"
                >
                  Tamam, E-posta Gönder
                </button>
                <button 
                  onClick={() => setShowInstructorModal(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedProject && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[3rem] max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="md:w-1/2 h-64 md:h-auto relative">
                <img 
                  src={selectedProject.image || 'https://picsum.photos/seed/project/800/600'} 
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <div className="px-4 py-2 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    {selectedProject.category}
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Paylaşan</p>
                      <p className="text-white font-bold">{selectedProject.author}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6 flex-1">
                  <h3 className="text-4xl font-display font-bold text-white leading-tight">{selectedProject.title}</h3>
                  <div className="h-1 w-20 bg-purple-500 rounded-full" />
                  <div className="prose prose-invert max-w-none">
                    <p className="text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap">
                      {selectedProject.description}
                    </p>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => handleLikeProject(selectedProject.id)}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group/like"
                  >
                    <Star className="w-5 h-5 text-zinc-500 group-hover/like:fill-red-400 group-hover/like:text-red-400" />
                    <span className="text-sm font-bold text-zinc-300">{selectedProject.likes} Beğeni</span>
                  </button>
                  <button className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-bold text-sm">
                    <Share2 className="w-5 h-5" />
                    Paylaş
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Features Popup */}
      <AnimatePresence>
        {showNewFeaturesPopup && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="relative w-full max-w-lg glass-card rounded-[3rem] p-8 md:p-12 overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-purple-500 to-blue-500" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Sparkles className="w-3 h-3" />
                    Yeni Güncelleme v2.5
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white tracking-tight">Neler Yeni?</h2>
                  <p className="text-zinc-500 text-sm">DeneyapAI deneyiminizi bir üst seviyeye taşıdık.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      icon: <User className="w-5 h-5 text-emerald-400" />,
                      title: "Gelişmiş Profil Düzenleme",
                      desc: "Artık adınızı, şehrinizi ve kurumunuzu güncelleyebilirsiniz."
                    },
                    {
                      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
                      title: "Kişiselleştirilmiş AI Yanıtları",
                      desc: "DeneyapAI artık rolünüze ve ilinize göre özel yanıtlar veriyor."
                    },
                    {
                      icon: <GraduationCap className="w-5 h-5 text-blue-400" />,
                      title: "Eğitmen Lisans Sistemi",
                      desc: "Eğitmenler için yeni lisans aktivasyon ve doğrulama sistemi."
                    },
                    {
                      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
                      title: "Akıllı Hata Yönetimi",
                      desc: "API hataları için daha açıklayıcı ve yönlendirici mesajlar."
                    }
                  ].map((feature, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">{feature.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button 
                  onClick={closeNewFeaturesPopup}
                  className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  Harika, Başlayalım!
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingFeedback && setShowFeedbackModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 md:p-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">Geri Bildirim</h3>
                </div>
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  disabled={isSubmittingFeedback}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  DeneyapAI hakkında ne düşünüyorsunuz? Hata bildirmek veya yeni bir özellik önermek için aşağıdaki alanı kullanabilirsiniz.
                </p>
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Mesajınızı buraya yazın..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  disabled={isSubmittingFeedback}
                />
              </div>

              <button 
                onClick={handleSendFeedback}
                disabled={isSubmittingFeedback || !feedbackText.trim()}
                className="w-full py-4 bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingFeedback ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Geri Bildirimi İlet
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordChangeModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordChangeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 md:p-10 space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">Şifre Değiştir</h3>
                </div>
                <button 
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Mevcut Şifre</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Yeni Şifre</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Şifreyi Güncelle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Login Warning Modal */}
      <AnimatePresence>
        {showNewLoginPopup && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 md:p-10 space-y-6 border-red-500/30"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">Yeni Giriş Tespit Edildi!</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Hesabınıza farklı bir cihaz veya konumdan giriş yapıldı. Bu siz değilseniz lütfen hemen şifrenizi değiştirin.
                </p>
              </div>

              {lastSession && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-zinc-400" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">{lastSession.deviceName}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">Önceki Oturum</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    {lastSession.location}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setShowNewLoginPopup(false);
                    setShowPasswordChangeModal(true);
                    setProfile(prev => prev ? { ...prev, newLoginDetected: false } : null);
                  }}
                  className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                >
                  Şifremi Değiştir
                </button>
                <button 
                  onClick={() => {
                    setShowNewLoginPopup(false);
                    setProfile(prev => prev ? { ...prev, newLoginDetected: false } : null);
                  }}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Bu Bendim, Sorun Yok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfileModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-[2.5rem] p-8 md:p-10 space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-display font-bold text-white">Profili Düzenle</h3>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="Adınız Soyadınız"
                  />
                </div>

                {(profile?.role === 'INSTRUCTOR' || profile?.role === 'REPRESENTATIVE') && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Şehir / İl</label>
                      <input 
                        type="text" 
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                        placeholder="Örn: Bitlis, İstanbul"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Kurum / Atölye</label>
                      <input 
                        type="text" 
                        value={editInstitution}
                        onChange={(e) => setEditInstitution(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                        placeholder="Örn: Bitlis Deneyap Atölyesi"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Teknik Seviye</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Başlangıç', 'Orta', 'İleri'] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setEditLevel(l)}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          editLevel === l ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpdateProfile}
                className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                Değişiklikleri Kaydet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {/* Notification Toast */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
          <AnimatePresence>
            {showInstallNotification && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 pointer-events-auto"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Ana Ekrana Ekle</h4>
                    <p className="text-[10px] text-zinc-400">DeneyapAI'yı uygulama olarak kullanın.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowInstallNotification(false)}
                    className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    Kapat
                  </button>
                  <button 
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                  >
                    Yükle
                  </button>
                </div>
              </motion.div>
            )}
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={cn(
                  "p-4 rounded-2xl shadow-2xl border flex items-center gap-3 pointer-events-auto",
                  n.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  n.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  "bg-blue-500/10 border-blue-500/20 text-blue-400"
                )}
              >
                {n.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> :
                 n.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                 <Info className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium">{n.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </AnimatePresence>
    </div>
  );
}
