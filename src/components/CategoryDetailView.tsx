import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryItem, Product, BrandItem } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';

interface CategoryDetailViewProps {
  category: CategoryItem;
  products: Product[];
  brands: BrandItem[];
  onBack: () => void;
  onViewProduct: (product: Product) => void;
}

export const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
  category,
  products,
  brands,
  onBack,
  onViewProduct
}) => {
  // Brand selection state ('all' or specific brand name)
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Filter products belonging to this category
  const categoryProducts = useMemo(() => {
    return products.filter(
      (p) => p.category.toLowerCase() === category.id.toLowerCase()
    );
  }, [products, category.id]);

  // Derive unique brands available in this category
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    categoryProducts.forEach((p) => {
      if (p.brand) brandSet.add(p.brand);
    });

    // Also include any brands explicitly mapped in brands data
    brands.forEach((b) => {
      if (b.categoryIds?.includes(category.id)) {
        brandSet.add(b.name);
      }
    });

    return Array.from(brandSet);
  }, [categoryProducts, brands, category.id]);

  // Filter products by selected brand
  const filteredProducts = useMemo(() => {
    if (selectedBrand === 'all') return categoryProducts;
    return categoryProducts.filter(
      (p) => p.brand.toLowerCase() === selectedBrand.toLowerCase()
    );
  }, [categoryProducts, selectedBrand]);

  return (
    <div className="space-y-4">
      {/* Category Header with Back Button */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
            title="رجوع للأصناف"
          >
            <ArrowRight size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-purple-600 font-bold">قسم:</span>
              <h2 className="font-black text-slate-800 text-base">{category.name}</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-bold">
              {filteredProducts.length} أجهزة متاحة • حدد الشركة لتصفية الموديلات
            </p>
          </div>
        </div>

        {/* Small Category Thumbnail */}
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center">
          <img
            src={category.image}
            alt={category.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>

      {/* TOP-RIGHT ALIGNED HORIZONTAL BRAND FILTER PILLS BAR */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
            <Layers size={13} className="text-purple-600" />
            <span>تصفية حسب الشركة (Brand Pills):</span>
          </span>
          <span className="text-[10px] text-purple-600 font-bold">
            {availableBrands.length} شركات
          </span>
        </div>

        {/* Scrollable Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* "All" Pill */}
          <button
            onClick={() => setSelectedBrand('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1.5 ${
              selectedBrand === 'all'
                ? 'bg-purple-600 text-white shadow-purple-600/25 scale-[1.02]'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Sparkles size={13} />
            <span>الكل ({categoryProducts.length})</span>
          </button>

          {/* Individual Brand Pills */}
          {availableBrands.map((brand) => {
            const isSelected = selectedBrand.toLowerCase() === brand.toLowerCase();
            const count = categoryProducts.filter(
              (p) => p.brand.toLowerCase() === brand.toLowerCase()
            ).length;

            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-purple-600/25 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{brand}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Products Grid with AnimatePresence */}
      <AnimatePresence mode="popLayout">
        {filteredProducts.length > 0 ? (
          <motion.div
            key={selectedBrand}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewProduct}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2"
          >
            <Layers size={36} className="mx-auto text-slate-300" />
            <h4 className="font-black text-xs sm:text-sm text-slate-800">
              لا توجد أجهزة متوفرة حالياً لشركة {selectedBrand} في قسم {category.name}
            </h4>
            <button
              onClick={() => setSelectedBrand('all')}
              className="mt-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-black hover:bg-purple-100 transition"
            >
              عرض جميع أجهزة القسم
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
