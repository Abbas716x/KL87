import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Store,
  Cpu,
  Share2,
  Check,
  CheckCircle2
} from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `${product.title} - ${product.price.toLocaleString('en-US')} د.ع لدى 716XSTOR`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${product.title}\nالسعر: ${product.price.toLocaleString('en-US')} د.ع\nالمعرض: 716XSTOR`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const specsList = Object.entries(product.specs || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-20"
    >
      {/* Sticky Top Bar with Back Button */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md -mx-3.5 px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs transition cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowRight size={16} />
          <span>رجوع للكتالوج</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
            title="مشاركة تفاصيل الجهاز"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
          </button>
          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>متوفر بصالة العرض</span>
          </span>
        </div>
      </div>

      {/* Main Image Showcase Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col items-center">
        <div className="w-full h-64 sm:h-72 rounded-2xl bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-3 relative overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="max-h-full max-w-full object-contain drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80';
            }}
          />
          {product.badge && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        {/* Brand & Title */}
        <div className="w-full mt-4 text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-50 text-purple-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-purple-100">
              {product.brand}
            </span>
            {product.discountText && (
              <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {product.discountText}
              </span>
            )}
          </div>
          <h1 className="font-black text-base sm:text-xl text-slate-800 leading-snug">
            {product.title}
          </h1>
          {product.titleEn && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{product.titleEn}</p>
          )}
        </div>

        {/* Price & Official Warranty Summary Box */}
        <div className="w-full mt-4 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-bold text-slate-500 block">
              السعر المعتمد بالدينار العراقي:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-purple-700">
                {product.price.toLocaleString('en-US')} د.ع
              </span>
              {product.oldPrice && product.oldPrice !== product.price && (
                <span className="text-xs text-slate-400 line-through font-bold">
                  {product.oldPrice.toLocaleString('en-US')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <ShieldCheck size={16} />
            <span>{product.warranty || 'ضمان وكالة رسمي'}</span>
          </div>
        </div>
      </div>

      {/* Showroom Status & Inspection Notice (Pure Catalog) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
          <Store size={20} />
        </div>
        <div>
          <h4 className="font-black text-xs text-slate-800">
            صالة عرض وفحص الأجهزة المعتمدة - 716XSTOR
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {product.showroomLocation || 'العراق - بغداد - صالة العرض الرئيسية'} • فحص العتاد وتجربة الجهاز مباشرة
          </p>
        </div>
      </div>

      {/* Full Technical Specifications Sheet */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
        <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Cpu size={17} className="text-purple-600" />
          <span>المواصفات التقنية الدقيقة (Specifications):</span>
        </h3>

        {specsList.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {specsList.map(([key, value], idx) => (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between gap-3 text-right"
              >
                <span className="font-bold text-slate-400 w-1/3">{key}</span>
                <span className="font-black text-slate-800 flex-1">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2">لا توجد تفاصيل إضافية مسجلة لهذا الجهاز.</p>
        )}
      </div>

      {/* Return Button */}
      <button
        onClick={onBack}
        className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-2"
      >
        <ArrowRight size={15} />
        <span>العودة لتصفح أجهزة الكتالوج</span>
      </button>
    </motion.div>
  );
};
