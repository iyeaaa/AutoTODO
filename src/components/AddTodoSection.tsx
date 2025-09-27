import { X, Plus } from 'lucide-react';
import type { Category, SubCategory } from '../types';

interface AddTodoSectionProps {
  newTodo: string;
  setNewTodo: (value: string) => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  newSubcategoryId: string;
  setNewSubcategoryId: (value: string) => void;
  newDueDate: string;
  setNewDueDate: (value: string) => void;
  categories: Category[];
  subcategories: SubCategory[];
  isLoading: boolean;
  isDark: boolean;
  onAddTodo: () => void;
  onCancelAI: () => void;
}

export default function AddTodoSection({
  newTodo,
  setNewTodo,
  newCategory,
  setNewCategory,
  newSubcategoryId,
  setNewSubcategoryId,
  newDueDate,
  setNewDueDate,
  categories,
  subcategories,
  isLoading,
  isDark,
  onAddTodo,
  onCancelAI,
}: AddTodoSectionProps) {
  return (
    <div className={`p-6 rounded-2xl mb-6 transition-all duration-500 animate-slide-in-up ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
    }`} style={{ animationDelay: '0.1s' }}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            {isLoading && (
              <div className={`absolute inset-0 rounded-xl flex items-center justify-center backdrop-blur-sm z-10 ${
                isDark ? 'bg-gray-800/80' : 'bg-white/80'
              }`}>
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    AI가 분석하고 있어요...
                  </p>
                </div>
              </div>
            )}
            <textarea
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="할일을 입력하세요&#10;여러 할일은 쉼표로 구분&#10;Enter: 추가, Shift+Enter: 개행"
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:scale-[1.02] resize-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 shadow-sm focus:shadow-md'
              } ${isLoading ? 'opacity-75' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAddTodo();
                }
              }}
              disabled={isLoading}
              rows={Math.max(1, Math.min(4, newTodo.split('\n').length))}
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                overflow: 'auto'
              }}
            />
            {isLoading ? (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className={`px-3 py-1 rounded-full text-xs ${
                  isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
                } flex items-center gap-2 animate-pulse`}>
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  AI 분석 중...
                </div>
              </div>
            ) : (newTodo.includes(',') || newTodo.includes('그리고') || newTodo.includes('및') || newTodo.includes('후에') || newTodo.includes('다음에')) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className={`px-2 py-1 rounded-full text-xs ${
                  isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'
                } flex items-center gap-1 animate-pulse`}>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  AI 분석 가능
                </div>
              </div>
            )}
          </div>
          {isLoading ? (
            <button
              onClick={onCancelAI}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <X className="w-4 h-4" />
              취소
            </button>
          ) : (
            <button
              onClick={onAddTodo}
              disabled={!newTodo.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              추가
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <select
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
              const newCat = categories.find(cat => cat.name === e.target.value);
              if (newCat) {
                const newCatSubcategories = subcategories.filter(sub => sub.parent_category_id === newCat.id);
                setNewSubcategoryId(newCatSubcategories.length > 0 ? newCatSubcategories[0].id : '');
              } else {
                setNewSubcategoryId('');
              }
            }}
            className={`px-3 py-3 text-base rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={newSubcategoryId}
            onChange={(e) => {
              setNewSubcategoryId(e.target.value);
            }}
            className={`px-3 py-3 text-base rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
            disabled={subcategories.filter(sub => {
              const category = categories.find(cat => cat.name === newCategory);
              return category && sub.parent_category_id === category.id;
            }).length === 0}
          >
            <option value="">서브카테고리 없음</option>
            {subcategories
              .filter(sub => {
                const category = categories.find(cat => cat.name === newCategory);
                return category && sub.parent_category_id === category.id;
              })
              .map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon} {sub.name}
                </option>
              ))}
          </select>

          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className={`px-3 py-3 text-base rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
          />
        </div>
      </div>
    </div>
  );
}