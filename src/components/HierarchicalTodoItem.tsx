import React, { useState } from 'react';
import { Check, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { Todo, Category, SubCategory } from '../types';
import TodoInlineEdit from './TodoInlineEdit';
import SubTodoInput from './SubTodoInput';

interface HierarchicalTodoItemProps {
  todo: Todo;
  children?: Todo[];
  allTodos: Todo[];
  categories: Category[];
  subcategories: SubCategory[];
  isDark: boolean;
  editingTodoId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, updates: Partial<Todo>) => Promise<void>;
  onCancelEdit: () => void;
  onAddSubTodo: (parentId: string, text?: string) => void;
  onValidateParent?: (childId: string, potentialParentId: string) => Promise<boolean>;
  isSubmitting: boolean;
  depth?: number;
  showProgress?: boolean;
  isFiltered?: boolean; // 필터링에 직접 매치되었는지 여부
  filterContext?: {
    filter: string;
    categoryFilter: string;
    subcategoryFilter: string;
  };
}

const HierarchicalTodoItem: React.FC<HierarchicalTodoItemProps> = ({
  todo,
  children = [],
  allTodos,
  categories,
  subcategories,
  isDark,
  editingTodoId,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onAddSubTodo,
  onValidateParent,
  isSubmitting,
  depth = 0,
  showProgress = true,
  filterContext
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubTodo, setShowAddSubTodo] = useState(false);

  const hasChildren = children.length > 0;
  const indentationLevel = Math.min(depth, 3); // 최대 3단계까지만 들여쓰기
  const indentWidth = indentationLevel * 24; // 24px per level

  // 서브 투두들의 완료율 계산
  const getSubTodoProgress = () => {
    if (!hasChildren) return null;
    const completedChildren = children.filter(child => child.completed).length;
    const totalChildren = children.length;
    return {
      completed: completedChildren,
      total: totalChildren,
      percentage: totalChildren > 0 ? (completedChildren / totalChildren) * 100 : 0
    };
  };

  const progress = getSubTodoProgress();

  // 이 투두가 현재 필터에 직접 매치되는지 확인
  const matchesCurrentFilter = () => {
    if (!filterContext) return true; // 필터 컨텍스트가 없으면 모든 항목이 매치됨

    const { filter: statusFilter, categoryFilter, subcategoryFilter } = filterContext;

    // 상태 필터 체크
    if (statusFilter === 'completed' && !todo.completed) return false;
    if (statusFilter === 'active' && todo.completed) return false;

    // 카테고리 필터 체크
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

    // 서브카테고리 필터 체크
    if (subcategoryFilter !== 'all') {
      if (subcategoryFilter === 'none' && todo.subcategory_id) return false;
      if (subcategoryFilter !== 'none' && todo.subcategory_id !== subcategoryFilter) return false;
    }

    return true;
  };

  const directMatch = matchesCurrentFilter();

  // 필터링 상태에 따른 시각적 스타일
  const filterStyle = !directMatch ? 'opacity-50' : '';

  // depth에 따른 배경색과 테두리 스타일
  const getDepthStyles = () => {
    if (depth === 0) {
      return isDark
        ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
        : 'bg-white border-gray-200 shadow-sm hover:shadow-md';
    } else if (depth === 1) {
      return isDark
        ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
        : 'bg-blue-50/50 border-blue-200/50 hover:bg-blue-50';
    } else if (depth === 2) {
      return isDark
        ? 'bg-gray-600/30 border-gray-500 hover:bg-gray-600/50'
        : 'bg-purple-50/30 border-purple-200/30 hover:bg-purple-50/50';
    } else {
      return isDark
        ? 'bg-gray-500/20 border-gray-400 hover:bg-gray-500/30'
        : 'bg-green-50/20 border-green-200/20 hover:bg-green-50/30';
    }
  };

  // depth에 따른 연결선 색상
  const getConnectionLineColor = () => {
    if (depth === 1) return isDark ? 'border-blue-400' : 'border-blue-300';
    if (depth === 2) return isDark ? 'border-purple-400' : 'border-purple-300';
    return isDark ? 'border-green-400' : 'border-green-300';
  };

  return (
    <div className="relative">
      {/* 부모와의 연결선 */}
      {depth > 0 && (
        <div
          className={`absolute top-0 w-px h-6 ${getConnectionLineColor()}`}
          style={{ left: `${indentWidth - 12}px` }}
        />
      )}

      {/* 메인 투두 아이템 */}
      <div
        className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-500 transform hover:shadow-xl ${
          editingTodoId === todo.id
            ? isDark
              ? 'bg-blue-900/20 border-blue-500 scale-[1.02]'
              : 'bg-blue-50 border-blue-300 scale-[1.02]'
            : `${getDepthStyles()} hover:scale-[1.01]`
        } ${todo.completed ? 'opacity-75 hover:opacity-90' : ''} ${filterStyle}`}
        style={{ marginLeft: `${indentWidth}px` }}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* 확장/축소 버튼 (자식이 있는 경우에만) */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`mt-1 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                isDark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {/* 완료 체크박스 */}
          <button
            onClick={() => onToggle(todo.id)}
            className={`mt-1 flex-shrink-0 w-7 h-7 sm:w-6 sm:h-6 min-h-[44px] sm:min-h-0 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 touch-manipulation ${
              todo.completed
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white animate-check-mark'
                : isDark
                  ? 'border-gray-500 hover:border-green-400 hover:bg-green-400/10'
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
            } ${!hasChildren ? 'ml-6' : ''}`}
            disabled={editingTodoId === todo.id}
          >
            {todo.completed && <Check className="w-4 h-4 animate-bounce-in" />}
          </button>

          {/* 투두 내용 */}
          <div className="flex-1 min-w-0">
            <TodoInlineEdit
              todo={todo}
              categories={categories}
              subcategories={subcategories}
              allTodos={allTodos}
              isDark={isDark}
              isEditing={editingTodoId === todo.id}
              onStartEdit={() => onStartEdit(todo.id)}
              onSave={(updates) => onSaveEdit(todo.id, updates)}
              onCancel={onCancelEdit}
              onValidateParent={onValidateParent}
              isSubmitting={isSubmitting}
            />

            {/* 서브투두 진행바 */}
            {hasChildren && progress && showProgress && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    서브 항목 진행률
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {progress.completed}/{progress.total} ({Math.round(progress.percentage)}%)
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress.percentage === 100
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : progress.percentage > 50
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 서브투두 추가 버튼 */}
            {depth < 3 && (
              <button
                onClick={() => setShowAddSubTodo(true)}
                className={`opacity-60 sm:opacity-0 group-hover:opacity-100 p-2 min-h-[44px] transition-all duration-300 transform hover:scale-110 rounded-lg touch-manipulation ${
                  isDark
                    ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/20'
                    : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                }`}
                disabled={editingTodoId === todo.id || showAddSubTodo}
                title="서브 할일 추가"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* 삭제 버튼 */}
            <button
              onClick={() => onDelete(todo.id)}
              className="opacity-60 sm:opacity-0 group-hover:opacity-100 p-2 min-h-[44px] text-gray-400 hover:text-red-500 transition-all duration-300 transform hover:scale-110 hover:rotate-12 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
              disabled={editingTodoId === todo.id}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 서브투두 입력 */}
      {showAddSubTodo && (
        <SubTodoInput
          parentTodo={todo}
          isDark={isDark}
          onAdd={(text) => {
            onAddSubTodo(todo.id, text);
            setShowAddSubTodo(false);
          }}
          onCancel={() => setShowAddSubTodo(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 자식 투두들 */}
      {hasChildren && isExpanded && (
        <div className="mt-3 space-y-3">
          {children.map((childTodo) => {
            // 재귀적으로 이 자식의 자식들도 가져오기
            const grandChildren = allTodos.filter(todo => todo.parent_id === childTodo.id);

            return (
              <HierarchicalTodoItem
                key={childTodo.id}
                todo={childTodo}
                children={grandChildren}
                allTodos={allTodos}
                categories={categories}
                subcategories={subcategories}
                isDark={isDark}
                editingTodoId={editingTodoId}
                onToggle={onToggle}
                onDelete={onDelete}
                onStartEdit={onStartEdit}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onAddSubTodo={onAddSubTodo}
                onValidateParent={onValidateParent}
                isSubmitting={isSubmitting}
                depth={depth + 1}
                showProgress={showProgress}
                filterContext={filterContext}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HierarchicalTodoItem;