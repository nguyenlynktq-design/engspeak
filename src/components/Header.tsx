import { Sparkles, CheckCircle2, Key, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Header() {
  const { setShowApiModal, hasApiKey, theme, toggleTheme } = useAppContext();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-yellow-100 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-200 dark:shadow-yellow-900/20">
            <Sparkles size={20} />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white font-serif italic">Ms Ly English</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> Fun Learning</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> Kids Friendly</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
            title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* API Key button */}
          <button
            onClick={() => setShowApiModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              hasApiKey
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50'
                : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 animate-pulse'
            }`}
          >
            <Key size={14} />
            <span className="hidden sm:inline">{hasApiKey ? 'API Key ✓' : 'Nhập API Key'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
