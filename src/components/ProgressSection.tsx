import type { Todo } from '../types';

interface ProgressSectionProps {
  todos: Todo[];
  isDark: boolean;
}

export default function ProgressSection({ todos, isDark }: ProgressSectionProps) {
  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount ? (completedCount / totalCount) * 100 : 0;

  if (todos.length === 0) return null;

  return (
    <div className={`p-6 rounded-2xl mb-6 transition-all duration-500 animate-slide-in-up ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            전체 진행률
          </span>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            모든 할일(서브 할일 포함)
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-mono transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {completedCount}/{totalCount}
          </span>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {Math.round(progressPercent)}%
          </p>
        </div>
      </div>
      <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}