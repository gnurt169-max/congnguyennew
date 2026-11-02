'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Cpu,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchWithAdminAuth } from '@/lib/admin-auth-fetch';
import { getApiBaseUrl } from '@/lib/utils';

const DEFAULT_WELCOME_MESSAGE =
  'Chào bạn! Công Nguyên chuyên cung cấp & thanh lý máy móc, thiết bị làm bánh công nghiệp (lò nướng, máy trộn bột, máy cán, máy chia bột...). Bạn đang cần tư vấn dòng máy nào hoặc tìm đồ tân trang cho tiệm bánh của mình?';

const DEFAULT_WIDGET_ROLE = 'Chuyên Viên Kỹ Thuật & Báo Giá Máy Bánh Công Nguyên';

const DEFAULT_SYSTEM_PROMPT =
  'Bạn là Chuyên viên Kỹ thuật & Báo Giá Thiết Bị Bánh của CÔNG NGUYÊN (Website: congnguyen.com.vn) - đơn vị chuyên mua bán, tân trang, thanh lý máy móc và dây chuyền làm bánh công nghiệp thực tế. Nhiệm vụ của bạn là:\n- Tư vấn thông số kỹ thuật, công suất và ứng dụng thực tế của 3 nhóm danh mục thiết bị làm bánh chuẩn của Công Nguyên:\n  1. Tủ trưng bày bánh kem & Bảo quản (slug: tu-trung-bay-banh)\n  2. Lò nướng bánh công nghiệp (slug: lo-nuong-cong-nghiep)\n  3. Máy trộn bột & Đánh trứng (slug: may-tron-bot-danh-trung)\n- KHO HÀNG THỰC TẾ & KHÓA CHẶT DỮ LIỆU (STRICT PRODUCT GROUNDING): Bạn ghi nhớ chính xác và CHỈ gợi ý trong danh sách 8 sản phẩm máy làm bánh thanh lý & tân trang đang có sẵn thực tế tại kho của Công Nguyên:\n  1. "Tủ trưng bày bánh kem 1m5 5 tầng Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 97.000.000 đ | Giá bán ưu đãi: 45.000.000 đ (Tiết kiệm 52.000.000 đ) | Tồn kho: 1 | Tình trạng: Tân trang nguyên bản\n  2. "Tủ trưng bày bánh kem 1m8 5 tầng Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 118.000.000 đ | Giá bán ưu đãi: 55.000.000 đ (Tiết kiệm 63.000.000 đ) | Tồn kho: 3 (Còn 3 con: 2 màu đen, 1 màu kem) | Tình trạng: Máy tân trang như mới\n  3. "Tủ mát bảo quản 2 cánh lùa Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 58.000.000 đ | Giá bán ưu đãi: 38.000.000 đ (Tiết kiệm 20.000.000 đ) | Tồn kho: 1 | Tình trạng: Nguyên bản hoạt động hoàn hảo\n  4. "Tủ bảo quản 2 cánh mở Ruyshing Đài Loan" | Danh mục: Tủ trưng bày bánh kem & Bảo quản (tu-trung-bay-banh) | Thương hiệu: Ruyshing (Đài Loan) | Giá gốc: 38.000.000 đ | Giá bán ưu đãi: 24.000.000 đ (Tiết kiệm 14.000.000 đ) | Tồn kho: 1 | Tình trạng: Tân trang đạt chuẩn kỹ thuật\n  5. "Cối đánh trứng / Trộn bột Đài Loan Hobat" | Danh mục: Máy trộn bột & Đánh trứng (may-tron-bot-danh-trung) | Thương hiệu: Hobat (Đài Loan) | Giá gốc: 24.500.000 đ | Giá bán ưu đãi: 16.000.000 đ (Tiết kiệm 8.500.000 đ) | Tồn kho: 1 | Tình trạng: Máy nguyên bản, motor dây đồng cực khỏe\n  6. "Lò nướng điện 1 tầng 2 khay Hewwu Trung Quốc" | Danh mục: Lò nướng bánh công nghiệp (lo-nuong-cong-nghiep) | Thương hiệu: Hewwu (Trung Quốc) | Giá gốc: 10.500.000 đ | Giá bán ưu đãi: 7.000.000 đ (Tiết kiệm 3.500.000 đ) | Tồn kho: 1 | Tình trạng: Thanh lý tiệm bánh, nhiệt lên đều\n  7. "Lò nướng đối lưu 4 mâm Trung Quốc (Hàng mới 100%)" | Danh mục: Lò nướng bánh công nghiệp (lo-nuong-cong-nghiep) | Thương hiệu: Trung Quốc | Giá gốc: 18.000.000 đ | Giá bán ưu đãi: 10.000.000 đ (Tiết kiệm 8.000.000 đ) | Tồn kho: 1 | Tình trạng: Hàng mới 100% xả thanh lý kho\n  8. "Lò nướng đối lưu Southstar 4 mâm" | Danh mục: Lò nướng bánh công nghiệp (lo-nuong-cong-nghiep) | Thương hiệu: Southstar | Giá gốc: 35.000.000 đ | Giá bán ưu đãi: 25.000.000 đ (Tiết kiệm 10.000.000 đ) | Tồn kho: 1 | Tình trạng: Độ mới 90%\n- QUY TẮC SO SÁNH GIÁ & TIẾT KIỆM KHI BÁO GIÁ: Khi khách hỏi giá bất kỳ máy nào, bot KHÔNG CHỈ báo giá thanh lý mà BẮT BUỘC PHẢI NHẤN MẠNH SỐ TIỀN TIẾT KIỆM so với mua mới trên thị trường. Ví dụ: "Tủ bánh kem 1m5 5 tầng Ruyshing giá mới trên thị trường khoảng 97 triệu, bên mình thanh lý máy tân trang chỉ 45 triệu, bạn tiết kiệm được tận 52 triệu cho tiệm của mình. Bạn có muốn kỹ thuật viên gửi video quay test máy qua Zalo 0976 619 044 không ạ?". Đồng thời nêu 3 cam kết an tâm: Bảo hành kỹ thuật tận nơi, đổi trả 7 ngày nếu lỗi kỹ thuật, và hỗ trợ test máy trực tiếp tại xưởng 6/3 DN4, Đông Hưng Thuận.\n- THÔNG TIN LIÊN HỆ KỸ THUẬT & ZALO: Khi khách hàng yêu cầu gặp tư vấn viên, liên hệ kỹ thuật trực tiếp, hoặc xin số Zalo để gửi hình ảnh/video máy cũ cần bán thanh lý hay tân trang, bạn hãy cung cấp số Hotline & Zalo chính thức duy nhất là 0976 619 044 (link chat Zalo: https://zalo.me/0976619044) để được kỹ sư trưởng Công Nguyên thẩm định và hỗ trợ ngay.\n- Khi khách hàng hỏi mua hoặc tư vấn bất kỳ dòng máy nào, hãy nêu rõ tình trạng máy, xuất xứ, mức giá ưu đãi so với giá gốc, và kích thích khách hàng bấm nút "Báo giá (RFQ)" để nhận khảo sát điện 3 pha hoặc hỗ trợ vận chuyển lắp đặt tận nơi.\n- Tuyệt đối KHÔNG trả lời về sách, tài liệu học tập, giáo trình sinh viên, máy tính cũ. Luôn giữ văn phong kỹ thuật, am hiểu ngành bánh và tôn trọng khách hàng.';

