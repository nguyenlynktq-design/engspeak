import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Sparkles, GraduationCap, Mic, Star, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { generateContent, generateImage, generateAudio, evaluateSpeech, EnglishLevel, EvaluationResult } from './services/geminiService';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import ControlsPanel from './components/ControlsPanel';
import PosterPreview from './components/PosterPreview';
import SpeakingPractice from './components/SpeakingPractice';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.7.284/pdf.worker.min.mjs`;

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
type GenerationStep = 'idle' | 'content' | 'image' | 'done';

function AppContent() {
  const { apiKey, hasApiKey, setShowApiModal } = useAppContext();

  // Form state
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<EnglishLevel>("Starters");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");
  const [contentMode, setContentMode] = useState<"generate" | "useInput">("generate");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [readingText, setReadingText] = useState<string | null>(null);
  const [translationText, setTranslationText] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [generatedTopicName, setGeneratedTopicName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('Ms Ly English');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- File Processing ---
  const processFile = async (file: File) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        if (contentMode === 'generate') setContentMode('useInput');
      };
      reader.readAsDataURL(file);
      return;
    }

    setIsProcessingFile(true);
    setError(null);
    try {
      let extractedText = "";
      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
        }
        extractedText = fullText;
      } else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = (await mammoth.extractRawText({ arrayBuffer })).value;
      } else if (fileName.endsWith('.txt')) {
        extractedText = await file.text();
      } else {
        throw new Error("Định dạng file không hỗ trợ. Vui lòng tải lên PDF, DOCX, TXT hoặc Ảnh.");
      }
      if (extractedText.trim()) {
        setTopic(extractedText.trim());
        setContentMode('useInput');
      } else {
        throw new Error("Không thể trích xuất văn bản từ file này.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi xử lý file.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  // --- Generation ---
  const handleGenerate = async () => {
    if (!hasApiKey) {
      setShowApiModal(true);
      return;
    }
    if (!topic && !imagePreview) {
      setError("Vui lòng nhập chủ đề hoặc tải ảnh lên.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setReadingText(null);
    setGenerationStep('content');

    try {
      const { prompt, readingText: rt, topicName, translation, vocabulary: vocab } = await generateContent(
        topic || (contentMode === "useInput" ? "Extract text from image" : "A scene based on the provided image"),
        level, contentMode, imagePreview || undefined, undefined, undefined, apiKey
      );
      setGeneratedPrompt(prompt);
      setReadingText(rt);
      setTranslationText(translation);
      setVocabulary(vocab);
      setGeneratedTopicName(topicName);
      setShowTranslation(false);
      setAudioUrl(null);
      setEvaluation(null);
      setGenerationStep('image');

      setIsAudioLoading(true);
      let imageUrl = null;
      try {
        imageUrl = await generateImage(prompt, aspectRatio, apiKey);
      } catch (err: any) {
        console.error("Image generation failed:", err.message);
        // We do not fail the whole process if only image fails
      }

      let audio = null;
      if (rt) {
        try {
          audio = await generateAudio(rt, level, apiKey);
        } catch (err: any) {
          console.error("Audio generation failed:", err.message);
        }
      }

      setGeneratedImage(imageUrl);
      if (audio) setAudioUrl(audio);
      setIsAudioLoading(false);
      setGenerationStep('done');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || String(err);
      if (msg === "API_KEY_MISSING") {
        setError("Vui lòng nhập API Key trước khi sử dụng.");
        setShowApiModal(true);
      } else {
        setError(`Lỗi API: ${msg} (Bạn có thể thử F5 hoặc kiểm tra lại kết nối/API Key)`);
      }
      setIsAudioLoading(false);
      setGenerationStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Audio ---
  const handlePlayAudio = async () => {
    if (!readingText) return;
    if (audioUrl && audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
      return;
    }
    if (isAudioLoading) return;
    setIsPlaying(true);
    setIsAudioLoading(true);
    try {
      const url = await generateAudio(readingText, level, apiKey);
      setAudioUrl(url);
    } catch { setError("Không thể tạo âm thanh."); setIsPlaying(false); }
    finally { setIsAudioLoading(false); }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current && isPlaying) {
      const audio = audioRef.current;
      audio.load();
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [audioUrl]);

  // --- Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleEvaluate(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setEvaluation(null);
    } catch { setError("Không thể truy cập micro."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 500);
    }
  };

  const handleEvaluate = async (audioBlob: Blob) => {
    if (!readingText) return;
    setIsEvaluating(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const result = await evaluateSpeech(readingText, base64Audio, level, apiKey);
        setEvaluation(result);
        setIsEvaluating(false);
      };
    } catch { setError("Có lỗi khi chấm điểm."); setIsEvaluating(false); }
  };

  // --- Loading Step Indicator ---
  const LoadingIndicator = () => (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-5 py-8">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin" />
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-600 dark:text-gray-300 font-bold animate-pulse text-sm">
          {generationStep === 'content' ? '📝 Đang soạn bài đọc...' : '🎨 Đang vẽ tranh minh họa...'}
        </p>
        <div className="flex gap-2">
          {['content', 'image', 'done'].map((step, i) => (
            <div key={step} className={`w-3 h-3 rounded-full transition-all duration-500
              ${generationStep === step ? 'bg-indigo-500 scale-125 animate-pulse' :
                (generationStep === 'image' && i === 0) || generationStep === 'done' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-600'}`} />
          ))}
        </div>
        <div className="flex gap-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          <span className={generationStep === 'content' ? 'text-indigo-500' : (generationStep === 'image' || generationStep === 'done') ? 'text-green-500' : ''}>Nội dung</span>
          <span className={generationStep === 'image' ? 'text-indigo-500' : generationStep === 'done' ? 'text-green-500' : ''}>Hình ảnh</span>
          <span className={generationStep === 'done' ? 'text-green-500' : ''}>Hoàn tất</span>
        </div>
      </div>
    </motion.div>
  );

  // --- Empty State ---
  const EmptyState = () => (
    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="text-center space-y-4 max-w-xs py-12">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto text-gray-300 dark:text-gray-500">
        <ImageIcon size={40} />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-gray-700 dark:text-gray-300">Chưa có Poster nào</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">Chọn trình độ, nhập chủ đề và nhấn nút tạo để bắt đầu!</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#FFF9E6] dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-800 relative overflow-hidden transition-colors duration-300">
      {/* Background icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.05] dark:opacity-[0.03] z-0">
        <Star className="absolute top-10 left-10 text-yellow-500" size={120} />
        <Sparkles className="absolute top-1/4 right-20 text-indigo-500" size={100} />
        <GraduationCap className="absolute bottom-20 left-1/4 text-green-500" size={150} />
        <Trophy className="absolute bottom-1/3 right-10 text-orange-500" size={130} />
        <Mic className="absolute top-20 right-1/3 text-blue-500" size={110} />
      </div>

      <Header />
      <ApiKeyModal />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Controls */}
          <div className="lg:col-span-4">
            <ControlsPanel
              topic={topic} setTopic={setTopic}
              level={level} setLevel={setLevel}
              imagePreview={imagePreview} setImagePreview={setImagePreview}
              aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
              contentMode={contentMode} setContentMode={setContentMode}
              isGenerating={isGenerating} error={error}
              isDragging={isDragging} isProcessingFile={isProcessingFile}
              onGenerate={handleGenerate}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              onPaste={(e) => { for (let i = 0; i < e.clipboardData.items.length; i++) { if (e.clipboardData.items[i].type.indexOf("image") !== -1) { const f = e.clipboardData.items[i].getAsFile(); if (f) processFile(f); } } }}
              processFile={processFile}
            />
          </div>

          {/* Preview */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-4 border-yellow-100 dark:border-yellow-900/30 overflow-hidden min-h-[400px] sm:min-h-[600px] flex flex-col relative transition-colors">
              <div className="flex-1 flex items-center justify-center p-2 sm:p-6 bg-[#FAFAFA] dark:bg-gray-800/50 overflow-auto">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <LoadingIndicator />
                  ) : (generatedImage && readingText) ? (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="w-full flex flex-col items-center gap-4">
                      <PosterPreview
                        generatedImage={generatedImage} readingText={readingText}
                        translationText={translationText} vocabulary={vocabulary}
                        generatedTopicName={generatedTopicName} topic={topic} level={level}
                        showTranslation={showTranslation} setShowTranslation={setShowTranslation}
                        audioUrl={audioUrl} isPlaying={isPlaying} isAudioLoading={isAudioLoading}
                        audioRef={audioRef} onPlayAudio={handlePlayAudio} setIsPlaying={setIsPlaying}
                        generatedPrompt={generatedPrompt}
                      />
                      <SpeakingPractice
                        readingText={readingText} isRecording={isRecording}
                        isEvaluating={isEvaluating} evaluation={evaluation}
                        studentName={studentName} setStudentName={setStudentName}
                        teacherName={teacherName} setTeacherName={setTeacherName}
                        startRecording={startRecording} stopRecording={stopRecording}
                        generatedTopicName={generatedTopicName} topic={topic} level={level}
                      />
                    </motion.div>
                  ) : (
                    <EmptyState />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-10 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1">
          Bản quyền Ms Ly AI <Sparkles size={14} className="text-indigo-400" />
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
