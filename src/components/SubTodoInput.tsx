import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import type { Todo } from '../types';

interface SubTodoInputProps {
  parentTodo: Todo;
  isDark: boolean;
  onAdd: (text: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SubTodoInput: React.FC<SubTodoInputProps> = ({
  parentTodo,
  isDark,
  onAdd,
  onCancel,
  isSubmitting = false
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 컴포넌트가 마운트되면 자동으로 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  // 2-레벨 시스템: 부모의 자식이므로 항상 24px 들여쓰기
  const indentWidth = 24;

  return (
    <div
      className="relative mt-3"
      style={{ marginLeft: `${indentWidth}px` }}
    >
      {/* 부모와의 연결선 */}
      <div
        className="absolute top-0 w-px h-6 border-blue-300 dark:border-blue-600"
        style={{ left: `${-12}px` }}
      />

      <div className={`p-4 rounded-xl border-2 border-dashed transition-all duration-300 ${
        isDark
          ? 'bg-gray-800/50 border-gray-600 focus-within:border-blue-500'
          : 'bg-blue-50/30 border-blue-200 focus-within:border-blue-400'
      }`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center ${
              isDark ? 'border-gray-500 text-gray-500' : 'border-gray-400 text-gray-400'
            }`}>
              <Plus className="w-3 h-3" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${parentTodo.text}의 세부 항목을 입력하세요`}
              className={`flex-1 px-3 py-2 bg-transparent border-0 outline-none text-sm placeholder:text-gray-400 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}
              disabled={isSubmitting}
            />

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                  !text.trim() || isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:hover:scale-100`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                  isDark
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-400 hover:bg-gray-500 text-white'
                } disabled:opacity-50 disabled:hover:scale-100`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 부모 투두 정보 표시 */}
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} px-9`}>
            상위 항목: "{parentTodo.text}" · 카테고리: {parentTodo.category}
            {parentTodo.due_date && (
              <span className="ml-2">
                · 기한: {new Date(parentTodo.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubTodoInput;