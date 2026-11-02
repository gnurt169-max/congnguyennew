'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  DollarSign,
  ShieldCheck,
  PhoneCall,
  Camera,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/image-uploader';

export default function LiquidationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submissionCode, setSubmissionCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Form state - Khởi tạo toàn bộ rỗng mặc định
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bakeryName, setBakeryName] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [machineType, setMachineType] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [powerSupply, setPowerSupply] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleResetForm = () => {
    setContactName('');
    setPhoneNumber('');
    setBakeryName('');
    setWorkshopAddress('');
    setMachineType('');
    setBrandModel('');
    setPowerSupply('');
    setCurrentStatus('');
    setExpectedPrice('');
    setImages([]);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gọi API gửi thông tin thanh lý (hoặc mô phỏng thành công)
      const mockCode = `TL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmissionCode(mockCode);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900">
            🔄 Dịch vụ Thu Mua & Thanh Lý Thiết Bị Làm Bánh
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Thanh lý máy cũ giá cao – Nhận tiền ngay trong 24 giờ
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Chủ tiệm bánh, xưởng sản xuất cần nâng cấp dây chuyền hoặc chuyển đổi mô hình? Công Nguyên cử kỹ thuật viên đến tận nơi khảo sát, kiểm định và thu mua trọn gói: Lò nướng, máy trộn bột, máy chia vê, tủ ủ.
          </p>
        </div>

        {/* 3 BƯỚC THU MUA NHANH CHÓNG */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm">Gửi thông tin & hình ảnh</h3>
            <p className="mt-1 text-xs text-slate-500">
              Điền thông tin dòng máy, thương hiệu và tải lên vài tấm ảnh thực trạng máy đang đặt tại xưởng.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm">Kỹ thuật viên thẩm định</h3>
            <p className="mt-1 text-xs text-slate-500">
              Báo giá sơ bộ qua Zalo sau 30 phút, hẹn lịch đến kiểm tra trực tiếp động cơ, bạc đạn tại lò bánh.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="mt-4 font-bold text-slate-900 text-sm">Thanh toán & Tự bốc hàng</h3>
            <p className="mt-1 text-xs text-slate-500">
              Chuyển khoản 100% trước khi bốc máy. Đội vận chuyển và xe cẩu của Công Nguyên tự lo toàn bộ.
            </p>
          </div>
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-4 max-w-lg mx-auto">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Gửi yêu cầu thanh lý thành công!
              </h2>
              <p className="text-sm text-slate-600">
                Mã tiếp nhận hồ sơ của bạn là:{' '}
                <span className="font-mono font-bold text-amber-800 text-base">{submissionCode}</span>
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 text-left space-y-2">
                <div className="font-bold text-slate-900">Các bước kế tiếp:</div>
                <div>1. Kỹ sư định giá máy sẽ liên hệ lại qua số điện thoại <strong>{phoneNumber}</strong> trong vòng 30 phút.</div>
                <div>2. Bạn có thể gửi thêm video máy đang cắm điện chạy thử qua Zalo hotline: <a href="https://zalo.me/0976619044" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-700 hover:text-blue-800">0976 619 044</a> để được định giá nhanh nhất.</div>
              </div>
              <div className="pt-4 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Gửi thêm máy khác
                </button>
                <Link
                  href="/"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* PHẦN 1: THÔNG TIN LIÊN HỆ */}
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-amber-600" />
                  1. Thông tin chủ tiệm / Xưởng bánh
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Họ và tên người liên hệ *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Số điện thoại / Zalo *</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Tên tiệm bánh / Xưởng (nếu có)</label>
                    <input
                      type="text"
                      value={bakeryName}
                      onChange={(e) => setBakeryName(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Địa chỉ xưởng đặt máy *</label>
                    <input
                      type="text"
                      required
                      value={workshopAddress}
                      onChange={(e) => setWorkshopAddress(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 2: THÔNG TIN THIẾT BỊ CẦN BÁN LẠI */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  2. Thông số thiết bị làm bánh cần thanh lý
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Loại thiết bị *</label>
                    <select
                      value={machineType}
                      required
                      onChange={(e) => setMachineType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    >
                      <option value="">-- Chọn loại thiết bị --</option>
                      <option value="Máy trộn bột xoắn ốc (Spiral Mixer)">Máy trộn bột xoắn ốc (Spiral Mixer)</option>
                      <option value="Lò nướng xoay Rotary">Lò nướng xoay Rotary (16 - 32 khay)</option>
                      <option value="Lò nướng tầng Deck Oven">Lò nướng tầng Deck Oven điện/gas</option>
                      <option value="Lò nướng đối lưu">Lò nướng đối lưu (5 - 10 khay)</option>
                      <option value="Máy chia bột & vo tròn">Máy chia bột & vo tròn tự động</option>
                      <option value="Tủ ủ bột vi khí hậu">Tủ ủ bột vi khí hậu</option>
                      <option value="Máy cán bột 2 chiều">Máy cán bột bánh ngọt 2 chiều</option>
                      <option value="Thiết bị khác">Thiết bị khác / Trọn gói dàn máy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Hãng sản xuất & Mã Model</label>
                    <input
                      type="text"
                      value={brandModel}
                      onChange={(e) => setBrandModel(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Nguồn điện máy đang dùng</label>
                    <select
                      value={powerSupply}
                      onChange={(e) => setPowerSupply(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    >
                      <option value="">-- Chọn nguồn điện --</option>
                      <option value="THREE_PHASE_380V">3 Pha (380V) - Điện sản xuất</option>
                      <option value="SINGLE_PHASE_220V">1 Pha (220V) - Điện dân dụng</option>
                      <option value="UNPOWERED_MANUAL">Không dùng điện (Cơ khí)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Mức giá mong muốn thu mua (VNĐ)</label>
                    <input
                      type="text"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mô tả hiện trạng thực tế của máy *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      placeholder=""
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 3: TẢI ẢNH THỰC TẾ CỦA MÁY */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-amber-600" />
                  3. Hình ảnh máy thực tế tại xưởng
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Ảnh chụp toàn thân máy, cối trộn/khoang nướng và tem thông số kỹ thuật dán sau thân máy sẽ giúp kỹ sư báo giá chính xác nhất.
                </p>

                <div className="mt-4">
                  <ImageUploader
                    images={images}
                    onChange={setImages}
                    maxFileSizeMB={10}
                  />
                </div>
              </div>

              {/* NÚT SUBMIT */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Thông tin và giá bán của quý khách được bảo mật tuyệt đối.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto rounded-2xl bg-amber-500 px-8 py-3.5 text-sm font-black text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-98"
                >
                  {loading ? 'Đang gửi...' : 'Gửi yêu cầu định giá thu mua'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
