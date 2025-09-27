import { Circle } from 'lucide-react';
import { DragOverlay } from '@dnd-kit/core';
import DraggableTreeItem from './DraggableTreeItem';
import type { Todo, Category, SubCategory, DropZone } from '../types';

interface TodoListSectionProps {
  rootTodos: Todo[];
  hierarchicalTodos: Todo[];
  getChildrenOfTodo: (parentId: string) => Todo[];
  categories: Category[];
  subcategories: SubCategory[];
  isDark: boolean;
  editingTodoId: string | null;
  filter: 'all' | 'completed' | 'active';
  categoryFilter: string;
  subcategoryFilter: string;
  isLoading: boolean;
  activeDragId: string | null;
  dragOverInfo: { targetId: string; zone: DropZone } | null;
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (todoId: string) => void;
  onSaveEdit: (todoId: string, updates: Partial<Todo>) => Promise<void>;
  onCancelEdit: () => void;
  onAddSubTodo: (parentId: string, text?: string) => Promise<void>;
  onValidateParent: (childId: string, potentialParentId: string) => Promise<boolean>;
}

export default function TodoListSection({
  rootTodos,
  hierarchicalTodos,
  getChildrenOfTodo,
  categories,
  subcategories,
  isDark,
  editingTodoId,
  filter,
  categoryFilter,
  subcategoryFilter,
  isLoading,
  activeDragId,
  dragOverInfo,
  todos,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onAddSubTodo,
  onValidateParent,
}: TodoListSectionProps) {
  return (
    <div className="space-y-3">
      {rootTodos.map((todo, index) => (
        <div
          key={todo.id}
          className="animate-slide-in-up"
          style={{ animationDelay: `${0.3 + index * 0.05}s` }}
        >
          <DraggableTreeItem
            todo={todo}
            children={getChildrenOfTodo(todo.id)}
            allTodos={hierarchicalTodos}
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
            isSubmitting={isLoading}
            isParent={true}
            filterContext={{
              filter,
              categoryFilter,
              subcategoryFilter
            }}
            dragOverInfo={dragOverInfo}
          />
        </div>
      ))}

      {rootTodos.length === 0 && (
        <div className={`text-center py-16 transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-400'} animate-fade-in`}>
          <Circle className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
          <p className="text-lg">
            {filter === 'completed' ? '완료된 할일이 없습니다' :
             filter === 'active' ? '미완료 할일이 없습니다' :
             '할일을 추가해보세요'}
          </p>
        </div>
      )}

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeDragId ? (
          <div className={`p-4 rounded-xl shadow-lg border-2 border-blue-500 transform rotate-3 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            {todos.find(t => t.id === activeDragId)?.text}
          </div>
        ) : null}
      </DragOverlay>
    </div>
  );
}