import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CartItem, CustomerOrderInfo } from '../types';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle
} from 'lucide-react';

interface CartViewProps {
  cart: CartItem[];
  whatsappNumber: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onContinueShopping: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  whatsappNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping
}) => {
  const [customer, setCustomer] = useState<CustomerOrderInfo>({
    name: '',
    phone: '',
    city: 'بغداد',
    address: '',
    notes: ''
  });

  const [formError, setFormError] = useState<string>('');

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer.name.trim()) {
      setFormError('يرجى إدخال اسم العميل الكريم');
      return;
    }
    if (!customer.phone.trim()) {
      setFormError('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }
    if (!customer.address.trim()) {
      setFormError('يرجى كتابة عنوان التوصيل أو الاستلام');
      return;
    }

    setFormError('');

    // Sanitize WhatsApp Phone
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '') || '9647800000000';

    // Format WhatsApp Message
    let message = `مرحباً *BRAND STORE* 🛍️\n`;
    message += `أرغب بتأكيد حجز واستلام الطلبية التالية:\n\n`;
    message += `👤 *بيانات العميل:*\n`;
    message += `• الاسم: ${customer.name.trim()}\n`;
    message += `• الهاتف: ${customer.phone.trim()}\n`;
    message += `• العنوان: ${customer.city} - ${customer.address.trim()}\n`;
    if (customer.notes?.trim()) {
      message += `• ملاحظات: ${customer.notes.trim()}\n`;
    }
    message += `\n📦 *قائمة الأجهزة والمنتجات:*\n`;

    cart.forEach((item, idx) => {
      const subtotal = item.product.price * item.quantity;
      message += `${idx + 1}. *${item.product.title}* (${item.product.brand})\n`;
      message += `   العدد: ${item.quantity} × ${item.product.price.toLocaleString('en-US')} د.ع = ${subtotal.toLocaleString('en-US')} د.ع\n`;
    });

    message += `\n💰 *المجموع الكلي للطلب:* ${totalPrice.toLocaleString('en-US')} د.ع\n\n`;
    message += `يرجى تأكيد توفر الأجهزة بالمعرض وتنسيق التسليم. شكراً لكم!`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3 my-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
          <ShoppingBag size={30} />
        </div>
        <h3 className="font-black text-slate-800 text-base">سلة الطلبات فارغة حالياً</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          تصفح الأجهزة والمواصفات وأضف الأجهزة التي ترغب بحجزها أو طلبها عبر الواتساب
        </p>
        <button
          onClick={onContinueShopping}
          className="mt-3 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-md"
        >
          تصفح أجهزة المتجر
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-sm sm:text-base">سلة طلبات الأجهزة</h2>
            <p className="text-[11px] text-slate-400 font-bold">{cart.length} أجهزة في السلة</p>
          </div>
        </div>

        <button
          onClick={onClearCart}
          className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
        >
          <Trash2 size={13} />
          <span>إفراغ السلة</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2.5">
        {cart.map((item) => {
          const subtotal = item.product.price * item.quantity;
          return (
            <div
              key={item.product.id}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3"
            >
              {/* Image & Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-slate-50 p-1 flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.2 rounded-full">
                    {item.product.brand}
                  </span>
                  <h4 className="font-black text-xs text-slate-800 truncate mt-0.5">
                    {item.product.title}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-black text-purple-700">
                      {subtotal.toLocaleString('en-US')} د.ع
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({item.product.price.toLocaleString('en-US')} × {item.quantity})
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Delete */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200/80 p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-sm text-xs"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-7 text-center font-black text-xs text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-sm text-xs"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition cursor-pointer"
                  title="حذف"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
        <span className="font-black text-xs text-slate-700">المجموع الكلي للسلة:</span>
        <span className="font-black text-lg sm:text-xl text-purple-700">
          {totalPrice.toLocaleString('en-US')} د.ع
        </span>
      </div>

      {/* Customer Info Form for WhatsApp Checkout */}
      <form
        onSubmit={handleSendWhatsAppOrder}
        className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3.5 text-xs text-right"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <MessageCircle size={18} className="text-emerald-600" />
          <h3 className="font-black text-sm text-slate-800">
            بيانات إتمام الطلب المباشر عبر الواتساب
          </h3>
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold flex items-center gap-2 text-xs">
            <AlertCircle size={15} />
            <span>{formError}</span>
          </div>
        )}

        {/* Customer Name */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <User size={13} className="text-purple-600" />
            <span>الاسم الثلاثي للعميل *</span>
          </label>
          <input
            type="text"
            required
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="مثال: علي أحمد حسين"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Phone size={13} className="text-purple-600" />
            <span>رقم الهاتف للتواصل وتأكيد الحجز *</span>
          </label>
          <input
            type="tel"
            required
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="0780xxxxxxx"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* City and Address */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin size={13} className="text-purple-600" />
              <span>المحافظة *</span>
            </label>
            <select
              value={customer.city}
              onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-purple-400"
            >
              <option value="بغداد">بغداد</option>
              <option value="البصرة">البصرة</option>
              <option value="أربيل">أربيل</option>
              <option value="النجف">النجف</option>
              <option value="كربلاء">كربلاء</option>
              <option value="بابل">بابل</option>
              <option value="السليمانية">السليمانية</option>
              <option value="الموصل">الموصل</option>
              <option value="محافظة أخرى">محافظة أخرى</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">المنطقة / العنوان بالتفصيل *</label>
            <input
              type="text"
              required
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              placeholder="مثال: الكرادة داخل"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-xs focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <FileText size={13} className="text-purple-600" />
            <span>ملاحظات إضافية (اختياري)</span>
          </label>
          <input
            type="text"
            value={customer.notes}
            onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
            placeholder="مثال: يرجى التوصيل بعد الساعة 4 عصراً"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Big WhatsApp Checkout Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-98"
        >
          <MessageCircle size={18} className="fill-white" />
          <span>إرسال الطلب عبر الواتساب للمحل فوراً</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center font-bold">
          سيتم فتح تطبيق الواتساب مباشرة برسالة منسقة تتضمن كافة بيانات طلبك
        </p>
      </form>
    </div>
  );
};
