import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenFilter: () => void;
  onLogoClick: () => void;
  activeFilterCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenFilter,
  onLogoClick,
  activeFilterCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 pt-3.5 pb-2.5 border-b border-purple-50/70 shadow-sm transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left Action: Filter Trigger */}
        <button
          onClick={onOpenFilter}
          className="relative w-10 h-10 bg-slate-100 hover:bg-purple-50 rounded-2xl flex items-center justify-center text-slate-700 transition active:scale-95 shadow-sm cursor-pointer border border-slate-200/50"
          title="فلترة وترتيب الأجهزة"
        >
          <SlidersHorizontal size={17} className="text-purple-700" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Center: 716XSTOR Brand Logo */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="text-right">
            <div className="flex items-center gap-1 font-black text-base sm:text-lg tracking-tight text-slate-900 font-mono">
              <span className="text-amber-500 font-black">716</span>XSTOR
            </div>
            <p className="text-[9px] font-extrabold text-purple-700 -mt-1 tracking-normal">
              متجر الإلكترونيات المعتمد
            </p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-tr from-purple-700 via-indigo-600 to-amber-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md rotate-2">
            716
          </div>
        </div>

        {/* Right side spacer to keep perfect symmetry (Admin button removed) */}
        <div className="w-10 h-10 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="المعرض متاح للعرض" />
        </div>
      </div>

      {/* Clean Search Bar */}
      <div className="mt-2.5 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن هاتف، لابتوب، ماوس، شاحن، سماعة..."
          className="w-full bg-slate-100 text-slate-800 text-xs rounded-full py-2.5 pr-4 pl-10 border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition shadow-inner font-medium placeholder:text-slate-400"
        />
        <div className="absolute left-3.5 top-2.5 flex items-center gap-1.5 text-slate-400">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <Search size={15} />
        </div>
      </div>
    </header>
  );
};
