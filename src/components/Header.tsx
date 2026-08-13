import { Settings, Moon, Sun } from 'lucide-react';
import UserProfile from './UserProfile';

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
  onOpenCategoryManagement: () => void;
}

export default function Header({ isDark, onToggleDark, onOpenCategoryManagement }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 animate-fade-in-down">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-light transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          할일
        </h1>
        <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          오늘 해야 할 일들을 정리해보세요
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCategoryManagement}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-purple-400'
              : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-purple-600 shadow-lg hover:shadow-xl'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleDark}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-yellow-400'
              : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-blue-600 shadow-lg hover:shadow-xl'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <UserProfile isDark={isDark} />
      </div>
    </div>
  );
}