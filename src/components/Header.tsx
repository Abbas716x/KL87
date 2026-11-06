import React from 'react';
import { Search, SlidersHorizontal, ShieldCheck, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenFilter: () => void;
  onOpenAdmin: () => void;
  onLogoClick: () => void;
  activeFilterCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenFilter,
  onOpenAdmin,
  onLogoClick,
  activeFilterCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 pt-3.5 pb-2.5 border-b border-purple-50/70 shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Left Action: Filter Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenFilter}
            className="relative w-10 h-10 bg-slate-100 hover:bg-purple-50 rounded-full flex items-center justify-center text-slate-700 transition active:scale-95 shadow-sm cursor-pointer"
            title="فلترة وترتيب"
          >
            <SlidersHorizontal size={17} className="text-purple-700" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="text-right">
            <div className="flex items-center gap-1 font-black text-sm sm:text-base tracking-tight text-slate-800">
              <span className="text-amber-500 font-black text-lg">B</span> BRAND STORE
            </div>
            <p className="text-[9px] font-extrabold text-purple-700 -mt-0.5">
              متجر الإلكترونيات المعتمد
            </p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm rotate-2">
            B
          </div>
        </div>

        {/* Right: Admin Button */}
        <button
          onClick={onOpenAdmin}
          className="w-10 h-10 bg-amber-50 hover:bg-amber-100 rounded-full border border-amber-200/80 flex items-center justify-center text-amber-600 transition active:scale-95 shadow-sm cursor-pointer"
          title="لوحة تحكم الأدمن"
        >
          <ShieldCheck size={18} />
        </button>
      </div>

      {/* Clean Search Bar */}
      <div className="mt-2.5 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن آيفون، لابتوب، شاحن، سماعة..."
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
