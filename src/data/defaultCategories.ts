import { CategoryItem } from '../types';

export const defaultCategories: CategoryItem[] = [
  {
    id: 'phones',
    name: 'الهواتف المحمولة',
    nameEn: 'Smartphones',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-amber-500/20 via-orange-400/20 to-amber-600/10',
    accentColor: '#F59E0B',
    description: 'آيفون، سامسونج، شاومي، هواوي، هونر',
    icon: 'Smartphone'
  },
  {
    id: 'laptops',
    name: 'الحواسيب واللابتوبات',
    nameEn: 'Laptops & PCs',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-blue-500/20 via-indigo-400/20 to-blue-600/10',
    accentColor: '#3B82F6',
    description: 'MacBook, ROG, MSI, Legion, Dell',
    icon: 'Laptop'
  },
  {
    id: 'chairs',
    name: 'كراسي وطاولات قيمنق',
    nameEn: 'Gaming Chairs & Desks',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-rose-500/20 via-red-400/20 to-rose-600/10',
    accentColor: '#F43F5E',
    description: 'DXRacer, Furgle, Cougar, Secretlab',
    icon: 'Armchair'
  },
  {
    id: 'gaming',
    name: 'أجهزة ألعاب وقيمنق',
    nameEn: 'Gaming Consoles',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-purple-500/20 via-violet-400/20 to-indigo-600/10',
    accentColor: '#8B5CF6',
    description: 'PlayStation 5, Xbox Series X, Nintendo Switch',
    icon: 'Gamepad2'
  },
  {
    id: 'audio',
    name: 'سماعات وصوتيات',
    nameEn: 'Audio & Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-emerald-500/20 via-teal-400/20 to-emerald-600/10',
    accentColor: '#10B981',
    description: 'Sony, JBL, Bose, Beats, Soundcore',
    icon: 'Headphones'
  },
  {
    id: 'chargers',
    name: 'شواحن وبنوك طاقة',
    nameEn: 'Chargers & Power Banks',
    image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-yellow-500/20 via-amber-400/20 to-orange-500/10',
    accentColor: '#EAB308',
    description: 'Anker GaN, Baseus, Ugreen, Momax',
    icon: 'Zap'
  },
  {
    id: 'accessories',
    name: 'ملحقات واكسسوارات',
    nameEn: 'Accessories & Peripherals',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-violet-500/20 via-fuchsia-400/20 to-purple-600/10',
    accentColor: '#A855F7',
    description: 'Logitech, Razer, Corsair, WiWU, Yesido',
    icon: 'Mouse'
  },
  {
    id: 'monitors',
    name: 'الشاشات والتلفزيونات',
    nameEn: 'Monitors & Displays',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-cyan-500/20 via-sky-400/20 to-blue-600/10',
    accentColor: '#06B6D4',
    description: 'Samsung Odyssey, MSI, LG OLED, Asus ROG',
    icon: 'Monitor'
  },
  {
    id: 'cameras',
    name: 'الكاميرات والمراقبة',
    nameEn: 'Cameras & Security',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
    gradient: 'from-slate-500/20 via-stone-400/20 to-slate-600/10',
    accentColor: '#64748B',
    description: 'Sony Alpha, Canon, DJI, كاميرات حماية ومراقبة',
    icon: 'Camera'
  }
];
