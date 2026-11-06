import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { Plus, Eye, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAddToCart,
  isAdded
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="karada-card p-3 flex flex-col justify-between group"
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
      <div
        onClick={() => onViewDetails(product)}
        className="karada-img-frame h-36 w-full cursor-pointer mb-2.5 p-2 group-hover:scale-[1.02] transition-transform duration-300"
      >
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain drop-shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/200/FAF9FE/6C5CE7?text=BRAND+STORE';
          }}
        />
      </div>

      {/* Info */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onViewDetails(product)}
            className="font-black text-xs text-slate-800 line-clamp-2 leading-snug cursor-pointer hover:text-purple-600 transition"
          >
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
            {product.oldPrice && (
              <span className="text-[10px] text-slate-400 line-through font-bold">
                {product.oldPrice.toLocaleString('en-US')}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: View Details & Add to Cart */}
        <div className="mt-2 pt-2 flex items-center gap-1.5 border-t border-slate-100">
          <button
            onClick={() => onViewDetails(product)}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            <Eye size={12} />
            <span>المواصفات</span>
          </button>

          <button
            onClick={() => onAddToCart(product)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-90 cursor-pointer shadow-sm ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title="إضافة إلى السلة"
          >
            {isAdded ? <Check size={14} className="stroke-[3]" /> : <Plus size={15} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
