import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Headphones, Waves, X, Mic, MicOff, Volume2, VolumeX, Info, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

interface LiveVoiceViewProps {
  onClose: () => void;
  isPremium: boolean;
}

export default function LiveVoiceView({ onClose, isPremium }: LiveVoiceViewProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; role: 'user' | 'model' }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const startSession = async () => {
    if (!isPremium) {
      setError("Bu özellik sadece Pro üyeler içindir.");
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      // Initialize Audio Context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      // Get Microphone Stream
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Create Processor for PCM encoding
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      sessionRef.current = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Sen Bitlis Deneyap Atölyeleri öğrencisi tarafından geliştirilen bir asistansın. Adın DeneyapAI. Samimi, yardımsever ve teknoloji meraklısı bir dil kullan. Her zaman kendini bu şekilde tanıt. Konuşmaların kısa ve öz olsun. Kullanıcı Deneyap projeleri, robotik, kodlama veya genel teknoloji hakkında sorular sorabilir.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus('active');
            source.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
            
            processorRef.current!.onaudioprocess = (e) => {
              if (isMuted || status !== 'active') return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16 PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              // Base64 encode
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              
              sessionRef.current.sendRealtimeInput({
                media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Interruption
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              return;
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && !isSpeakerOff) {
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }

            // Handle Transcriptions for UI
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setTranscript(prev => [...prev, { text: message.serverContent!.modelTurn!.parts[0].text!, role: 'model' }]);
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
            setStatus('error');
          },
          onclose: () => {
            setStatus('idle');
          }
        }
      });

    } catch (err: any) {
      console.error("Failed to start live session:", err);
      setError(err.message || "Mikrofon erişimi veya bağlantı hatası.");
      setStatus('error');
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    
    const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    source.onended = () => {
      playNextInQueue();
    };
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setStatus('idle');
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] animate-pulse delay-700" />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center gap-12">
        {/* Status Indicator */}
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={status === 'active' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-32 h-32 bg-gradient-to-br from-red-500 to-orange-600 rounded-[40px] flex items-center justify-center shadow-2xl shadow-red-500/20 relative"
          >
            <Radio className="w-16 h-16 text-white" />
            {status === 'active' && (
              <div className="absolute -inset-4 border-2 border-red-500/30 rounded-[50px] animate-ping" />
            )}
          </motion.div>
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Canlı Sesli Sohbet</h2>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
              {status === 'idle' ? 'Başlamak için butona tıkla' : 
               status === 'connecting' ? 'Bağlantı kuruluyor...' : 
               status === 'active' ? 'Seni dinliyorum...' : 'Bir hata oluştu'}
            </p>
          </div>
        </div>

        {/* Waves Visualization */}
        <div className="h-24 flex items-center gap-1">
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={i}
              animate={status === 'active' ? { 
                height: [20, Math.random() * 80 + 20, 20],
                opacity: [0.3, 1, 0.3]
              } : { height: 4, opacity: 0.1 }}
              transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
              className="w-1.5 bg-red-500 rounded-full"
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border",
              isMuted ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-zinc-800 border-white/5 text-zinc-400 hover:text-white"
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {status === 'idle' || status === 'error' ? (
            <button 
              onClick={startSession}
              className="px-12 py-5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center gap-3 group"
            >
              <Zap className="w-5 h-5 group-hover:animate-bounce" />
              Sohbeti Başlat
            </button>
          ) : (
            <button 
              onClick={stopSession}
              className="px-12 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center gap-3"
            >
              <X className="w-5 h-5" />
              Sohbeti Bitir
            </button>
          )}

          <button 
            onClick={() => setIsSpeakerOff(!isSpeakerOff)}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border",
              isSpeakerOff ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-zinc-800 border-white/5 text-zinc-400 hover:text-white"
            )}
          >
            {isSpeakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3"
            >
              <Info className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
            <Radio className="w-5 h-5 text-red-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Anlık Dinleme</h4>
            <p className="text-[11px] text-zinc-400">Konuşmanız bitene kadar mikrofon açık kalır.</p>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
            <Waves className="w-5 h-5 text-emerald-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Akıllı Kesme</h4>
            <p className="text-[11px] text-zinc-400">Siz konuşunca asistan otomatik olarak susar.</p>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
            <Headphones className="w-5 h-5 text-blue-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Doğal Ses</h4>
            <p className="text-[11px] text-zinc-400">Akıcı ve vurgulu insan sesiyle yanıt verir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
