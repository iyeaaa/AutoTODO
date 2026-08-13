import React, { useState, useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Check, Trash2, Plus, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import type { Todo, Category, SubCategory, DropZone, DropIndicator } from '../types';
import TodoInlineEdit from './TodoInlineEdit';
import SubTodoInput from './SubTodoInput';

interface DraggableTreeItemProps {
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
  isParent?: boolean;
  showProgress?: boolean;
  filterContext?: {
    filter: string;
    categoryFilter: string;
    subcategoryFilter: string;
  };
  dragOverInfo?: { targetId: string; zone: DropZone } | null;
}

const DraggableTreeItem: React.FC<DraggableTreeItemProps> = ({
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
  isParent = !todo.parent_id,
  showProgress = true,
  filterContext,
  dragOverInfo
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubTodo, setShowAddSubTodo] = useState(false);

  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = children.length > 0;

  // 드래그 설정
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging
  } = useDraggable({
    id: todo.id,
    data: {
      type: 'todo',
      todo,
      isParent
    }
  });

  // 드롭 설정
  const {
    setNodeRef: setDropRef,
    isOver
  } = useDroppable({
    id: todo.id,
    data: {
      type: 'todo',
      todo,
      isParent,
      accepts: ['todo']
    }
  });

  // 드롭존 정보 업데이트 (상위에서 전달받은 정보 사용)
  const currentDropIndicator: DropIndicator = dragOverInfo && dragOverInfo.targetId === todo.id
    ? {
        position: dragOverInfo.zone as 'before' | 'inside' | 'after',
        isValid: true,
        targetType: isParent ? 'parent' : 'child'
      }
    : {
        position: null,
        isValid: false,
        targetType: null
      };

  // refs 결합
  const setRefs = (node: HTMLDivElement) => {
    setDragRef(node);
    setDropRef(node);
    itemRef.current = node;
  };

  // 서브 투두 완료율 계산
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
  const indentWidth = isParent ? 0 : 24; // 2-레벨이므로 부모는 0, 자식은 24px

  // 필터링 상태 확인
  const matchesCurrentFilter = () => {
    if (!filterContext) return true;
    const { filter: statusFilter, categoryFilter, subcategoryFilter } = filterContext;

    if (statusFilter === 'completed' && !todo.completed) return false;
    if (statusFilter === 'active' && todo.completed) return false;
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

    if (subcategoryFilter !== 'all') {
      if (subcategoryFilter === 'none' && todo.subcategory_id) return false;
      if (subcategoryFilter !== 'none' && todo.subcategory_id !== subcategoryFilter) return false;
    }

    return true;
  };

  const directMatch = matchesCurrentFilter();
  const filterStyle = !directMatch ? 'opacity-50' : '';

  // 드래그 중 스타일
  const dragStyle = isDragging ? 'opacity-50 transform scale-95' : '';

  // 드롭 인디케이터 스타일
  const getDropIndicatorStyle = () => {
    if (!isOver || !currentDropIndicator.position) return '';

    const baseStyle = 'border-2 border-dashed';
    const colorStyle = currentDropIndicator.isValid
      ? 'border-blue-500'
      : 'border-red-500';

    switch (currentDropIndicator.position) {
      case 'before':
        return `${baseStyle} ${colorStyle} border-t-4 border-l-0 border-r-0 border-b-0`;
      case 'after':
        return `${baseStyle} ${colorStyle} border-b-4 border-l-0 border-r-0 border-t-0`;
      case 'inside':
        return `${baseStyle} ${colorStyle} bg-blue-50 dark:bg-blue-900/20`;
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      {/* 부모와의 연결선 */}
      {!isParent && (
        <div
          className="absolute top-0 w-px h-6 border-gray-300 dark:border-gray-600"
          style={{ left: '12px' }}
        />
      )}

      {/* 메인 투두 아이템 */}
      <div
        ref={setRefs}
        className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
          editingTodoId === todo.id
            ? isDark
              ? 'bg-blue-900/20 border-blue-500'
              : 'bg-blue-50 border-blue-300'
            : isDark
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
              : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
        } ${todo.completed ? 'opacity-75 hover:opacity-90' : ''} ${filterStyle} ${dragStyle} ${getDropIndicatorStyle()}`}
        style={{ marginLeft: `${indentWidth}px` }}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* 드래그 핸들 */}
          <div
            {...dragAttributes}
            {...dragListeners}
            className={`mt-1 flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing transition-colors ${
              isDark
                ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* 확장/축소 버튼 (부모이고 자식이 있는 경우에만) */}
          {isParent && hasChildren && (
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
            } ${!hasChildren && isParent ? 'ml-6' : ''}`}
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

            {/* 서브투두 진행바 (부모만) */}
            {isParent && hasChildren && progress && showProgress && (
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
            {/* 서브투두 추가 버튼 (부모만) */}
            {isParent && (
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
      {showAddSubTodo && isParent && (
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

      {/* 자식 투두들 (부모이고 확장된 경우만) */}
      {isParent && hasChildren && isExpanded && (
        <div className="mt-3 space-y-3">
          {children.map((childTodo) => (
            <DraggableTreeItem
              key={childTodo.id}
              todo={childTodo}
              children={[]} // 자식은 자식을 가질 수 없음 (2-레벨 제한)
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
              isParent={false} // 자식임을 명시
              showProgress={showProgress}
              filterContext={filterContext}
              dragOverInfo={dragOverInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DraggableTreeItem;