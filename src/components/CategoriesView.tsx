import React from 'react';
import { motion } from 'motion/react';
import { CategoryItem, Product } from '../types';
import { ArrowLeft, Sparkles } from 'lucide-react';

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
            <span>تصفح أصناف الإلكترونيات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            اختر القسم للاطلاع على أجهزة وشركات التكنولوجيا المعتمدة
          </p>
        </div>
        <span className="bg-purple-50 text-purple-700 font-black text-xs px-2.5 py-1 rounded-full border border-purple-100">
          {categories.length} أصناف
        </span>
      </div>

      {/* Dynamic Grid: Clean white cards with curved color backdrop behind image */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {categories.map((cat, idx) => {
          const count = products.filter(
            (p) => p.category.toLowerCase() === cat.id.toLowerCase()
          ).length;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => onSelectCategory(cat)}
              className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Image Frame with curved colored gradient backdrop */}
              <div
                className={`relative w-full h-32 rounded-2xl bg-gradient-to-tr ${cat.gradient || 'from-purple-400/20 to-purple-500/10'} p-2.5 overflow-hidden flex items-center justify-center mb-3 group-hover:scale-[1.03] transition-transform duration-300`}
              >
                {/* Curved decorative circle in background */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/40 blur-sm pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/30 blur-sm pointer-events-none" />

                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain drop-shadow relative z-10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>

              {/* Title & Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-800 group-hover:text-purple-600 transition">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {count > 0 ? `${count} جهاز متاح` : cat.description || 'أحدث الموديلات'}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-purple-600 group-hover:text-white text-slate-400 flex items-center justify-center transition shadow-sm">
                  <ArrowLeft size={13} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
