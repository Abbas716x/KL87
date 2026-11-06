import React from 'react';
import { motion } from 'motion/react';
import { Home, Grid, Layers, Play, ShoppingBag } from 'lucide-react';

export type NavTab = 'home' | 'categories' | 'brands' | 'reels' | 'cart';

interface FloatingNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  cartCount: number;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'الرئيسية', icon: Home },
    { id: 'categories' as NavTab, label: 'الأصناف', icon: Grid },
    { id: 'brands' as NavTab, label: 'الماركات', icon: Layers },
    { id: 'reels' as NavTab, label: 'اكتشف', icon: Play },
    { id: 'cart' as NavTab, label: 'السلة', icon: ShoppingBag, badge: cartCount }
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[480px]">
      <div className="floating-bottom-dock rounded-full p-1.5 flex items-center justify-between shadow-2xl border border-purple-100/80 bg-white/90 backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              layout
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`relative flex items-center gap-1.5 py-1.5 transition-all select-none cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white px-3.5 rounded-full shadow-md shadow-purple-600/25'
                  : 'text-slate-500 hover:text-purple-600 p-1.5'
              }`}
            >
              {/* Icon Container: In default state it looks like a clean white circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'text-white'
                    : 'bg-white shadow-sm border border-slate-100 text-slate-600'
                }`}
              >
                <Icon size={17} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              </div>

              {/* Expanding Pill Label: smoothly shows label when active */}
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-black text-xs whitespace-nowrap overflow-hidden pr-0.5"
                >
                  {tab.label}
                </motion.span>
              )}

              {/* Cart Badge */}
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  className={`absolute -top-1 -right-1 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm ${
                    isActive ? 'bg-amber-400 text-slate-900' : 'bg-red-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
