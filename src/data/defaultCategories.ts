import { CategoryItem } from '../types';

export const defaultCategories: CategoryItem[] = [
  {
    id: 'phones',
    name: 'الهواتف المحمولة',
    nameEn: 'Smartphones',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-amber-400/20 via-orange-400/20 to-amber-500/10',
    description: 'آيفون، سامسونج، شاومي، هونر',
    icon: 'Smartphone'
  },
  {
    id: 'laptops',
    name: 'حواسيب ولابتوبات',
    nameEn: 'Laptops & PCs',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-blue-400/20 via-indigo-400/20 to-blue-500/10',
    description: 'MacBook, Legion, ROG, Dell',
    icon: 'Laptop'
  },
  {
    id: 'tablets',
    name: 'أجهزة لوحية وآيباد',
    nameEn: 'Tablets & iPads',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-purple-400/20 via-fuchsia-400/20 to-purple-500/10',
    description: 'iPad Pro, Galaxy Tab, Xiaomi Pad',
    icon: 'Tablet'
  },
  {
    id: 'audio',
    name: 'سماعات وصوتيات',
    nameEn: 'Audio & Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-rose-400/20 via-pink-400/20 to-rose-500/10',
    description: 'Sony, JBL, Anker, Bose',
    icon: 'Headphones'
  },
  {
    id: 'gaming',
    name: 'أجهزة ألعاب وقيمنق',
    nameEn: 'Gaming Consoles',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-emerald-400/20 via-teal-400/20 to-emerald-500/10',
    description: 'PlayStation 5, Xbox, Switch',
    icon: 'Gamepad2'
  },
  {
    id: 'monitors',
    name: 'شاشات قيمنق وعرض',
    nameEn: 'Gaming Monitors',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-cyan-400/20 via-sky-400/20 to-cyan-500/10',
    description: 'MSI, Samsung Odyssey, LG OLED',
    icon: 'Monitor'
  },
  {
    id: 'accessories',
    name: 'ملحقات وشواحن وماوس',
    nameEn: 'Accessories & Power',
    image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-violet-400/20 via-purple-400/20 to-indigo-500/10',
    description: 'Anker GaN, Logitech, Apple Pencil',
    icon: 'Plug'
  },
  {
    id: 'chairs',
    name: 'كراسي وطاولات قيمنق',
    nameEn: 'Gaming Chairs & Desks',
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=400&q=80',
    gradient: 'from-amber-400/20 via-yellow-400/20 to-amber-600/10',
    description: 'DXRacer, Secretlab, Furgle',
    icon: 'Armchair'
  }
];
