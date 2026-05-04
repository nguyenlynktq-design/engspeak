import React, { useRef } from 'react';
import {
  ImageIcon, FileText, Volume2, Pause, RefreshCw, Languages, Download, Target
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { EnglishLevel, VocabularyItem } from '../services/geminiService';

interface Props {
  generatedImage: string | null;
  readingText: string | null;
  translationText: string | null;
  vocabulary: VocabularyItem[];
  generatedTopicName: string | null;
  topic: string;
  level: EnglishLevel;
  showTranslation: boolean;
  setShowTranslation: (v: boolean) => void;
  audioUrl: string | null;
  isPlaying: boolean;
  isAudioLoading: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onPlayAudio: () => void;
  setIsPlaying: (v: boolean) => void;
  generatedPrompt: string | null;
}

export default function PosterPreview({
  generatedImage, readingText, translationText, vocabulary,
  generatedTopicName, topic, level, showTranslation, setShowTranslation,
  audioUrl, isPlaying, isAudioLoading, audioRef, onPlayAudio, setIsPlaying,
  generatedPrompt,
}: Props) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadPoster = async () => {
    if (!posterRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const images = posterRef.current.querySelectorAll('img');
      const loadPromises = Array.from(images).map(img => {
        const image = img as HTMLImageElement;
        if (image.complete) return Promise.resolve();
        return new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      });
      await Promise.all(loadPromises);
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(posterRef.current, {
        useCORS: true, allowTaint: false, scale: 3, backgroundColor: '#ffffff', logging: false, imageTimeout: 0,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `:root { --color-indigo-50: #f5f3ff !important; --color-indigo-100: #e0e7ff !important; --color-indigo-600: #4f46e5 !important; --color-indigo-700: #4338ca !important; --color-pink-500: #ec4899 !important; --color-pink-700: #be185d !important; } * { color-scheme: light !important; }`;
          clonedDoc.head.appendChild(style);
        },
        ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore'),
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ms-ly-poster-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch { /* silent */ } finally { setIsDownloading(false); }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="p-3 sm:p-5 border-b-4 border-yellow-50 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-yellow-50/30 dark:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-sm">
            <ImageIcon size={14} />
          </div>
          <span className="text-xs sm:text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">Góc Học Tập</span>
          {readingText && <span className="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-amber-900 dark:text-amber-200 text-[10px] font-black rounded-full shadow-sm uppercase">{level}</span>}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {generatedImage && (
            <button onClick={() => { const l = document.createElement('a'); l.href = generatedImage; l.download = `illustration-${Date.now()}.png`; l.click(); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <ImageIcon size={12} /> <span className="hidden sm:inline">Tải ảnh</span>
            </button>
          )}
          {generatedImage && readingText && (
            <button onClick={() => setShowTranslation(!showTranslation)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-sm
                ${showTranslation ? 'bg-amber-500 text-white' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
              <Languages size={12} /> {showTranslation ? 'Ẩn dịch' : 'Dịch'}
            </button>
          )}
          {generatedImage && readingText && (
            <button onClick={downloadPoster} disabled={isDownloading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-white transition-all shadow-lg
                ${isDownloading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-indigo-900/30'}`}>
              {isDownloading ? <RefreshCw className="animate-spin" size={12} /> : <Download size={12} />}
              <span className="hidden sm:inline">{isDownloading ? 'Đang xử lý...' : 'Tải Poster'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Poster Content */}
      {generatedImage && readingText && (
        <div className="w-full flex flex-col items-center gap-4">
          <div ref={posterRef} data-poster-container
            className="p-3 sm:p-4 flex flex-col gap-4 relative overflow-hidden"
            style={{
              fontFamily: "'Libre Baskerville', serif", backgroundColor: '#ffffff',
              backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)', backgroundSize: '20px 20px',
              color: '#1a1a1a', borderRadius: '24px', border: '2px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', width: '100%', maxWidth: '600px'
            }}>
            {/* Image */}
            <div className="w-full overflow-hidden" style={{ borderRadius: '12px', border: '4px solid #f8fafc', boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.06)' }}>
              <img src={generatedImage} alt="Generated Illustration" className="w-full h-auto object-contain" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            </div>

            {/* Text */}
            <div className="flex-1 p-3" style={{ backgroundColor: '#ffffff', border: '3px solid #FCD34D', borderRadius: '16px', boxShadow: '0 4px 0 #F59E0B' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={18} style={{ color: '#EAB308' }} />
                  <h2 className="text-sm sm:text-base font-black" style={{ color: '#92400E', margin: 0 }}>Ms Ly's Reading Corner</h2>
                </div>
                <div className="flex items-center gap-2" data-html2canvas-ignore>
                  <button onClick={(e) => { e.stopPropagation(); onPlayAudio(); }}
                    disabled={isAudioLoading && !audioUrl}
                    className="p-2 rounded-full transition-all"
                    style={{
                      backgroundColor: isPlaying ? '#e0e7ff' : isAudioLoading ? '#f3f4f6' : '#f9fafb',
                      color: isPlaying ? '#4f46e5' : isAudioLoading ? '#d1d5db' : '#9ca3af'
                    }} title={isPlaying ? "Dừng" : "Nghe bài đọc"}>
                    {isAudioLoading && !audioUrl ? <RefreshCw size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>

              {audioUrl && (
                <div className="mb-2 px-2" data-html2canvas-ignore>
                  <audio ref={audioRef} src={audioUrl}
                    onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)}
                    controls className="w-full h-8 scale-90 origin-left opacity-80 hover:opacity-100 transition-opacity" />
                </div>
              )}

              <div className="space-y-3">
                {(generatedTopicName || (topic && topic.length < 50)) && (
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight" style={{ color: '#0369a1', lineHeight: '1.1' }}>
                      {generatedTopicName || topic}
                    </h3>
                  </div>
                )}
                <div className="text-center bg-white/40 p-3 sm:p-4 md:p-8 rounded-[2rem] border-2 border-white shadow-lg backdrop-blur-sm mx-auto w-full max-w-[95%]">
                  <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: '#0369a1', opacity: 0.5 }}>READING PASSAGE</div>
                  <div className="leading-[1.5] whitespace-pre-wrap font-bold text-center px-1 sm:px-2"
                    style={{
                      color: '#1e293b',
                      fontSize: readingText.length > 500 ? '16px' : readingText.length > 300 ? '20px' : readingText.length > 150 ? '24px' : '28px',
                      fontFamily: '"Outfit", sans-serif'
                    }}>
                    {readingText}
                  </div>
                </div>

                {showTranslation && translationText && (
                  <div className="space-y-2 pt-3" style={{ borderTop: '2px solid #fef3c7' }}>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#d97706' }}>Tiếng Việt</div>
                    <div className="text-sm sm:text-lg leading-relaxed whitespace-pre-wrap font-bold italic" style={{ color: '#334155' }}>{translationText}</div>
                  </div>
                )}
              </div>

              {/* Word Bank */}
              {vocabulary && vocabulary.length > 0 && (
                <div className="mt-6 pt-5" style={{ borderTop: '3px dashed #e2e8f0' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Target size={18} /></div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-widest" style={{ color: '#0369a1' }}>Word Bank</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {vocabulary.map((item, idx) => (
                      <div key={idx} className="p-2 sm:p-3 rounded-2xl flex flex-col transition-all hover:scale-[1.03] shadow-sm hover:shadow-indigo-100 bg-white border-2 border-indigo-50">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-black text-base sm:text-lg truncate" style={{ color: '#0c4a6e' }}>{item.word}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">{item.ipa}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium italic text-slate-600 truncate">{item.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>Ms Ly English</span>
              <span className="text-[9px] sm:text-[10px] font-black" style={{ color: '#F59E0B' }}>Level: {level}</span>
            </div>
          </div>

          {/* AI Prompt Debug */}
          {generatedPrompt && (
            <div className="w-full max-w-[600px] p-3 sm:p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100/50 dark:border-indigo-800">
              <p className="text-[10px] uppercase font-bold text-indigo-400 mb-1 tracking-widest">AI Prompt</p>
              <p className="text-xs text-indigo-900/70 dark:text-indigo-300/70 italic leading-relaxed">{generatedPrompt}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
