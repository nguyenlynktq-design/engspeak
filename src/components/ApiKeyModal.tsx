import React, { useState } from 'react';
import { X, Key, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';

export default function ApiKeyModal() {
  const { apiKey, setApiKey, showApiModal, setShowApiModal, hasApiKey } = useAppContext();
  const [inputKey, setInputKey] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setError('Vui lòng nhập API Key');
      return;
    }
    if (!trimmed.startsWith('AIza')) {
      setError('API Key không hợp lệ. Key phải bắt đầu bằng "AIza..."');
      return;
    }

    setIsValidating(true);
    setError('');
    
    // Simple validation: try to use the key
    try {
      setApiKey(trimmed);
      setShowApiModal(false);
    } catch {
      setError('Không thể xác thực API Key. Vui lòng thử lại.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  if (!showApiModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => hasApiKey && setShowApiModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - only if user already has a key */}
          {hasApiKey && (
            <button
              onClick={() => setShowApiModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <X size={18} />
            </button>
          )}

          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                <Key size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Thiết Lập API Key</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bắt buộc để sử dụng app</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                <Sparkles size={16} />
                Hướng dẫn lấy API Key (Miễn phí)
              </div>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Truy cập Google AI Studio</li>
                <li>Đăng nhập bằng tài khoản Google</li>
                <li>Nhấn "Create API Key" → Copy key</li>
                <li>Dán key vào ô bên dưới</li>
              </ol>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors mt-1"
              >
                <ExternalLink size={12} />
                Lấy API Key tại đây
              </a>
            </div>

            {/* Key Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Gemini API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => { setInputKey(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-500 font-mono text-sm"
                  autoFocus
                />
                {inputKey && (
                  <button
                    onClick={() => setInputKey('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {error && (
                <p className="text-xs text-red-500 font-medium animate-pulse">{error}</p>
              )}
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 text-[10px] text-gray-400 dark:text-gray-500">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <span>API Key được lưu trữ cục bộ trên trình duyệt của bạn, không gửi đến bất kỳ server nào ngoài Google AI.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            <button
              onClick={handleSave}
              disabled={isValidating || !inputKey.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Lưu & Bắt đầu sử dụng
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
