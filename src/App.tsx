import React, { useState, useRef, useEffect } from 'react';
import { auth, googleProvider, isFirebaseConfigured, db, firebaseConfigError } from './services/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Image as ImageIcon,
  CreditCard,
  HelpCircle,
  FileText,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateResponse } from './services/gemini';
import { AppMode, Message, UserProfile, HistoryItem } from './types';
import LiveVoiceView from './components/LiveVoiceView';
import { OTP } from 'otplib';
import { QRCodeSVG } from 'qrcode.react';

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

const DAILY_TIPS = [
  "Deneyap Kart'ın dahili Wi-Fi ve Bluetooth özelliği ile IoT projeleri geliştirebilirsin.",
  "HC-SR04 mesafe sensörü ile engel tanımayan robotlar yapabilirsin.",
  "TEKNOFEST raporlarında teknik detaylara ve özgünlüğe önem vermelisin.",
  "Bitlis'in soğuk kış günlerinde akıllı ev sistemleri ile ısınma kontrolü yapabilirsin.",
  "LDR sensörü kullanarak karanlıkta yanan akıllı sokak lambaları tasarlayabilirsin.",
  "Kod yazarken yorum satırı eklemek, projeni başkalarının anlamasını kolaylaştırır.",
  "DeneyapAI ile kodundaki hataları saniyeler içinde bulabilirsin!"
];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
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
      localStorage.setItem('tekno_nova_profile', JSON.stringify(updatedProfile));
      
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
  const [authView, setAuthView] = useState<'onboarding' | 'email'>('onboarding');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [tempFirebaseUser, setTempFirebaseUser] = useState<FirebaseUser | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
          // Fetch profile and history from Firestore
          let fetchedProfile: UserProfile | null = null;
          let fetchedHistory: HistoryItem[] = [];
          if (db) {
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                fetchedProfile = userDoc.data() as UserProfile;
              }
              
              const historyDoc = await getDoc(doc(db, 'history', user.uid));
              if (historyDoc.exists()) {
                fetchedHistory = (historyDoc.data() as { items: HistoryItem[] }).items || [];
              }
            } catch (e) {
              console.error("Error fetching data from Firestore:", e);
            }
          }

          // If 2FA is enabled, we need to verify before setting firebaseUser
          if (fetchedProfile?.twoFAEnabled) {
            setTempFirebaseUser(user);
            setProfile(fetchedProfile);
            setHistory(fetchedHistory);
            setShow2FAVerify(true);
            setIsAuthLoading(false);
            if (isLoggingIn) {
              addNotification("Kimlik doğrulandı. Lütfen 2FA kodunuzu girin.", "info");
            }
            return;
          }

          setFirebaseUser(user);
          setHistory(fetchedHistory);
          if (isLoggingIn) {
            addNotification("Giriş başarılı! Hoş geldin.", "success");
            setIsLoggingIn(false);
          }
          setProfile(prev => {
            const profileToUse = fetchedProfile || prev;
            let finalProfile: UserProfile;
            if (!profileToUse) {
              finalProfile = {
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
            } else {
              // Update existing profile with email if missing
              finalProfile = { ...profileToUse };
              if (!finalProfile.email && user.email) {
                finalProfile.email = user.email;
              }
            }
            
            localStorage.setItem('tekno_nova_profile', JSON.stringify(finalProfile));
            
            // Sync to Firestore if it's a new profile or updated
            if (db) {
              setDoc(doc(db, 'users', user.uid), finalProfile, { merge: true })
                .catch(e => console.error("Error syncing profile to Firestore:", e));
            }
            
            return finalProfile;
          });
          setShowOnboarding(false);
        } else {
          setFirebaseUser(null);
          setTempFirebaseUser(null);
          setShow2FAVerify(false);
          
          // If no user and no local profile, show onboarding
          const storedProfile = localStorage.getItem('tekno_nova_profile');
          if (!storedProfile) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error("Error in auth state listener:", error);
      } finally {
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
    setIsLoggingIn(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
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
      setIsLoggingIn(true);
      setAuthError("");
      
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Calling signInWithPopup...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In Success:", result.user.email);
    } catch (error: any) {
      console.error("Google Sign-In Error Details:", error);
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
      localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
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

    // Image generation limit check
    if (mode === 'IMAGE_GEN') {
      const tier = profile.subscriptionTier || 'FREE';
      const count = (profile.stats as any)?.imagesGenerated || 0;
      let limit = 2;
      if (tier === 'BASIC') limit = 20;
      if (tier === 'PRO') limit = Infinity;
      
      if (count >= limit) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: `Görsel oluşturma limitine ulaştın! 🎨 ${tier === 'FREE' ? 'Ücretsiz planda 2, Basic planda 20 görsel oluşturabilirsin.' : 'Basic planda 20 görsel oluşturabilirsin.'} Sınırsız görsel ve daha fazlası için Pro'ya geçebilirsin.`,
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
    localStorage.setItem('tekno_nova_profile', JSON.stringify(newProfile));
    
    if (firebaseUser && db) {
      setDoc(doc(db, 'users', firebaseUser.uid), newProfile, { merge: true })
        .catch(e => console.error("Error syncing profile to Firestore:", e));
    }

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
      setMode('SUBSCRIPTION');
      setActiveTab('modes');
      setShowMobileMenu(false);
      addNotification("Bu özellik için Pro üyelik gereklidir.", "info");
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

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[200]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-12 mb-8">
            <Star className="text-white w-12 h-12" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-emerald-500/20 rounded-full"
          />
        </motion.div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">DeneyapAI</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.3em]">Bitlis Stüdyo</p>
        <div className="mt-12 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            />
          ))}
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
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black px-1 rounded bg-purple-500/20 text-purple-400 uppercase">Limitli</span>
                  </div>
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
      <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col hidden lg:flex shrink-0 h-screen sticky top-0 z-20">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-2 group cursor-pointer">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-transform group-hover:scale-110 group-hover:rotate-6">
              <Star className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-white">DeneyapAI</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Sürüm 3.0</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Temel Araçlar */}
          <div className="space-y-2">
            <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Temel Araçlar</div>
            <div className="space-y-1">
              <button
                onClick={() => handleModeChange('PROJECT_GEN')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'PROJECT_GEN' && activeTab === 'chat'
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Lightbulb className={cn("w-5 h-5 transition-colors", mode === 'PROJECT_GEN' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Proje Üretici</span>
              </button>

              <button
                onClick={() => handleModeChange('DAILY_CHALLENGE')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'DAILY_CHALLENGE' && activeTab === 'chat'
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Sparkles className={cn("w-5 h-5 transition-colors", mode === 'DAILY_CHALLENGE' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Günün Görevi</span>
              </button>

              <button
                onClick={() => handleModeChange('TECH_NEWS')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'TECH_NEWS' && activeTab === 'chat'
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <FileText className={cn("w-5 h-5 transition-colors", mode === 'TECH_NEWS' ? "text-blue-400" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Teknoloji Haberleri</span>
              </button>

              <button
                onClick={() => handleModeChange('DEBUGGER')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'DEBUGGER' && activeTab === 'chat'
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Bug className={cn("w-5 h-5 transition-colors", mode === 'DEBUGGER' ? "text-blue-400" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Kod Debugger</span>
              </button>

              <button
                onClick={() => handleModeChange('COMPONENT_LIB')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'COMPONENT_LIB' && activeTab === 'chat'
                    ? "bg-zinc-500/10 text-zinc-200 border border-zinc-500/20 shadow-lg shadow-zinc-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <Cpu className={cn("w-5 h-5 transition-colors", mode === 'COMPONENT_LIB' ? "text-zinc-200" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Bileşen Kütüphanesi</span>
              </button>
            </div>
          </div>

          {/* Gelişmiş Zeka */}
          <div className="space-y-2">
            <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Gelişmiş Zeka</div>
            <div className="space-y-1">
              <button
                onClick={() => handleModeChange('IMAGE_GEN')}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'IMAGE_GEN' && activeTab === 'chat'
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className={cn("w-5 h-5 transition-colors", mode === 'IMAGE_GEN' ? "text-purple-400" : "group-hover:text-zinc-200")} />
                  <span className="font-bold text-sm">Görsel Üretici</span>
                </div>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 uppercase">Limitli</span>
              </button>

              <button
                onClick={() => handleModeChange('AI_OPTIMIZER')}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'AI_OPTIMIZER' && activeTab === 'chat'
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Zap className={cn("w-5 h-5 transition-colors", mode === 'AI_OPTIMIZER' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                  <span className="font-bold text-sm">Kod Optimizasyonu</span>
                </div>
                {!profile?.isPremium && <Key className="w-3 h-3 text-amber-500/40" />}
              </button>

              <button
                onClick={() => handleModeChange('LIVE_VOICE')}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'LIVE_VOICE' && activeTab === 'chat'
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/5" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Radio className={cn("w-5 h-5 transition-colors", mode === 'LIVE_VOICE' ? "text-red-400 animate-pulse" : "group-hover:text-zinc-200")} />
                  <span className="font-bold text-sm">Sesli Sohbet</span>
                </div>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white uppercase">Pro</span>
              </button>
            </div>
          </div>

          {/* Destek & Hesap */}
          <div className="space-y-2">
            <div className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Hesap & Destek</div>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  activeTab === 'profile'
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <User className={cn("w-5 h-5 transition-colors", activeTab === 'profile' ? "text-emerald-400" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Profilim</span>
              </button>

              <button
                onClick={() => handleModeChange('SUBSCRIPTION')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  mode === 'SUBSCRIPTION'
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <CreditCard className={cn("w-5 h-5 transition-colors", mode === 'SUBSCRIPTION' ? "text-amber-400" : "group-hover:text-zinc-200")} />
                <span className="font-bold text-sm">Üyelik & Planlar</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-6 mt-auto">
          <div className="glass-card rounded-[2rem] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Info className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Bitlis Stüdyo</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              "Geleceğin teknolojisi Bitlis'in ruhuyla harmanlanıyor."
            </p>
            <button 
              onClick={() => setShowChangelog(true)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 transition-all"
            >
              Neler Yeni? v3.0
            </button>
            <div className="flex items-center justify-center gap-4 pt-2">
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
      <main className="flex-1 flex flex-col relative pb-32 lg:pb-0 min-w-0">
        {/* Header */}
        <header className="h-20 px-6 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-30">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="p-2.5 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Star className="text-emerald-500 w-6 h-6" />
              <span className="font-display font-bold text-lg tracking-tight">DeneyapAI</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {activeTab === 'chat' ? (
                mode === 'PROJECT_GEN' ? 'Akıllı Proje Üretici' : 
                mode === 'DEBUGGER' ? 'Kod Hata Ayıklayıcı' :
                mode === 'AI_OPTIMIZER' ? 'AI Kod Optimizasyonu' :
                mode === 'ROADMAP_GEN' ? 'Proje Yol Haritası' :
                mode === 'COMPONENT_LIB' ? 'Bileşen Kütüphanesi' :
                mode === 'COMMUNITY_PROJS' ? 'Topluluk Projeleri' :
                mode === 'LIVE_VOICE' ? 'Canlı Sesli Sohbet' :
                mode === 'IMAGE_GEN' ? 'AI Görsel Üretici' :
                mode === 'DAILY_CHALLENGE' ? 'Günün Görevi' :
                mode === 'TECH_NEWS' ? 'Teknoloji Haberleri' :
                mode === 'PRIVACY' ? 'Gizlilik Politikası' :
                'Uzman Mentor'
              ) : activeTab === 'modes' ? (
                mode === 'SUBSCRIPTION' ? 'Üyelik Planları' :
                mode === 'FAQ' ? 'Sıkça Sorulan Sorular' : 
                mode === 'PRIVACY' ? 'Gizlilik Politikası' : 'Hizmet Şartları'
              ) : activeTab === 'history' ? 'Geçmiş Kayıtlar' : 'Kullanıcı Profili'}
            </span>
          </div>

          {profile && (
            <div className="flex items-center gap-3">
              {profile?.subscriptionTier !== 'PRO' && (
                <button 
                  onClick={() => handleModeChange('SUBSCRIPTION')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 transition-all active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  Pro'ya Geç
                </button>
              )}
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{profile.name}</span>
                  {profile.subscriptionTier === 'PRO' && (
                    <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-tighter">Pro</span>
                  )}
                </div>
                <div className={cn("text-[9px] font-black uppercase tracking-widest flex items-center gap-1", badge?.color)}>
                  {badge?.name}
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400 hover:border-emerald-500/50 transition-all active:scale-95 shadow-xl"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
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
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex w-full",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[90%] md:max-w-[80%] rounded-[2rem] p-5 md:p-8 shadow-2xl relative group transition-all",
                      msg.role === 'user' 
                        ? "bg-zinc-100 text-zinc-900 rounded-tr-none" 
                        : "glass-card rounded-tl-none"
                    )}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Cpu className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 block">DeneyapAI Mentor</span>
                            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Yapay Zeka Yanıtı</span>
                          </div>
                        </div>
                      )}
                      
                      {msg.role === 'assistant' && (
                        <button 
                          onClick={() => handleCopy(msg.content, idx)}
                          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}

                      <div className={cn(
                        "prose prose-invert max-w-none",
                        msg.role === 'assistant' ? "markdown-body" : "text-sm md:text-base font-semibold leading-relaxed"
                      )}>
                        {msg.role === 'assistant' ? (
                          msg.content.startsWith('data:image') ? (
                            <div className="space-y-6">
                              <img 
                                src={msg.content} 
                                alt="AI Generated" 
                                className="w-full rounded-3xl shadow-2xl border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit">
                                <ImageIcon className="w-3 h-3 text-purple-400" />
                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">AI Görsel Üretimi Tamamlandı</p>
                              </div>
                            </div>
                          ) : (
                            <Markdown>{msg.content}</Markdown>
                          )
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start"
                >
                  <div className="glass-card rounded-3xl rounded-tl-none p-5 flex items-center gap-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 1, 0.3]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 1, 
                            delay: i * 0.2 
                          }}
                          className="w-2 h-2 bg-emerald-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Zeka İşleniyor...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) ) : activeTab === 'modes' ? (
            mode === 'SUBSCRIPTION' ? (
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
                <h2 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Üyelik Planları</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">Sana en uygun planı seç, teknolojide öne geç! Tüm ödemeler Shopier güvencesiyle yapılır ve lisans kodunuz anında e-postanıza iletilir.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
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

                {/* Basic Plan */}
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

                {/* Pro Plan */}
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
                      { text: 'Proje Yol Haritası & Mentorluk', active: true },
                      { text: 'Canlı Sesli Sohbet', active: true },
                      { text: 'Öncelikli Destek & Danışmanlık', active: true },
                    ].map((item, i) => (
                      <li key={i} className={cn("flex items-center gap-3 text-sm", item.active ? "text-zinc-300" : "text-zinc-600")}>
                        {item.active ? <Check className="w-4 h-4 text-amber-500" /> : <X className="w-4 h-4" />}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => window.open('https://www.shopier.com/bitlisstudyo/44761166', '_blank')}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
                  >
                    Pro'ya Geç
                  </button>
                </div>
              </div>

              {/* License Activation Section */}
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
                <div className="pt-4 border-t border-white/5 text-center">
                  <button onClick={handleRequestLicense} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 mx-auto">
                    <Mail className="w-3 h-3" />
                    Lisans Talebi İçin E-posta Gönder
                  </button>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="text-center">
                <button 
                  onClick={() => handleModeChange('FAQ')}
                  className="text-zinc-500 hover:text-zinc-300 text-sm font-bold flex items-center gap-2 mx-auto transition-all"
                >
                  Daha fazla bilgi mi lazım? SSS sayfasını ziyaret et
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : mode === 'FAQ' ? (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-24 lg:pb-8">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => handleModeChange('PROJECT_GEN')} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-display font-bold">Sıkça Sorulan Sorular</h2>
              </div>

              <div className="space-y-4">
                {[
                  { q: "DeneyapAI nedir?", a: "DeneyapAI, Bitlis Deneyap Atölyeleri öğrencileri ve teknoloji meraklıları için geliştirilmiş, Deneyap Kart ve setleri konusunda uzmanlaşmış bir yapay zeka mentordur. Proje fikirleri üretir, kod hatalarını ayıklar ve teknik rehberlik sunar." },
                  { q: "Uygulama ücretli mi?", a: "Uygulamanın temel özellikleri tamamen ücretsizdir. Ancak API maliyetlerini karşılamak ve sistemi sürdürülebilir kılmak için günlük mesaj limitleri bulunmaktadır. Pro ve Basit üyelikler ile bu limitleri artırabilirsiniz." },
                  { q: "Lisans kodumu nasıl alırım?", a: "Lisans kodlarını Shopier mağazamızdan satın alabilirsiniz. Satın alım sonrası kodunuz otomatik olarak e-posta adresinize gönderilir. Ayrıca Bitlis Stüdyo ekibiyle doğrudan iletişime geçerek de talep edebilirsiniz." },
                  { q: "Verilerim güvende mi?", a: "Evet, gizliliğiniz bizim için önceliklidir. Profil bilgileriniz ve geçmişiniz tamamen tarayıcınızın yerel depolamasında (LocalStorage) saklanır. Yapay zeka ile paylaşılan veriler sadece yanıt üretmek için kullanılır ve reklam amaçlı paylaşılmaz." },
                  { q: "Hangi dilleri destekliyor?", a: "DeneyapAI Türkçe dilinde optimize edilmiştir. Kodlama tarafında ise C++, Python, Arduino ve Blok tabanlı kodlama dillerinde uzman desteği sunar." },
                  { q: "Bitlis Stüdyo nedir?", a: "Bitlis Stüdyo, Bitlis'te teknoloji ve yazılım alanında projeler geliştiren, gençlerin teknolojiye erişimini kolaylaştırmayı amaçlayan bir inovasyon ekibidir." }
                ].map((item, i) => (
                  <div key={i} className="glass p-6 rounded-3xl border border-white/5 space-y-3">
                    <h4 className="text-lg font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      {item.q}
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed pl-11">{item.a}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-dashed border-white/10 text-center space-y-4">
                <h4 className="font-bold">Başka bir sorun mu var?</h4>
                <p className="text-zinc-500 text-sm">Bize her zaman ulaşabilirsin. Ekibimiz sana yardımcı olmaktan mutluluk duyacaktır.</p>
                <button 
                  onClick={() => window.location.href = 'mailto:imranyesildag123@gmail.com'}
                  className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all"
                >
                  Destek Ekibine Yaz
                </button>
              </div>
            </div>
          ) : mode === 'PRIVACY' ? (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-24 lg:pb-8">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => handleModeChange('PROJECT_GEN')} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-display font-bold">Gizlilik Politikası</h2>
              </div>

              <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <ShieldCheck className="text-emerald-400 w-6 h-6" />
                    </div>
                    1. Veri Toplama
                  </h3>
                  <p>DeneyapAI, kullanıcı deneyimini iyileştirmek ve kişiselleştirilmiş mentorluk sunmak amacıyla adınız, teknoloji seviyeniz ve uygulama içi geçmişinizi toplar. Bu veriler tamamen yerel olarak (LocalStorage) cihazınızda saklanır.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Cpu className="text-blue-400 w-6 h-6" />
                    </div>
                    2. AI ve Üçüncü Taraflar
                  </h3>
                  <p>Sorularınız, yanıt üretilmesi amacıyla Google Gemini API'sine gönderilir. Bu süreçte kişisel verileriniz (adınız vb.) anonimleştirilerek veya sadece bağlam sağlamak amacıyla kullanılır. Verileriniz reklam amaçlı üçüncü taraflarla paylaşılmaz.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <CreditCard className="text-amber-400 w-6 h-6" />
                    </div>
                    3. Premium ve Ödemeler
                  </h3>
                  <p>Premium üyelik için kullanılan lisans kodları ve aktivasyon bilgileri, sistem güvenliği ve hak sahipliği doğrulaması için Bitlis Stüdyo sunucularında (varsa) veya yerel olarak doğrulanır. Ödeme bilgileri doğrudan Bitlis Stüdyo ile iletişime geçilerek manuel olarak yönetilir.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Trash2 className="text-red-400 w-6 h-6" />
                    </div>
                    4. Kullanıcı Hakları
                  </h3>
                  <p>Uygulama içindeki "Verileri Sıfırla" seçeneğini kullanarak cihazınızda saklanan tüm verileri dilediğiniz zaman silebilirsiniz. Bu işlem geri alınamaz.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="text-zinc-400 w-6 h-6" />
                    </div>
                    5. İletişim
                  </h3>
                  <p>Gizlilik politikamız hakkında sorularınız için imranyesildag123@gmail.com adresi üzerinden bizimle iletişime geçebilirsiniz.</p>
                </section>

                <div className="pt-8 border-t border-white/5 text-center text-xs text-zinc-500 italic">
                  Son Güncelleme: 28 Şubat 2026 | Bitlis Stüdyo, Bitlis.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12 pb-24 lg:pb-8">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => handleModeChange('PROJECT_GEN')} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-display font-bold">Hizmet Şartları</h2>
              </div>

              <div className="prose prose-invert max-w-none space-y-8 text-zinc-400">
                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    1. Genel Kullanım
                  </h3>
                  <p>DeneyapAI, eğitim ve teknoloji geliştirme amaçlı bir platformdur. Kullanıcılar, sistemi yasalara ve etik kurallara uygun şekilde kullanmayı taahhüt eder. Sistemin kötüye kullanılması durumunda Bitlis Stüdyo erişimi kısıtlama hakkını saklı tutar.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-400" />
                    2. Lisans ve Üyelik
                  </h3>
                  <p>Satın alınan lisans kodları kişiye özeldir ve devredilemez. Bir lisans kodu sadece bir hesap/cihaz aktivasyonu için geçerlidir. Lisans kodlarının izinsiz paylaşımı veya satışı üyeliğin iptaline neden olabilir.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    3. Sorumluluk Reddi
                  </h3>
                  <p>DeneyapAI bir yapay zeka modelidir ve sağladığı yanıtlar her zaman %100 doğru olmayabilir. Özellikle donanım projelerinde (elektrik, devre vb.) yapay zekadan alınan bilgileri uygulamadan önce teknik dökümanlardan teyit etmeniz önerilir. Oluşabilecek donanım hasarlarından Bitlis Stüdyo sorumlu tutulamaz.</p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    4. Fikri Mülkiyet
                  </h3>
                  <p>Uygulama arayüzü, logosu ve Bitlis Stüdyo tarafından geliştirilen özel algoritmalar Bitlis Stüdyo'nun fikri mülkiyetidir. İzinsiz kopyalanması veya ticari amaçla kullanılması yasaktır.</p>
                </section>

                <div className="pt-8 border-t border-white/5 text-center text-xs text-zinc-500 italic">
                  Son Güncelleme: 4 Mart 2026 | Bitlis Stüdyo, Bitlis.
                </div>
              </div>
            </div>
          )
        ) : activeTab === 'history' ? (
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
              )
            }
          </div>
        ) : (
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
                {/* Profile Card */}
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
                    <div className="absolute top-0 right-0 p-4">
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
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Hesap Güvenliği</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
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
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-4xl font-display font-bold text-white mb-1">{(profile?.stats as any)?.imagesGenerated || 0}</div>
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Üretilen Görsel</div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Bug className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-4xl font-display font-bold text-white mb-1">{(profile?.stats as any)?.bugsFixed || 0}</div>
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Çözülen Hata</div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between group">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-4xl font-display font-bold text-white mb-1">{(profile?.stats as any)?.codeOptimized || 0}</div>
                      <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Kod Optimizasyonu</div>
                    </div>
                  </div>

                  {/* Achievements Section */}
                  <div className="md:col-span-2 glass-card rounded-[2.5rem] p-8">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-8">Başarımlar</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: Star, label: 'Yeni Fatih', active: true },
                        { icon: Zap, label: 'Hızlı Kodcu', active: (profile?.totalQuestions || 0) > 10 },
                        { icon: Award, label: 'Hata Avcısı', active: ((profile?.stats as any)?.bugsFixed || 0) > 5 },
                        { icon: ShieldCheck, label: 'Güvenli Liman', active: profile?.twoFAEnabled }
                      ].map((ach, i) => (
                        <div key={i} className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all",
                          ach.active ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-zinc-900/50 border-white/5 text-zinc-600 grayscale"
                        )}>
                          <ach.icon className="w-6 h-6" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-center">{ach.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Only in Chat Tab) */}
        {activeTab === 'chat' && !['LIVE_VOICE', 'SUBSCRIPTION', 'FAQ', 'TERMS'].includes(mode) && (
          <div className="p-4 md:p-8 pt-0 fixed bottom-0 left-0 right-0 lg:relative bg-zinc-950/80 backdrop-blur-lg lg:bg-transparent z-20">
            {isLimitReached ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto glass-card border-amber-500/20 rounded-[2.5rem] p-10 text-center mb-8"
              >
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-3">Günlük Limitine Ulaştın!</h3>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-8">
                  Geleceğin teknoloji fatihi, bugünlük zeka kapasitemizi doldurdun! API maliyetlerini dengelemek için sınırlı kontenjan kullanıyoruz.
                </p>
                {profile?.subscriptionTier !== 'PRO' && (
                  <button 
                    onClick={() => handleModeChange('SUBSCRIPTION')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs"
                  >
                    {profile?.subscriptionTier === 'BASIC' ? 'Pro\'ya Yükselt ve Sınırları Kaldır' : 'Premium\'a Geç ve Sınırları Kaldır'}
                  </button>
                )}
              </motion.div>
            ) : (
              <form 
                onSubmit={handleSubmit}
                className="relative max-w-4xl mx-auto group"
              >
                {/* Quick Actions */}
                <div className="absolute -top-16 left-0 right-0 flex gap-2 overflow-x-auto pb-4 px-2 no-scrollbar">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        setMode(action.mode as AppMode);
                        setInput(action.text);
                      }}
                      className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
                    >
                      <action.icon className="w-3 h-3" />
                      {action.text}
                    </button>
                  ))}
                </div>

                {/* Input Container */}
                <div className="relative glass border border-white/10 rounded-[2.5rem] p-2 shadow-2xl focus-within:border-emerald-500/50 transition-all">
                  {profile?.subscriptionTier !== 'PRO' && (
                    <div className="absolute -top-12 right-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full cursor-pointer hover:bg-amber-500/20 transition-all" onClick={() => handleModeChange('SUBSCRIPTION')}>
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Pro'ya Geç ve Sınırları Kaldır</span>
                    </div>
                  )}
                  <div className="absolute -top-4 left-8 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Mod: {mode === 'PROJECT_GEN' ? 'Proje Üretici' : 
                            mode === 'DEBUGGER' ? 'Hata Ayıklayıcı' :
                            mode === 'AI_OPTIMIZER' ? 'Kod Optimizasyonu' :
                            mode === 'ROADMAP_GEN' ? 'Yol Haritası' :
                            mode === 'COMPONENT_LIB' ? 'Bileşen Kütüphanesi' :
                            mode === 'COMMUNITY_PROJS' ? 'Topluluk' :
                            mode === 'IMAGE_GEN' ? 'Görsel Üretici' :
                            mode === 'DAILY_CHALLENGE' ? 'Günün Görevi' :
                            mode === 'TECH_NEWS' ? 'Teknoloji Haberleri' :
                            'Uzman Mentor'}
                    </span>
                  </div>

                  <div className="flex items-end gap-2">
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
                        "DeneyapAI'ya bir soru sor..."
                      }
                      className="w-full bg-transparent border-none rounded-[2rem] p-6 pr-32 focus:outline-none transition-all min-h-[80px] max-h-[300px] resize-none text-sm md:text-base font-medium placeholder:text-zinc-600 custom-scrollbar"
                      rows={1}
                    />
                    
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={cn(
                          "p-3.5 rounded-2xl transition-all",
                          isListening ? "bg-red-500 text-white animate-pulse" : "text-zinc-500 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      
                      <button 
                        type="submit"
                        disabled={!input.trim() || isLoading || cooldown > 0}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group/btn"
                      >
                        {cooldown > 0 ? (
                          <span className="text-xs font-black">{cooldown}</span>
                        ) : (
                          <Send className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => handleModeChange('FAQ')} className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-bold">SSS</button>
                <button onClick={() => handleModeChange('TERMS')} className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-bold">Şartlar</button>
                <button onClick={() => handleModeChange('PRIVACY')} className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-bold">Gizlilik</button>
              </div>
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
            className="fixed inset-0 z-[200] bg-zinc-950"
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
        {profile?.subscriptionTier !== 'PRO' ? (
          <button 
            onClick={() => handleModeChange('SUBSCRIPTION')}
            className="flex flex-col items-center gap-1 text-amber-500 animate-pulse"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Pro'ya Geç</span>
          </button>
        ) : (
          <button 
            onClick={() => { setMode('DEBUGGER'); setActiveTab('chat'); }}
            className={cn("flex flex-col items-center gap-1", mode === 'DEBUGGER' && activeTab === 'chat' ? "text-blue-400" : "text-zinc-500")}
          >
            <Bug className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Debug</span>
          </button>
        )}
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

      {/* Privacy Modal */}
      <AnimatePresence>
        {/* Notification Toast */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
          <AnimatePresence>
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
