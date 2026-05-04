import React, { useRef } from 'react';
import {
  Type, Layout, Upload, RefreshCw, FileText, ImageIcon, GraduationCap, Sparkles, AlertCircle, X
} from 'lucide-react';
import { EnglishLevel } from '../services/geminiService';

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface Props {
  topic: string;
  setTopic: (t: string) => void;
  level: EnglishLevel;
  setLevel: (l: EnglishLevel) => void;
  imagePreview: string | null;
  setImagePreview: (img: string | null) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  contentMode: "generate" | "useInput";
  setContentMode: (m: "generate" | "useInput") => void;
  isGenerating: boolean;
  error: string | null;
  isDragging: boolean;
  isProcessingFile: boolean;
  onGenerate: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  processFile: (file: File) => void;
}

export default function ControlsPanel({
  topic, setTopic, level, setLevel, imagePreview, setImagePreview,
  aspectRatio, setAspectRatio, contentMode, setContentMode,
  isGenerating, error, isDragging, isProcessingFile,
  onGenerate, onDragOver, onDragLeave, onDrop, onPaste, processFile
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-[2rem] shadow-xl border-4 border-yellow-200 dark:border-yellow-900/50 space-y-5 relative overflow-hidden transition-colors">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 dark:bg-yellow-900/20 rounded-full opacity-40 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-100 dark:bg-pink-900/20 rounded-full opacity-40 blur-2xl" />

      <div className="relative z-10 space-y-5">
        {/* Content Mode */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">
            <Layout size={16} className="text-amber-500" /> Chế độ Nội dung
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "generate" as const, label: "AI Tự Tạo" },
              { id: "useInput" as const, label: "Dùng Văn Bản Của Tôi" },
            ].map((m) => (
              <button key={m.id} onClick={() => setContentMode(m.id)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all
                  ${contentMode === m.id
                    ? 'bg-yellow-400 border-yellow-500 text-amber-900 shadow-[0_2px_0_#D97706]'
                    : 'bg-white dark:bg-gray-700 border-amber-50 dark:border-gray-600 text-amber-700 dark:text-amber-300 hover:border-amber-200'}`}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">
            <Type size={16} className="text-amber-500" />
            {contentMode === "generate" ? "Chủ đề hoặc Từ vựng" : "Văn bản bài đọc"}
          </label>
          <div className={`relative transition-all duration-200 ${isDragging ? 'scale-[1.02]' : ''}`}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} onPaste={onPaste}
              placeholder={contentMode === "generate"
                ? "Ví dụ: Công viên, Bãi biển, Các bạn nhỏ đang chơi đùa..."
                : "Dán văn bản tiếng Anh vào đây, hoặc kéo thả file..."}
              className={`w-full h-28 p-3 bg-amber-50/50 dark:bg-gray-700/50 border-2 rounded-2xl focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all resize-none text-gray-800 dark:text-gray-100 placeholder:text-amber-300 dark:placeholder:text-gray-500 font-medium text-sm
                ${isDragging ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-amber-100 dark:border-gray-600'}`}
            />
            {isProcessingFile && (
              <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 text-amber-800 dark:text-amber-300 font-bold animate-pulse text-sm">
                <RefreshCw className="animate-spin" size={16} /> Đang xử lý file...
              </div>
            )}
            {isDragging && (
              <div className="absolute inset-0 border-4 border-dashed border-yellow-400 bg-yellow-400/10 rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none">
                <Upload size={28} className="text-yellow-600 animate-bounce" />
                <span className="font-black text-yellow-700 uppercase text-sm">Thả file vào đây</span>
              </div>
            )}
          </div>
          {contentMode === "useInput" && (
            <div className="mt-2 flex justify-end">
              <button onClick={() => docFileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-black hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors uppercase tracking-wider">
                <FileText size={14} /> Tải file (PDF, DOCX, TXT)
              </button>
              <input type="file" ref={docFileInputRef}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                accept=".pdf,.docx,.txt" className="hidden" />
            </div>
          )}
        </div>

        {/* Level */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">
            <GraduationCap size={16} className="text-amber-500" /> Trình độ
          </label>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {(["Starters", "Movers", "Flyers", "A1", "A2", "B1", "B2"] as EnglishLevel[]).map((lvl) => (
              <button key={lvl} onClick={() => setLevel(lvl)}
                className={`px-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all
                  ${level === lvl
                    ? 'bg-yellow-400 border-yellow-500 text-amber-900 shadow-[0_4px_0_#D97706] -translate-y-1'
                    : 'bg-white dark:bg-gray-700 border-amber-50 dark:border-gray-600 text-amber-700 dark:text-amber-300 hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-gray-600'}`}
              >{lvl}</button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">
            <ImageIcon size={16} className="text-amber-500" /> Ảnh tham khảo (Tùy chọn)
          </label>
          <div onClick={() => fileInputRef.current?.click()}
            className={`relative group cursor-pointer border-3 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center overflow-hidden
              ${imagePreview ? 'border-yellow-400 h-28' : 'border-amber-100 dark:border-gray-600 hover:border-yellow-300 h-20 bg-amber-50/30 dark:bg-gray-700/30'}`}>
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <RefreshCw className="text-white" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white shadow-sm">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <Upload className="text-amber-300 dark:text-gray-500 mb-1 group-hover:scale-110 transition-transform" size={22} />
                <span className="text-[10px] font-black text-amber-400 dark:text-gray-500 uppercase">Tải ảnh lên</span>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wider">
            <Layout size={16} className="text-amber-500" /> Kích thước Ảnh
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {[
              { id: '4:3' as AspectRatio, label: 'Ngang (4:3)' },
              { id: '3:4' as AspectRatio, label: 'Dọc (3:4)' },
              { id: '16:9' as AspectRatio, label: 'Rộng (16:9)' },
              { id: '1:1' as AspectRatio, label: 'Vuông (1:1)' },
            ].map((ratio) => (
              <button key={ratio.id} onClick={() => setAspectRatio(ratio.id)}
                className={`px-2 py-2 rounded-xl text-[10px] font-black border-2 transition-all
                  ${aspectRatio === ratio.id
                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 shadow-inner'
                    : 'bg-white dark:bg-gray-700 border-amber-50 dark:border-gray-600 text-amber-600 dark:text-amber-400 hover:border-amber-200'}`}
              >{ratio.label}</button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button onClick={onGenerate} disabled={isGenerating}
          className={`w-full py-3.5 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 text-base
            ${isGenerating
              ? 'bg-amber-300 dark:bg-amber-700 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 active:scale-[0.98] shadow-yellow-200 dark:shadow-yellow-900/30 hover:shadow-yellow-300'}`}
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {isGenerating ? (
            <><RefreshCw className="animate-spin" size={22} /> Đang tạo...</>
          ) : (
            <><Sparkles size={22} className="animate-pulse" /> Bắt đầu học ngay!</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-100 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-300 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
