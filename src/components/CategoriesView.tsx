import React from 'react';
import { motion } from 'motion/react';
import { CategoryItem, Product } from '../types';
import { ArrowLeft, Sparkles, Layers } from 'lucide-react';

interface CategoriesViewProps {
  categories: CategoryItem[];
  products: Product[];
  onSelectCategory: (category: CategoryItem) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  products,
  onSelectCategory
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500" />
            <span>أقسام وإلكترونيات 716XSTOR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            اختر القسم للاطلاع على أحدث الأجهزة والمواصفات المعتمدة
          </p>
        </div>
        <span className="bg-purple-50 text-purple-700 font-black text-xs px-2.5 py-1 rounded-full border border-purple-100">
          {categories.length} أقسام
        </span>
      </div>

      {/* Dynamic Grid: Artistic Wave Category Cards (مطابقة النمط الفني الجميل) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5">
        {categories.map((cat, idx) => {
          const count = products.filter(
            (p) => p.category.toLowerCase() === cat.id.toLowerCase()
          ).length;

          const accentColor = cat.accentColor || '#6366F1';

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => onSelectCategory(cat)}
              className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-100/90 shadow-sm hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Category Top Bar: Title & Count */}
              <div className="flex items-start justify-between mb-2 z-20">
                <div className="min-w-0 pr-1">
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-purple-700 transition leading-snug truncate">
                    {cat.name}
                  </h3>
                  {cat.nameEn && (
                    <span className="text-[10px] text-slate-400 font-mono block truncate -mt-0.5">
                      {cat.nameEn}
                    </span>
                  )}
                </div>

                <div className="w-6 h-6 rounded-full bg-slate-50 group-hover:bg-purple-600 group-hover:text-white text-slate-400 flex items-center justify-center transition shadow-sm flex-shrink-0">
                  <ArrowLeft size={12} />
                </div>
              </div>

              {/* ARTISTIC WAVE STAGE: Organic Wave Shape with Floating Product Image */}
              <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden flex items-end justify-center my-1 select-none">
                {/* 1. Subtle Radial Ambient Lighting */}
                <div
                  className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${accentColor}33 0%, transparent 75%)`
                  }}
                />

                {/* 2. Abstract Geometric Ambient Circles */}
                <div
                  className="absolute top-2 right-2 w-16 h-16 rounded-full blur-md opacity-30 pointer-events-none"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="absolute top-5 left-3 w-10 h-10 rounded-full bg-amber-400/20 blur-sm pointer-events-none" />

                {/* 3. The Artistic Wave (Curved Wave Shape Background) */}
                <svg
                  className="absolute bottom-0 left-0 right-0 w-full h-24 text-slate-50 transition-transform duration-500 group-hover:scale-105"
                  viewBox="0 0 300 120"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id={`wave-grad-${cat.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                      <stop offset="50%" stopColor={accentColor} stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id={`wave-accent-${cat.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Secondary Back Wave for Depth */}
                  <path
                    d="M0 60 C80 90, 160 30, 300 65 L300 120 L0 120 Z"
                    fill={`url(#wave-accent-${cat.id})`}
                  />

                  {/* Primary Foreground Wave */}
                  <path
                    d="M0 45 C70 15, 180 80, 300 35 L300 120 L0 120 Z"
                    fill={`url(#wave-grad-${cat.id})`}
                  />
                </svg>

                {/* 4. Device Product Cutout Image sitting prominently above the wave */}
                <div className="relative z-10 w-full h-full p-2 flex items-center justify-center group-hover:scale-108 group-hover:-translate-y-1 transition-all duration-300">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain drop-shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                </div>
              </div>

              {/* Bottom Footer: Device Count & Explore Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[10px]">
                <span className="font-bold text-slate-500 flex items-center gap-1">
                  <Layers size={11} className="text-purple-600" />
                  <span>{count > 0 ? `${count} جهاز معتمد` : 'موديلات حصرية'}</span>
                </span>

                <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition">
                  استعراض
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
