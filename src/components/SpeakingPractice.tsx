import React, { useRef } from 'react';
import {
  Mic, Square, RefreshCw, ThumbsUp, CheckCircle, AlertCircle,
  Star, Trophy, Zap, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { EvaluationResult, EnglishLevel } from '../services/geminiService';

interface Props {
  readingText: string;
  isRecording: boolean;
  isEvaluating: boolean;
  evaluation: EvaluationResult | null;
  studentName: string;
  setStudentName: (n: string) => void;
  teacherName: string;
  setTeacherName: (n: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  generatedTopicName: string | null;
  topic: string;
  level: EnglishLevel;
}

export default function SpeakingPractice({
  readingText, isRecording, isEvaluating, evaluation,
  studentName, setStudentName, teacherName, setTeacherName,
  startRecording, stopRecording, generatedTopicName, topic, level
}: Props) {
  const [showCertificate, setShowCertificate] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!certificateRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(certificateRef.current, {
        useCORS: true, allowTaint: false, scale: 3, backgroundColor: '#ffffff', logging: false, imageTimeout: 0,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `:root { --color-indigo-50: #f5f3ff !important; } * { color-scheme: light !important; }`;
          clonedDoc.head.appendChild(style);
        },
        ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore'),
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Certificate_${studentName || 'Student'}.png`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    } catch { /* silent */ } finally { setIsDownloading(false); }
  };

  return (
    <div className="w-full max-w-[600px] mt-1 space-y-2">
      <div className="flex flex-col items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 transition-colors">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
          <Mic size={16} className="text-pink-500" />
          <span className="text-pink-700 dark:text-pink-400">Ms Ly English: Luyện nói cùng cô giáo</span>
        </div>

        {/* Record button */}
        {!evaluation && !isEvaluating && (
          <button onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-3 px-5 sm:px-6 py-3 rounded-2xl font-black text-white transition-all shadow-xl text-sm sm:text-base
              ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-105' : 'bg-pink-500 hover:bg-pink-600 hover:-translate-y-1'}`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
            {isRecording ? 'Đang nghe bé nói...' : 'Bắt đầu luyện nói'}
          </button>
        )}

        {isRecording && (
          <p className="text-[10px] text-red-400 font-bold animate-pulse">
            Mẹo: Sau khi đọc xong, bé chờ 1 giây rồi hãy nhấn nút dừng nhé!
          </p>
        )}

        {/* Evaluating spinner */}
        {isEvaluating && (
          <div className="flex flex-col items-center gap-3 py-4 animate-pulse">
            <RefreshCw className="animate-spin text-pink-500" size={32} />
            <div className="text-center">
              <p className="text-sm font-black text-pink-600 dark:text-pink-400">Cô Ly đang nghe và chấm điểm cho con nhé...</p>
              <p className="text-[10px] text-pink-400 dark:text-pink-500 font-medium">Bé chờ cô một chút xíu thôi!</p>
            </div>
          </div>
        )}

        {/* Evaluation Results */}
        {evaluation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">
            {!evaluation.isComplete ? (
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-100 dark:border-red-800 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center"><RefreshCw size={20} /></div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Chưa hoàn thành</div>
                    <div className="text-sm font-medium">Bé cần đọc lại đầy đủ nhé!</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"{evaluation.feedback}"</p>
                {evaluation.missingContent && (
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border border-red-200 dark:border-red-700 text-xs text-red-700 dark:text-red-300">
                    <span className="font-bold">Phần thiếu:</span> {evaluation.missingContent}
                  </div>
                )}
                <button onClick={startRecording}
                  className="w-full py-2 bg-red-500 text-white rounded-lg font-bold text-xs hover:bg-red-600 transition-colors">
                  Đọc lại ngay
                </button>
              </div>
            ) : (
              <>
                {/* Score Card */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/30 p-4 sm:p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-md gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-yellow-200 rotate-3">
                      <Star size={28} fill="currentColor" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Điểm số & CEFR</div>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300">{evaluation.score}</div>
                        <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-black shadow-sm">{evaluation.cefrLevel}</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={startRecording}
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border-2 border-indigo-100 dark:border-indigo-700 rounded-xl font-bold text-sm hover:border-indigo-400 transition-all shadow-sm active:scale-95">
                    Thử lại
                  </button>
                </div>

                {/* Criteria */}
                {evaluation.criteriaScores && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl border-2 border-indigo-50 dark:border-indigo-900 shadow-sm">
                    {Object.entries(evaluation.criteriaScores).map(([key, score]) => (
                      <div key={key} className="text-center p-2 sm:p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                        <div className="text-[8px] sm:text-[9px] font-bold text-indigo-400 uppercase leading-tight mb-1">
                          {key === 'pronunciation' ? 'Phát âm' : key === 'stress' ? 'Trọng âm' : key === 'intonation' ? 'Ngữ điệu' : key === 'fluency' ? 'Trôi chảy' : 'Nối âm'}
                        </div>
                        <div className="text-lg font-black text-indigo-600 dark:text-indigo-300">{score}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800 shadow-md space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-xl border border-green-100 dark:border-green-800">
                    <ThumbsUp size={20} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic">"{evaluation.feedback}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-md flex items-center justify-center"><CheckCircle size={14} /></div>
                        <div className="text-xs font-black uppercase tracking-wider">Ưu điểm</div>
                      </div>
                      <div className="space-y-2">
                        {evaluation.strengths.map((s, i) => (
                          <div key={i} className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-green-50/30 dark:bg-green-900/10 p-2 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <div className="w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-md flex items-center justify-center"><AlertCircle size={14} /></div>
                        <div className="text-xs font-black uppercase tracking-wider">Cần chú ý</div>
                      </div>
                      <div className="space-y-2">
                        {evaluation.improvements.map((imp, i) => (
                          <div key={i} className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-orange-50/30 dark:bg-orange-900/10 p-2 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />{imp}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* IPA */}
                  {evaluation.ipaAnalysis && evaluation.ipaAnalysis.length > 0 && (
                    <div className="pt-4 border-t-2 border-slate-50 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-lg flex items-center justify-center"><Zap size={18} /></div>
                        <div className="text-xs font-black uppercase tracking-widest">Phân tích IPA</div>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[400px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800">
                              <th className="p-2 sm:p-3 text-[10px] sm:text-xs font-black text-slate-500 uppercase">Từ</th>
                              <th className="p-2 sm:p-3 text-[10px] sm:text-xs font-black text-green-600 uppercase">Chuẩn</th>
                              <th className="p-2 sm:p-3 text-[10px] sm:text-xs font-black text-red-500 uppercase">Bé đọc</th>
                              <th className="p-2 sm:p-3 text-[10px] sm:text-xs font-black text-indigo-400 uppercase">Mẹo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                            {evaluation.ipaAnalysis.map((item, idx) => (
                              <tr key={idx} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                                <td className="p-2 sm:p-3 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300">{item.word}</td>
                                <td className="p-2 sm:p-3 text-sm sm:text-base font-serif font-bold text-green-600">{item.correctIpa}</td>
                                <td className="p-2 sm:p-3 text-sm sm:text-base font-serif font-bold text-red-500">{item.studentIpa}</td>
                                <td className="p-2 sm:p-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.tip}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Practice */}
                  {(evaluation.standardSentences?.length || 0) > 0 && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Câu mẫu luyện tập</div>
                        {evaluation.standardSentences?.map((sentence, idx) => (
                          <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-100 dark:border-gray-600 mb-1">{sentence}</p>
                        ))}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Bài tập đề xuất</div>
                        <div className="flex flex-wrap gap-2">
                          {evaluation.personalizedExercises?.map((ex, idx) => (
                            <div key={idx} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">{ex}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certificate */}
                  <div className="pt-4 border-t border-indigo-50 dark:border-indigo-900 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Tên học sinh</label>
                        <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Nhập tên bé..."
                          className="w-full px-3 py-2 text-xs border border-indigo-100 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Tên giáo viên</label>
                        <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="Tên giáo viên..."
                          className="w-full px-3 py-2 text-xs border border-indigo-100 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                      </div>
                    </div>
                    <button onClick={() => setShowCertificate(true)}
                      className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-orange-200 hover:-translate-y-1">
                      <Trophy size={18} className="animate-bounce" /> NHẬN GIẤY CHỨNG NHẬN!
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && evaluation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCertificate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowCertificate(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10">
                <X size={20} />
              </button>
              <div className="p-4 sm:p-8 overflow-auto max-h-[85vh]">
                <div ref={certificateRef}
                  className="relative w-full aspect-[1.414/1] bg-white p-6 sm:p-12 flex flex-col items-center justify-between text-center font-serif"
                  style={{ border: '16px double #EAB308', backgroundImage: 'radial-gradient(circle at 2px 2px, #fef3c7 1px, transparent 0)', backgroundSize: '32px 32px', backgroundColor: '#ffffff' }}>
                  <div className="absolute top-4 left-4 w-16 sm:w-20 h-16 sm:h-20 rounded-tl-lg" style={{ borderTop: '8px solid #FACC15', borderLeft: '8px solid #FACC15' }} />
                  <div className="absolute top-4 right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-tr-lg" style={{ borderTop: '8px solid #FACC15', borderRight: '8px solid #FACC15' }} />
                  <div className="absolute bottom-4 left-4 w-16 sm:w-20 h-16 sm:h-20 rounded-bl-lg" style={{ borderBottom: '8px solid #FACC15', borderLeft: '8px solid #FACC15' }} />
                  <div className="absolute bottom-4 right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-br-lg" style={{ borderBottom: '8px solid #FACC15', borderRight: '8px solid #FACC15' }} />
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(to bottom right, #1E40AF, #3B82F6)', border: '4px solid #ffffff', color: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <Trophy size={40} style={{ color: '#ffffff' }} />
                      </div>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-widest" style={{ color: '#1E3A8A' }}>Certificate of Excellence</h1>
                    <p className="text-base sm:text-xl italic font-medium" style={{ color: '#3B82F6' }}>This award is proudly presented to</p>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-3xl sm:text-6xl font-black pb-4 font-serif italic" style={{ color: '#1E3A8A', borderBottom: '4px solid #DBEAFE' }}>
                      {studentName || "Little Star"}
                    </h2>
                    <div className="space-y-1">
                      <p className="text-base sm:text-xl font-medium" style={{ color: '#4B5563' }}>For outstanding performance in English Speaking</p>
                      <p className="text-sm sm:text-lg font-bold italic" style={{ color: '#6B7280' }}>Topic: {generatedTopicName || topic || "General English"}</p>
                    </div>
                    <div className="inline-block px-4 sm:px-6 py-2 rounded-full text-lg sm:text-2xl font-black uppercase tracking-widest" style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', border: '2px solid #DBEAFE' }}>
                      Level: {level}
                    </div>
                  </div>
                  <div className="px-6 sm:px-12 py-4 sm:py-6 rounded-[2rem]" style={{ background: 'linear-gradient(to bottom right, #F0F9FF, #E0F2FE)', border: '4px solid #ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                    <p className="text-xs uppercase font-black tracking-[0.2em] mb-2" style={{ color: '#3B82F6' }}>Final Score</p>
                    <p className="text-4xl sm:text-6xl font-black" style={{ color: '#1E40AF' }}>{evaluation.score}<span className="text-xl sm:text-2xl" style={{ color: '#60A5FA' }}>/10</span></p>
                  </div>
                  <div className="w-full flex justify-between items-end pt-8 sm:pt-12 px-4 sm:px-8">
                    <div className="text-left space-y-2">
                      <p className="text-xs sm:text-sm font-black" style={{ color: '#1E40AF' }}>{new Date().toLocaleDateString('vi-VN')}</p>
                      <div className="w-32 sm:w-48" style={{ borderBottom: '2px solid #DBEAFE' }} />
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest" style={{ color: '#3B82F6' }}>Date of Issue</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-base sm:text-xl font-black font-serif italic" style={{ color: '#1E3A8A' }}>{teacherName}</p>
                      <div className="w-32 sm:w-48" style={{ borderBottom: '2px solid #DBEAFE' }} />
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest" style={{ color: '#3B82F6' }}>Head Teacher</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex gap-3 sm:gap-4">
                <button onClick={() => setShowCertificate(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm">
                  Đóng
                </button>
                <button onClick={downloadCertificate} disabled={isDownloading}
                  className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 text-sm">
                  {isDownloading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                  Tải Chứng Nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
