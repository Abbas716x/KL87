import React from 'react';
import { motion } from 'motion/react';
import { BrandItem, Product } from '../types';
import { Award } from 'lucide-react';

interface BrandsViewProps {
  brands: BrandItem[];
  products: Product[];
  onSelectBrand: (brand: BrandItem) => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({
  brands,
  products,
  onSelectBrand
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
            <Award size={17} className="text-amber-500" />
            <span>العلامات التجارية المعتمدة</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تسوق حسب ماركتك المفضلة بضمان وكالة رسمي
          </p>
        </div>
        <span className="bg-purple-50 text-purple-700 font-black text-xs px-2.5 py-1 rounded-full border border-purple-100">
          {brands.length} علامة
        </span>
      </div>

      {/* 4-COLUMN SQUARE BRANDS GRID FOR MOBILE */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
        {brands.map((b, idx) => {
          const deviceCount = products.filter(
            (p) => p.brand.toLowerCase() === b.name.toLowerCase()
          ).length;

          return (
            <motion.div
              key={b.id || b.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelectBrand(b)}
              className="flex flex-col items-center group cursor-pointer select-none"
            >
              {/* Rounded Square Card (ناصع البياض وبدون حدود ثقيلة) */}
              <div className="w-full aspect-square bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex items-center justify-center group-hover:scale-105 duration-200">
                <img
                  src={b.logo}
                  alt={b.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/80/ffffff/6C5CE7?text=${b.name}`;
                  }}
                />
              </div>

              {/* Brand Name Below Square with Overflow Truncation */}
              <div className="mt-1.5 text-center w-full px-0.5">
                <span className="font-black text-[11px] text-slate-800 group-hover:text-purple-600 transition truncate block leading-tight">
                  {b.name}
                </span>
                <span className="text-[9px] text-purple-600 font-bold block truncate">
                  {deviceCount > 0 ? `${deviceCount} جهاز` : 'وكالة'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
