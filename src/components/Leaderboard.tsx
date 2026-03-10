import React from 'react';
import { Trophy, Crown, Medal, Lock, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface LeaderboardUser {
  id: string;
  name: string;
  score: number;
  level: string;
  avatar?: string;
}

const MOCK_LEADERBOARD: LeaderboardUser[] = [
  { id: '1', name: 'Ahmet Yılmaz', score: 12500, level: 'İleri' },
  { id: '2', name: 'Ayşe Demir', score: 11200, level: 'İleri' },
  { id: '3', name: 'Mehmet Can', score: 9800, level: 'Orta' },
  { id: '4', name: 'Fatma Kaya', score: 8500, level: 'Orta' },
  { id: '5', name: 'Caner Öz', score: 7200, level: 'Başlangıç' },
  { id: '6', name: 'Selin Ak', score: 6500, level: 'Başlangıç' },
  { id: '7', name: 'Burak Yılmaz', score: 5800, level: 'Başlangıç' },
  { id: '8', name: 'Ece Aydın', score: 4900, level: 'Başlangıç' },
];

interface LeaderboardProps {
  profile: UserProfile | null;
  onUpgrade: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ profile, onUpgrade }) => {
  const isPro = profile?.subscriptionTier === 'PRO';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest"
        >
          <Trophy className="w-3 h-3" />
          DeneyapAI Şampiyonlar Ligi
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
          Puan Tablosu
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Bitlis Deneyap Atölyeleri'nin en başarılı geliştiricileri arasında yerini al.
        </p>
      </div>

      <div className="relative bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-bottom border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Sıra</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Kullanıcı</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Puan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Seviye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_LEADERBOARD.map((user, index) => {
                const isBlurred = !isPro && index >= 2;
                
                return (
                  <tr 
                    key={user.id} 
                    className={`group transition-colors hover:bg-white/5 ${isBlurred ? 'relative' : ''}`}
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        {index === 0 ? (
                          <Crown className="w-5 h-5 text-amber-400" />
                        ) : index === 1 ? (
                          <Medal className="w-5 h-5 text-zinc-300" />
                        ) : index === 2 ? (
                          <Medal className="w-5 h-5 text-amber-700" />
                        ) : (
                          <span className="text-zinc-500 font-mono text-sm">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className={`flex items-center gap-4 transition-all duration-500 ${isBlurred ? 'blur-md select-none' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-xs text-zinc-500">@{user.name.toLowerCase().replace(' ', '')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className={`text-white font-mono font-bold transition-all duration-500 ${isBlurred ? 'blur-md select-none' : ''}`}>
                        {user.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-500 ${
                        user.level === 'İleri' ? 'bg-emerald-500/10 text-emerald-500' :
                        user.level === 'Orta' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-zinc-500/10 text-zinc-500'
                      } ${isBlurred ? 'blur-md select-none' : ''}`}>
                        {user.level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isPro && (
          <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent flex flex-col items-center justify-end pb-12 px-6 text-center">
            <div className="space-y-6 max-w-sm">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Tüm Sıralamayı Gör</h3>
                <p className="text-sm text-zinc-400">
                  DeneyapAI Pro'ya geçerek tüm şampiyonları gör ve kendi sıralamanı takip et.
                </p>
              </div>
              <button
                onClick={onUpgrade}
                className="w-full group flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-4 h-4 fill-current" />
                Pro'ya Yükselt
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Senin Sıran</p>
          <p className="text-3xl font-display font-bold text-white">#124</p>
          <p className="text-xs text-zinc-400">En iyi %15 içindesin</p>
        </div>
        <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Toplam Puan</p>
          <p className="text-3xl font-display font-bold text-emerald-400">2,450</p>
          <p className="text-xs text-zinc-400">Bu hafta +450 puan</p>
        </div>
        <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rozetler</p>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-zinc-400">2 yeni rozet kazandın</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
