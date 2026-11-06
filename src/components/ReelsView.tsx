import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reel } from '../types';
import { Play, Eye, X, ArrowUpRight } from 'lucide-react';

interface ReelsViewProps {
  reels: Reel[];
  instagramHandle: string;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ reels, instagramHandle }) => {
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  return (
    <div className="space-y-4">
      {/* Instagram Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 p-4 rounded-3xl text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
            <i className="fa-brands fa-instagram text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Instagram Reels
            </span>
            <h3 className="font-black text-sm sm:text-base mt-0.5">@{instagramHandle}</h3>
            <p className="text-[11px] text-white/90">فيديوهات واستعراضات أحدث الأجهزة الذكية</p>
          </div>
        </div>

        <a
          href={`https://instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-white text-slate-900 rounded-full text-xs font-black hover:bg-slate-100 transition shadow flex items-center gap-1 cursor-pointer"
        >
          <span>متابعة</span>
          <ArrowUpRight size={13} />
        </a>
      </div>

      {/* Vertical Video Cards Grid (9:16 aspect ratio feel) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {reels.map((reel, idx) => (
          <motion.div
            key={reel.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            onClick={() => setActiveReel(reel)}
            className="relative rounded-3xl overflow-hidden h-60 bg-slate-900 shadow-sm group cursor-pointer border border-slate-100"
          >
            {/* Thumbnail */}
            <img
              src={reel.thumbnail}
              alt={reel.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80';
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-between p-3 text-white">
              {/* Top View Counter & Instagram Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  <Eye size={11} className="text-pink-400" />
                  <span>{reel.views}</span>
                </span>
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Play size={12} className="fill-white" />
                </div>
              </div>

              {/* Bottom Title & Product Tag */}
              <div>
                <p className="text-xs font-black line-clamp-2 leading-snug drop-shadow-md">
                  {reel.title}
                </p>
                {reel.productTitle && (
                  <span className="text-[10px] text-amber-300 font-bold block truncate mt-1">
                    📱 {reel.productTitle}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {activeReel && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10 text-white">
                <span className="text-xs font-black truncate max-w-[200px]">
                  {activeReel.title}
                </span>
                <button
                  onClick={() => setActiveReel(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="relative h-96 bg-black flex items-center justify-center">
                <video
                  src={
                    activeReel.videoUrl ||
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                  }
                  controls
                  autoPlay
                  playsInline
                  loop
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 bg-slate-950 flex items-center justify-between text-white">
                <span className="text-[11px] text-slate-400 font-bold">
                  مشاهدات: {activeReel.views}
                </span>
                {activeReel.instagramUrl && (
                  <a
                    href={activeReel.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-pink-400 hover:underline flex items-center gap-1"
                  >
                    <span>فتح في إنستغرام</span>
                    <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
