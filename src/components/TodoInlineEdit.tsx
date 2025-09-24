import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Calendar, Edit3, ChevronDown } from 'lucide-react';
import type { Todo, Category, SubCategory } from '../types';

interface TodoInlineEditProps {
  todo: Todo;
  categories: Category[];
  subcategories: SubCategory[];
  allTodos?: Todo[];
  isDark: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (updates: Partial<Todo>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  onValidateParent?: (childId: string, potentialParentId: string) => Promise<boolean>;
}

export default function TodoInlineEdit({
  todo,
  categories,
  subcategories,
  allTodos = [],
  isDark,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isSubmitting,
  onValidateParent
}: TodoInlineEditProps) {
  const [editText, setEditText] = useState(todo.text);
  const [editCategory, setEditCategory] = useState(todo.category);
  const [editSubcategoryId, setEditSubcategoryId] = useState(todo.subcategory_id || '');
  const [editDueDate, setEditDueDate] = useState(todo.due_date || '');
  const [editParentId, setEditParentId] = useState(todo.parent_id || '');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [parentValidationError, setParentValidationError] = useState('');

  const textInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 카테고리의 서브카테고리들 필터링
  const currentCategorySubcategories = subcategories.filter(sub => {
    const category = categories.find(cat => cat.name === editCategory);
    return category && sub.parent_category_id === category.id;
  });

  // 가능한 부모 투두들 필터링 (자기 자신과 자신의 후손들 제외)
  const getPotentialParents = () => {
    if (!allTodos.length) return [];

    // 자기 자신과 자신의 후손들을 제외
    const excludeIds = new Set([todo.id]);

    // 자신의 모든 후손 찾기 (재귀적)
    const findDescendants = (parentId: string) => {
      const children = allTodos.filter(t => t.parent_id === parentId);
      for (const child of children) {
        excludeIds.add(child.id);
        findDescendants(child.id);
      }
    };

    findDescendants(todo.id);

    return allTodos
      .filter(t => !excludeIds.has(t.id) && !t.parent_id) // 부모 노드들만 (2-레벨 제한)
      .sort((a, b) => a.text.localeCompare(b.text));
  };

  useEffect(() => {
    if (isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = async () => {
    if (!editText.trim()) return;

    // 부모 변경 유효성 검사
    if (editParentId && editParentId !== todo.parent_id) {
      if (onValidateParent) {
        const isValid = await onValidateParent(todo.id, editParentId);
        if (!isValid) {
          setParentValidationError('순환 참조가 발생하거나 최대 깊이를 초과합니다.');
          return;
        }
      }
    }

    const updates: Partial<Todo> = {
      text: editText.trim(),
      category: editCategory,
      subcategory_id: editSubcategoryId || null,
      due_date: editDueDate || null,
      parent_id: editParentId || null,
    };

    await onSave(updates);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditCategory(todo.category);
    setEditSubcategoryId(todo.subcategory_id || '');
    setEditDueDate(todo.due_date || '');
    setEditParentId(todo.parent_id || '');
    setParentValidationError('');
    onCancel();
  };

  const handleCategoryChange = (categoryName: string) => {
    setEditCategory(categoryName);
    // 카테고리 변경 시 서브카테고리 초기화
    setEditSubcategoryId('');
    setShowCategoryDropdown(false);
  };

  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category || { color: '#6B7280', icon: '📝' };
  };

  const getSubCategoryInfo = (subcategoryId: string) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory || null;
  };

  const formatDateForInput = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  if (!isEditing) {
    // 읽기 모드
    const categoryInfo = getCategoryInfo(todo.category);
    const subcategoryInfo = todo.subcategory_id ? getSubCategoryInfo(todo.subcategory_id) : null;

    return (
      <div
        className="group cursor-pointer"
        onClick={onStartEdit}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`transition-all duration-300 ${
                todo.completed
                  ? 'line-through text-gray-500'
                  : isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {todo.text}
              </span>
              <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-blue-500 transition-all">
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {/* 카테고리 */}
              <span
                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1"
                style={{
                  backgroundColor: `${categoryInfo.color}20`,
                  color: categoryInfo.color,
                }}
              >
                {categoryInfo.icon && <span>{categoryInfo.icon}</span>}
                {todo.category}
              </span>

              {/* 서브카테고리 */}
              {subcategoryInfo && (
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1"
                  style={{
                    backgroundColor: `${subcategoryInfo.color}15`,
                    color: subcategoryInfo.color,
                  }}
                >
                  {subcategoryInfo.icon && <span>{subcategoryInfo.icon}</span>}
                  {subcategoryInfo.name}
                </span>
              )}

              {/* 마감일 */}
              {todo.due_date && (
                <span className={`flex items-center gap-1 transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {new Date(todo.due_date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 편집 모드
  return (
    <div className="space-y-3">
      {/* 텍스트 편집 */}
      <div>
        <input
          ref={textInputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 focus:outline-none ${
            isDark
              ? 'bg-gray-700 border-blue-500 text-white placeholder-gray-400'
              : 'bg-white border-blue-500 shadow-sm'
          }`}
          placeholder="할일을 입력하세요"
          disabled={isSubmitting}
        />
      </div>

      {/* 카테고리 및 서브카테고리 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 카테고리 선택 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 flex items-center justify-between ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500'
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
            disabled={isSubmitting}
          >
            <div className="flex items-center gap-2">
              <span>{getCategoryInfo(editCategory).icon}</span>
              <span>{editCategory}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showCategoryDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-10 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    editCategory === category.name
                      ? isDark ? 'bg-gray-600' : 'bg-gray-100'
                      : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 서브카테고리 선택 */}
        <div>
          <select
            value={editSubcategoryId}
            onChange={(e) => setEditSubcategoryId(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
            disabled={isSubmitting || currentCategorySubcategories.length === 0}
          >
            <option value="">서브카테고리 없음</option>
            {currentCategorySubcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.icon} {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 부모 투두 선택 */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          상위 할일 (선택사항)
        </label>
        <select
          value={editParentId}
          onChange={(e) => {
            setEditParentId(e.target.value);
            setParentValidationError('');
          }}
          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
            parentValidationError
              ? 'border-red-500'
              : isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
          }`}
          disabled={isSubmitting}
        >
          <option value="">최상위 할일로 설정</option>
          {getPotentialParents().map(parentTodo => (
            <option key={parentTodo.id} value={parentTodo.id}>
              └ {parentTodo.text}
            </option>
          ))}
        </select>
        {parentValidationError && (
          <p className="mt-1 text-sm text-red-500">{parentValidationError}</p>
        )}
      </div>

      {/* 날짜 선택 */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          마감일 (선택사항)
        </label>
        <input
          type="date"
          value={formatDateForInput(editDueDate)}
          onChange={(e) => setEditDueDate(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300'
          }`}
          disabled={isSubmitting}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className={`px-3 py-1 rounded-lg transition-colors ${
            isDark
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={!editText.trim() || isSubmitting}
          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}