import { useState } from 'react';
import type { Todo, Category, SubCategory, ReviewTodo, TreeState, DropZone } from '../types';

export const useTodoState = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [newCategory, setNewCategory] = useState('개인');
  const [newSubcategoryId, setNewSubcategoryId] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTodos, setReviewTodos] = useState<ReviewTodo[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [lastInputBeforeAI, setLastInputBeforeAI] = useState<string>('');
  const [lastCategoryBeforeAI, setLastCategoryBeforeAI] = useState<string>('');
  const [lastDueDateBeforeAI, setLastDueDateBeforeAI] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [treeState, setTreeState] = useState<TreeState>({ nodes: {}, rootOrder: [], children: {} });
  const [dragOverInfo, setDragOverInfo] = useState<{ targetId: string; zone: DropZone } | null>(null);

  return {
    // Todo states
    todos,
    setTodos,
    newTodo,
    setNewTodo,

    // UI states
    isDark,
    setIsDark,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,

    // Form states
    newCategory,
    setNewCategory,
    newSubcategoryId,
    setNewSubcategoryId,
    newDueDate,
    setNewDueDate,

    // Loading states
    isLoading,
    setIsLoading,

    // Category states
    categories,
    setCategories,
    subcategories,
    setSubcategories,

    // Modal states
    showCategoryManagement,
    setShowCategoryManagement,
    showReviewModal,
    setShowReviewModal,

    // AI states
    reviewTodos,
    setReviewTodos,
    aiSummary,
    setAiSummary,
    lastInputBeforeAI,
    setLastInputBeforeAI,
    lastCategoryBeforeAI,
    setLastCategoryBeforeAI,
    lastDueDateBeforeAI,
    setLastDueDateBeforeAI,
    abortController,
    setAbortController,

    // Edit states
    editingTodoId,
    setEditingTodoId,

    // Drag & Drop states
    activeDragId,
    setActiveDragId,
    treeState,
    setTreeState,
    dragOverInfo,
    setDragOverInfo,
  };
};

export type TodoState = ReturnType<typeof useTodoState>;