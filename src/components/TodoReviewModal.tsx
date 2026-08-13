import { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, CheckSquare, Square, Brain, Edit3 } from 'lucide-react';
import type { ReviewTodo, Category, SubCategory } from '../types';

interface TodoReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewTodos: ReviewTodo[];
  categories: Category[];
  subcategories: SubCategory[];
  isDark: boolean;
  onConfirm: (todos: ReviewTodo[]) => Promise<void>;
  isSubmitting: boolean;
  aiSummary?: string;
}

export default function TodoReviewModal({
  isOpen,
  onClose,
  reviewTodos: initialTodos,
  categories,
  subcategories,
  isDark,
  onConfirm,
  isSubmitting,
  aiSummary
}: TodoReviewModalProps) {
  const [todos, setTodos] = useState<ReviewTodo[]>(initialTodos);
  const [allSelected, setAllSelected] = useState(true);

  useEffect(() => {
    setTodos(initialTodos);
    setAllSelected(initialTodos.every(todo => todo.selected));
  }, [initialTodos]);

  const handleTodoChange = (id: string, field: keyof ReviewTodo, value: any) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, [field]: value } : todo
    ));
  };

  const handleToggleAll = () => {
    const newSelected = !allSelected;
    setTodos(prev => prev.map(todo => ({ ...todo, selected: newSelected })));
    setAllSelected(newSelected);
  };

  const handleToggleSelected = (id: string) => {
    setTodos(prev => {
      const updated = prev.map(todo =>
        todo.id === id ? { ...todo, selected: !todo.selected } : todo
      );
      setAllSelected(updated.every(todo => todo.selected));
      return updated;
    });
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => {
      const updated = prev.filter(todo => todo.id !== id);
      setAllSelected(updated.length > 0 && updated.every(todo => todo.selected));
      return updated;
    });
  };

  const handleConfirm = async () => {
    const selectedTodos = todos.filter(todo => todo.selected && todo.text.trim());

    // 유효성 검사
    const invalidTodos = selectedTodos.filter(todo => !todo.text.trim());
    if (invalidTodos.length > 0) {
      alert('빈 할일은 추가할 수 없습니다.');
      return;
    }

    // 중복 검사 (옵션)
    const duplicates = selectedTodos.filter((todo, index) =>
      selectedTodos.findIndex(t => t.text.trim().toLowerCase() === todo.text.trim().toLowerCase()) !== index
    );

    if (duplicates.length > 0) {
      const proceed = confirm('중복된 할일이 있습니다. 그래도 추가하시겠습니까?');
      if (!proceed) return;
    }

    if (selectedTodos.length > 0) {
      await onConfirm(selectedTodos);
    }
  };

  const selectedCount = todos.filter(todo => todo.selected).length;
  const validTodos = todos.filter(todo => todo.text.trim());

  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) {
      return { color: '#6B7280', icon: '📝' };
    }
    return { color: category.color, icon: category.icon };
  };

  const getSubCategoryInfo = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory || null;
  };

  const getCurrentCategorySubcategories = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? subcategories.filter(sub => sub.parent_category_id === category.id) : [];
  };

  const handleCategoryChange = (todoId: string, categoryName: string) => {
    handleTodoChange(todoId, 'category', categoryName);
    // 카테고리 변경 시 서브카테고리 초기화
    handleTodoChange(todoId, 'subcategory_id', null);
  };

  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden rounded-2xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } animate-scale-in`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI 할일 분석 결과
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                검토 후 추가할 할일을 선택해주세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* AI Summary */}
          {aiSummary && (
            <div className={`p-4 m-6 rounded-lg border-l-4 border-purple-500 ${
              isDark ? 'bg-purple-900/20 border-purple-400' : 'bg-purple-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  AI 분석 요약
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-600'}`}>
                {aiSummary}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleToggleAll}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span className="text-sm">전체 선택</span>
              </button>

              <div className="flex items-center gap-4">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedCount}개 선택됨 / 총 {validTodos.length}개
                </span>
              </div>
            </div>
          </div>

          {/* Todo List */}
          <div className="px-6 pb-6 space-y-4">
            {todos.map((todo, index) => {
              const categoryInfo = getCategoryInfo(todo.category);

              return (
                <div
                  key={todo.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    todo.selected
                      ? isDark
                        ? 'border-purple-500 bg-purple-900/10'
                        : 'border-purple-300 bg-purple-50'
                      : isDark
                        ? 'border-gray-700 bg-gray-750'
                        : 'border-gray-200 bg-gray-50'
                  } animate-slide-in-up`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleSelected(todo.id)}
                      className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        todo.selected
                          ? 'bg-purple-500 border-purple-500 text-white'
                          : isDark
                            ? 'border-gray-500 hover:border-purple-400'
                            : 'border-gray-300 hover:border-purple-500'
                      }`}
                    >
                      {todo.selected && <Check className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 space-y-3">
                      {/* Todo Text */}
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          할일 내용
                        </label>
                        <input
                          type="text"
                          value={todo.text}
                          onChange={(e) => handleTodoChange(todo.id, 'text', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                            !todo.text.trim()
                              ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                              : isDark
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                          placeholder="할일을 입력하세요"
                        />
                        {!todo.text.trim() && (
                          <p className="text-xs text-red-500 mt-1">할일 내용을 입력해주세요.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Category */}
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            카테고리
                          </label>
                          <div className="relative">
                            <select
                              value={todo.category}
                              onChange={(e) => handleCategoryChange(todo.id, e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : 'bg-white border-gray-300'
                              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                            </select>
                            <div
                              className="absolute right-10 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoryInfo.color }}
                            />
                          </div>
                        </div>

                        {/* Subcategory */}
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            서브카테고리
                          </label>
                          <div className="relative">
                            <select
                              value={todo.subcategory_id || ''}
                              onChange={(e) => handleTodoChange(todo.id, 'subcategory_id', e.target.value || null)}
                              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : 'bg-white border-gray-300'
                              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                              disabled={getCurrentCategorySubcategories(todo.category).length === 0}
                            >
                              <option value="">서브카테고리 없음</option>
                              {getCurrentCategorySubcategories(todo.category).map(subcategory => (
                                <option key={subcategory.id} value={subcategory.id}>
                                  {subcategory.icon} {subcategory.name}
                                </option>
                              ))}
                            </select>
                            {todo.subcategory_id && getSubCategoryInfo(todo.subcategory_id) && (
                              <div
                                className="absolute right-10 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full"
                                style={{ backgroundColor: getSubCategoryInfo(todo.subcategory_id)!.color }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            마감일
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={formatDateForInput(todo.due_date)}
                              onChange={(e) => handleTodoChange(todo.id, 'due_date', e.target.value || null)}
                              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : 'bg-white border-gray-300'
                              } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                            />
                            {todo.due_date && (
                              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className={`mt-1 p-2 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {todos.length === 0 && (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>분석된 할일이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            취소
          </button>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedCount}개 할일을 추가합니다
            </span>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSubmitting ? '추가 중...' : '할일 추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}