const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

export default function AdminGeminiSettingsPage() {
  const { token } = useAuth();

  // State form
  const [apiKey, setApiKey] = useState('');
  const [, setMaskedKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [aiModelName, setAiModelName] = useState('gemini-2.5-flash');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(DEFAULT_MODELS);
  const [isSyncingModels, setIsSyncingModels] = useState(false);
  const [widgetRole, setWidgetRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Trạng thái kiểm tra key
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [hasEnvKeyFallback, setHasEnvKeyFallback] = useState(false);

  // Loading & Thông báo
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
    latencyMs?: number;
  } | null>(null);

  // Tải cấu hình từ backend khi mở trang
  useEffect(() => {
    fetchWithAdminAuth('/admin/settings/gemini')
      .then((res) => (res.ok ? res.json() : null))
      .then((raw) => {
        if (raw) {
          const data = raw.data || raw;
          if (data) {
            setIsConfigured(Boolean(data.isConfigured));
            setMaskedKey(data.maskedKey || '');
            setIsAiEnabled(data.isAiEnabled ?? true);
            const currentModel = data.aiModelName || 'gemini-2.5-flash';
            setAiModelName(currentModel);
            if (!DEFAULT_MODELS.includes(currentModel)) {
              setIsCustomModel(true);
              setAvailableModels((prev) => Array.from(new Set([currentModel, ...prev])));
            }

            setWidgetRole(data.widgetRole || '');

            // Tự động làm sạch dữ liệu UniPass cũ nếu Backend còn lưu
            const prompt = data.systemPrompt;
            if (prompt && !prompt.includes('UniPass') && !prompt.includes('định hướng học tập')) {
              setSystemPrompt(prompt);
            } else {
              setSystemPrompt('');
            }

            const welcome = data.welcomeMessage;
            if (welcome && !welcome.includes('UniPass') && !welcome.includes('khóa học')) {
              setWelcomeMessage(welcome);
            } else {
              setWelcomeMessage('');
            }

            setIsValidKey(data.isValidKey);
            setLastTestedAt(data.lastTestedAt);
            setHasEnvKeyFallback(data.hasEnvKeyFallback);

            // Nếu đã có key trong DB thì hiển thị masked key làm gợi ý an toàn
            if (data.maskedKey) {
              setApiKey(data.maskedKey);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Chưa kết nối được backend:', err);
      });
  }, [token]);

  // Đồng bộ danh sách mô hình từ Google API
  const handleSyncModels = async () => {
    setIsSyncingModels(true);
    try {
      const keyParam =
        apiKey && !apiKey.includes('••••') && !apiKey.includes('****')
          ? `?apiKey=${encodeURIComponent(apiKey.trim())}`
          : '';
      const res = await fetchWithAdminAuth(`/admin/settings/gemini/models${keyParam}`);
      if (res.ok) {
        const raw = await res.json();
        const json = raw.data || raw;
        if (json.models && Array.isArray(json.models) && json.models.length > 0) {
          setAvailableModels(json.models);
          setToastMsg({
            type: 'success',
            text: `Đã đồng bộ thành công ${json.models.length} mô hình Gemini từ Google!`,
          });
        }
      } else {
        setToastMsg({
          type: 'error',
          text: 'Không thể đồng bộ mô hình. Vui lòng kiểm tra lại API Key!',
        });
      }
    } catch {
      setToastMsg({
        type: 'error',
        text: 'Lỗi mạng khi đồng bộ mô hình từ Google.',
      });
    } finally {
      setIsSyncingModels(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Lưu cấu hình
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMsg(null);

    try {
      const res = await fetchWithAdminAuth('/admin/settings/gemini', {
        method: 'PUT',
        body: JSON.stringify({
          geminiApiKey: apiKey.trim(),
          apiKey: apiKey.trim(),
          isAiEnabled,
          isEnabled: isAiEnabled,
          aiModelName: aiModelName.trim(),
          model: aiModelName.trim(),
          systemPrompt,
          welcomeMessage,
          widgetRole: widgetRole.trim(),
        }),
      });

      const raw = await res.json();
      if (res.ok) {
        const data = raw.data || raw;
        setIsConfigured(Boolean(data.isConfigured));
        if (data.maskedKey) {
          setMaskedKey(data.maskedKey);
          setApiKey(data.maskedKey);
        }
        setWidgetRole(data.widgetRole || widgetRole);
        if (data.isValidKey !== undefined) {
          setIsValidKey(data.isValidKey);
        }
        setToastMsg({ type: 'success', text: 'Đã lưu cấu hình Google Gemini API Key & Vai trò thành công!' });
      } else {
        const errMsg = raw?.error?.message || raw?.message || 'Không thể lưu cấu hình.';
        setToastMsg({ type: 'error', text: errMsg });
      }
    } catch {
      setToastMsg({ type: 'error', text: 'Lỗi mạng: Không thể kết nối tới máy chủ backend!' });
    } finally {
      setLoading(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Kiểm tra kết nối (Test Key): Hỗ trợ test ngay với Key mới dán vào
  const handleTestKey = async () => {
    // Nếu chưa có key trên ô nhập và cũng chưa có key trong DB
    if (!apiKey.trim() && !isConfigured && !hasEnvKeyFallback) {
      setToastMsg({ type: 'error', text: 'Vui lòng nhập Google Gemini API Key trước khi kiểm tra!' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetchWithAdminAuth('/admin/settings/gemini/test', {
        method: 'POST',
        body: JSON.stringify({
          geminiApiKey: apiKey.trim(),
          apiKey: apiKey.trim(),
          model: aiModelName.trim(),
          aiModelName: aiModelName.trim(),
        }),
      });

      const raw = await res.json();
      if (res.ok) {
        const data = raw.data || raw;
        setTestResult({
          success: true,
          message: data.message || 'Kết nối Google Gemini thành công!',
          model: data.model || aiModelName,
          latencyMs: data.latencyMs,
        });
        setIsValidKey(true);
        setLastTestedAt(new Date().toISOString());
        setToastMsg({ type: 'success', text: data.message || 'Kết nối Google Gemini API thành công!' });
      } else {
        const errMsg =
          raw?.error?.message ||
          (Array.isArray(raw?.error?.message) ? raw.error.message.join(', ') : null) ||
          raw?.message ||
          'Kiểm tra API Key thất bại!';
        setTestResult({
          success: false,
          message: errMsg,
        });
        setIsValidKey(false);
        setToastMsg({ type: 'error', text: errMsg });
      }
    } catch {
      const errMsg = 'Lỗi mạng hoặc hết thời gian chờ: Không thể kết nối tới máy chủ backend!';
      setTestResult({
        success: false,
        message: errMsg,
      });
      setIsValidKey(false);
      setToastMsg({ type: 'error', text: errMsg });
    } finally {
      setTesting(false);
      setTimeout(() => setToastMsg(null), 6000);
    }
  };

  // Tự động sinh System Prompt từ dữ liệu web thực tế
  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const res = await fetchWithAdminAuth('/admin/settings/gemini/generate-system-prompt', {
        method: 'POST',
      });
      const raw = await res.json();
      const data = raw.data || raw;
      if (res.ok && data?.systemPrompt) {
        setSystemPrompt(data.systemPrompt);
        setToastMsg({
          type: 'success',
          text: 'Đã tạo System Prompt tự động từ dữ liệu website thành công!',
        });
      } else {
        const errMsg =
          data?.error?.message ||
          (Array.isArray(data?.error?.message) ? data.error.message.join(', ') : null) ||
          data?.message ||
          'Không thể tạo prompt tự động từ dữ liệu website.';
        setToastMsg({ type: 'error', text: errMsg });
      }
    } catch {
      setToastMsg({ type: 'error', text: 'Lỗi mạng khi kết nối máy chủ tạo System Prompt.' });
    } finally {
      setIsGeneratingPrompt(false);
      setTimeout(() => setToastMsg(null), 6000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <Cpu className="h-4 w-4" />
            <span>Trí tuệ nhân tạo (AI Assistant)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <span>Cấu Hình Google Gemini API Key</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý API Key động, đồng bộ mô hình và cá nhân hóa Chuyên viên Kỹ thuật & Báo giá Máy Bánh Công Nguyên (congnguyen.com.vn)
          </p>
        </div>

        {/* NÚT LƯU CẤU HÌNH NHANH */}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{loading ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
        </button>
      </div>

      {/* TOAST THÔNG BÁO */}
      {toastMsg && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* THẺ TRẠNG THÁI KẾT NỐI TRỰC QUAN */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Trạng thái hoạt động Gemini API
          </span>
          <div className="flex items-center gap-2.5">
            {isValidKey === true ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>● Đã cấu hình & Hoạt động</span>
              </span>
            ) : isValidKey === false ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>⚠ Key không hợp lệ / Hết hạn mức</span>
              </span>
            ) : isConfigured ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Đã cấu hình (Chưa kiểm tra)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span>○ Chưa cấu hình Key</span>
              </span>
            )}

            {lastTestedAt && (
              <span className="text-[11px] text-slate-400">
                (Lần kiểm tra gần nhất: {new Date(lastTestedAt).toLocaleTimeString('vi-VN')} {new Date(lastTestedAt).toLocaleDateString('vi-VN')})
              </span>
            )}
          </div>
        </div>

        {/* NÚT TEST KEY */}
        <button
          type="button"
          onClick={handleTestKey}
          disabled={testing || (!apiKey && !isConfigured && !hasEnvKeyFallback)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span>{testing ? 'Đang kiểm tra với Google (tối đa 25s)...' : 'Kiểm tra kết nối (Test Key)'}</span>
        </button>
      </div>

      {/* KẾT QUẢ TEST REALTIME */}
      {testResult && (
        <div
          className={`rounded-2xl p-4 text-xs font-medium border flex items-start gap-3 animate-fade-in ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50/80 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold">{testResult.message}</p>
            {testResult.latencyMs !== undefined && (
              <p className="text-[11px] opacity-80">
                Thời gian phản hồi API: <strong>{testResult.latencyMs}ms</strong> • Model kiểm tra: <strong>{testResult.model || aiModelName}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* FORM CẤU HÌNH CHÍNH */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Google Gemini API Key
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nhập API Key được tạo từ Google AI Studio (aistudio.google.com)
                </p>
              </div>
            </div>

            {/* BẬT/TẮT TOÀN HỆ THỐNG AI */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAiEnabled}
                onChange={(e) => setIsAiEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAiEnabled ? 'Đang bật AI' : 'Tạm tắt AI'}
              </span>
            </label>
          </div>

          {/* Ô NHẬP API KEY DẠNG PASSWORD CÓ NÚT CON MẮT & NÚT XÓA TRẮNG DÁN MỚI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Khóa Google API Key *
              </label>
              <div className="flex items-center gap-2.5">
                {(apiKey || isConfigured) && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKey('');
                      setMaskedKey('');
                      setTestResult(null);
                    }}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 cursor-pointer underline"
                  >
                    Xóa trắng / Dán Key mới
                  </button>
                )}
                {isConfigured && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Key đã mã hóa trong DB</span>
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder=""
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition cursor-pointer"
                title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
                tabIndex={-1}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 p-3 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white">Cơ chế ưu tiên & Bảo mật đa tầng:</p>
                <p>
                  1. <strong>Mã hóa DB:</strong> Key được mã hóa AES-256 an toàn trong database trước khi lưu và không bao giờ lộ nguyên văn cho khách hàng.
                </p>
                <p>
                  2. <strong>Thử nghiệm ngay:</strong> Bạn có thể dán Key mới (Google Gemini API Key) và bấm <strong>"Kiểm tra kết nối"</strong> ngay lập tức để xác minh trước khi Lưu.
                </p>
              </div>
            </div>
          </div>

          {/* DÒNG CHỌN MODEL & VAI TRÒ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mô hình Gemini (Model Engine)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncModels}
                    disabled={isSyncingModels}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 cursor-pointer disabled:opacity-50"
                    title="Đồng bộ danh sách mô hình từ Google AI Studio"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingModels ? 'animate-spin' : ''}`} />
                    <span>{isSyncingModels ? 'Đang đồng bộ...' : 'Đồng bộ từ Google'}</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    {isCustomModel ? 'Chọn danh sách' : 'Nhập tay'}
                  </button>
                </div>
              </div>

              {isCustomModel ? (
                <div className="relative">
                  <input
                    type="text"
                    value={aiModelName}
                    onChange={(e) => setAiModelName(e.target.value)}
                    placeholder=""
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                  />
                  <Zap className="h-4 w-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <select
                  value={aiModelName}
                  onChange={(e) => setAiModelName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 'gemini-2.5-flash' ? '(Khuyến nghị - Nhanh & Ổn định)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* VAI TRÒ HIỂN THỊ WIDGETROLE (CONTROLLED INPUT) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Vai trò hiển thị trên Widget (widgetRole)
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-amber-500" />
                  <span>Mở khóa chỉnh sửa</span>
                </span>
              </div>
              <input
                type="text"
                value={widgetRole}
                onChange={(e) => setWidgetRole(e.target.value)}
                placeholder=""
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* CÂU CHÀO MỞ ĐẦU */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Câu chào mở đầu tự động (Welcome Message)
            </label>
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition"
            />
          </div>

          {/* ĐỊNH HƯỚNG SYSTEM PROMPT */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Chỉ dẫn hệ thống cho AI (System Prompt mặc định)
              </label>
              <button
                type="button"
                onClick={handleGeneratePrompt}
                disabled={isGeneratingPrompt}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/60 active:scale-98 transition disabled:opacity-60 cursor-pointer self-start sm:self-auto"
                title="Tự động phân tích danh mục, kho máy và liên hệ để tạo System Prompt chuẩn"
              >
                {isGeneratingPrompt ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                  {isGeneratingPrompt
                    ? 'Đang phân tích dữ liệu web & tạo prompt...'
                    : '✨ Tạo Prompt tự động bằng AI (từ dữ liệu web)'}
                </span>
              </button>
            </div>
            <textarea
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 leading-relaxed focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* NÚT LƯU THAY ĐỔI */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing || (!apiKey && !isConfigured && !hasEnvKeyFallback)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {testing ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối (Test Key)'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{loading ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
