import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { Eye, Cpu } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      onClick={() => onViewDetails(product)}
      className="karada-card p-3 flex flex-col justify-between group cursor-pointer"
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
          {product.brand}
        </span>
        {product.discountText ? (
          <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
            {product.discountText}
          </span>
        ) : product.badge ? (
          <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
            {product.badge}
          </span>
        ) : null}
      </div>

      {/* Centered Product Photo Frame */}
      <div className="karada-img-frame h-36 w-full mb-2.5 p-2 group-hover:scale-[1.03] transition-transform duration-300">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80';
          }}
        />
      </div>

      {/* Title & Specs summary */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-black text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-purple-600 transition">
            {product.title}
          </h3>
          {product.titleEn && (
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
              {product.titleEn}
            </p>
          )}
        </div>

        {/* Price in Iraqi Dinars */}
        <div className="pt-1.5 border-t border-slate-100">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-purple-700 font-black text-xs sm:text-sm">
              {product.price.toLocaleString('en-US')} د.ع
            </span>
            {product.oldPrice && product.oldPrice !== product.price && (
              <span className="text-[10px] text-slate-400 line-through font-bold">
                {product.oldPrice.toLocaleString('en-US')}
              </span>
            )}
          </div>
        </div>

        {/* Action Button: View Details (Pure Catalog - No Cart/WhatsApp) */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            className="w-full py-2 px-2 bg-slate-100 group-hover:bg-purple-600 text-slate-700 group-hover:text-white rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <Eye size={13} />
            <span>عرض المواصفات الكاملة</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
