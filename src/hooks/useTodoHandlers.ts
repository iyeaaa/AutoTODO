import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Todo, Category, SubCategory, ReviewTodo, DropZone } from '../types';
import { parseTextToTodos } from '../lib/gemini';
import { storage } from '../utils/supabaseStorage';
import { treeStateToTodos, moveTodo, isValidDrop } from '../utils/treeOperations';
import type { TodoState } from './useTodoState';

export const useTodoHandlers = (state: TodoState) => {
  const {
    todos,
    setTodos,
    newTodo,
    setNewTodo,
    categories,
    subcategories,
    newCategory,
    setNewCategory,
    newSubcategoryId,
    setNewSubcategoryId,
    newDueDate,
    setNewDueDate,
    setIsLoading,
    abortController,
    setAbortController,
    lastInputBeforeAI,
    setLastInputBeforeAI,
    lastCategoryBeforeAI,
    setLastCategoryBeforeAI,
    lastDueDateBeforeAI,
    setLastDueDateBeforeAI,
    setReviewTodos,
    setAiSummary,
    setShowReviewModal,
    setEditingTodoId,
    setActiveDragId,
    treeState,
    dragOverInfo,
    setDragOverInfo,
  } = state;

  const updateDarkModeClass = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const addTodo = async () => {
    console.log('🎯 Add todo button clicked:', { newTodo: newTodo.trim(), hasContent: !!newTodo.trim() });

    if (newTodo.trim()) {
      if (newTodo.includes(',') || newTodo.includes('그리고') || newTodo.includes('및') || newTodo.includes('후에') || newTodo.includes('다음에')) {
        setLastInputBeforeAI(newTodo);
        setLastCategoryBeforeAI(newCategory);
        setLastDueDateBeforeAI(newDueDate);

        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        setNewTodo('');
        setNewDueDate('');
        setNewSubcategoryId('');

        try {
          const categoryNames = categories.map(cat => cat.name);
          const subcategoryData = categories.map(cat => ({
            category: cat.name,
            subcategories: subcategories
              .filter(sub => sub.parent_category_id === cat.id)
              .map(sub => ({ id: sub.id, name: sub.name }))
          }));

          const response = await parseTextToTodos(newTodo, categoryNames, subcategoryData);

          if (controller.signal.aborted) {
            return;
          }

          if (response.todos && response.todos.length > 0) {
            const reviewItems: ReviewTodo[] = response.todos.map((parsedTodo, index) => {
              let subcategoryId = null;
              if (parsedTodo.subcategory && parsedTodo.category) {
                const category = categories.find(cat => cat.name === parsedTodo.category);
                if (category) {
                  const subcategory = subcategories.find(sub =>
                    sub.parent_category_id === category.id && sub.name === parsedTodo.subcategory
                  );
                  subcategoryId = subcategory?.id || null;
                }
              }

              return {
                id: `review_${Date.now()}_${index}`,
                text: parsedTodo.title,
                category: parsedTodo.category || lastCategoryBeforeAI,
                subcategory_id: subcategoryId,
                due_date: parsedTodo.dueDate || null,
                parent_id: null,
                selected: true,
              };
            });

            setReviewTodos(reviewItems);
            setAiSummary(response.summary || '');
            setShowReviewModal(true);
          } else {
            restoreOriginalInput();
            addSimpleTodo();
          }
        } catch (error: any) {
          console.error('Failed to parse todos:', error);
          if (!controller.signal.aborted) {
            const errorMessage = error.message || 'AI 분석 중 오류가 발생했습니다';
            alert(`❌ ${errorMessage}\n\n원래 입력을 복원하고 단순 추가 모드로 전환합니다.`);
            restoreOriginalInput();
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
            setAbortController(null);
          }
        }
      } else {
        addSimpleTodo();
        setNewTodo('');
        setNewDueDate('');
        setNewSubcategoryId('');
      }
    }
  };

  const cancelAIAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    restoreOriginalInput();
  };

  const restoreOriginalInput = () => {
    setNewTodo(lastInputBeforeAI);
    setNewCategory(lastCategoryBeforeAI);
    setNewDueDate(lastDueDateBeforeAI);
    const category = categories.find(cat => cat.name === lastCategoryBeforeAI);
    if (category) {
      const catSubcategories = subcategories.filter(sub => sub.parent_category_id === category.id);
      setNewSubcategoryId(catSubcategories.length > 0 ? catSubcategories[0].id : '');
    }
    setLastInputBeforeAI('');
    setLastCategoryBeforeAI('');
    setLastDueDateBeforeAI('');
  };

  const addSimpleTodo = async (parentId?: string) => {
    console.log('🔄 Adding simple todo:', {
      text: newTodo,
      category: newCategory,
      parent_id: parentId || null
    });

    try {
      const result = await storage.addTodo({
        text: newTodo,
        completed: false,
        category: newCategory,
        subcategory_id: newSubcategoryId || null,
        due_date: newDueDate || null,
        parent_id: parentId || null,
      });

      if (result) {
        console.log('✅ Todo added successfully:', result.id);
      } else {
        console.error('❌ Failed to add todo: no result returned');
        alert('할일 추가에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ Error adding todo:', error);
      alert('할일 추가 중 오류가 발생했습니다.');
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodos = todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updatedTodos);

    try {
      await storage.updateTodo(id, {
        completed: !todo.completed
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setTodos(todos);
      alert('할일 상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const deleteTodo = async (id: string) => {
    const todoToDelete = todos.find(t => t.id === id);
    if (!todoToDelete) return;

    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);

    try {
      const success = await storage.deleteTodo(id);
      if (!success) {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setTodos(todos);
      alert('할일 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleAddCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    await storage.addCategory(categoryData);
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    await storage.updateCategory(id, updates);
  };

  const handleDeleteCategory = async (id: string) => {
    await storage.deleteCategory(id);
  };

  const handleAddSubCategory = async (subcategoryData: Omit<SubCategory, 'id' | 'created_at' | 'updated_at'>) => {
    await storage.addSubCategory(subcategoryData);
  };

  const handleUpdateSubCategory = async (id: string, updates: Partial<SubCategory>) => {
    await storage.updateSubCategory(id, updates);
  };

  const handleDeleteSubCategory = async (id: string) => {
    await storage.deleteSubCategory(id);
  };

  const handleConfirmReviewTodos = async (confirmedTodos: ReviewTodo[]) => {
    setIsLoading(true);
    try {
      const existingTodos = todos.map(todo => todo.text.trim().toLowerCase());
      const duplicateTodos = confirmedTodos.filter(reviewTodo =>
        existingTodos.includes(reviewTodo.text.trim().toLowerCase())
      );

      if (duplicateTodos.length > 0) {
        const duplicateNames = duplicateTodos.map(todo => `"${todo.text}"`).join(', ');
        const proceed = confirm(`다음 할일이 이미 존재합니다: ${duplicateNames}\n\n그래도 추가하시겠습니까?`);
        if (!proceed) {
          setIsLoading(false);
          return;
        }
      }

      const tempTodos = confirmedTodos.map((reviewTodo, index) => ({
        id: `temp_${Date.now()}_${index}`,
        text: reviewTodo.text.trim(),
        completed: false,
        category: reviewTodo.category,
        subcategory_id: reviewTodo.subcategory_id,
        due_date: reviewTodo.due_date,
        parent_id: reviewTodo.parent_id || null,
        user_id: 'temp_user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setTodos(prevTodos => [...tempTodos, ...prevTodos]);

      const addedTodos: Todo[] = [];
      for (const reviewTodo of confirmedTodos) {
        const addedTodo = await storage.addTodo({
          text: reviewTodo.text.trim(),
          completed: false,
          category: reviewTodo.category,
          subcategory_id: reviewTodo.subcategory_id,
          due_date: reviewTodo.due_date,
          parent_id: reviewTodo.parent_id || null,
        });
        if (addedTodo) {
          addedTodos.push(addedTodo);
        }
      }

      setTodos(prevTodos => [
        ...addedTodos,
        ...prevTodos.filter(todo => !todo.id.startsWith('temp_'))
      ]);

      setShowReviewModal(false);
      setReviewTodos([]);
      setAiSummary('');

      setLastInputBeforeAI('');
      setLastCategoryBeforeAI('');
      setLastDueDateBeforeAI('');
    } catch (error) {
      console.error('Failed to add reviewed todos:', error);
      setTodos(prevTodos => prevTodos.filter(todo => !todo.id.startsWith('temp_')));
      alert('할일 추가 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (todoId: string) => {
    setEditingTodoId(todoId);
  };

  const handleSaveEdit = async (todoId: string, updates: Partial<Todo>) => {
    const originalTodos = [...todos];

    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, ...updates } : todo
    );
    setTodos(updatedTodos);
    setEditingTodoId(null);

    try {
      await storage.updateTodo(todoId, updates);
    } catch (error) {
      console.error('Failed to save todo edit:', error);
      setTodos(originalTodos);
      setEditingTodoId(todoId);
      alert('할일 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
  };

  const handleAddSubTodo = async (parentId: string, text?: string) => {
    const parentTodo = todos.find(t => t.id === parentId);
    if (!parentTodo) return;

    if (parentTodo.parent_id) {
      alert('자식 할일에는 더 이상 하위 할일을 추가할 수 없습니다.');
      return;
    }

    let subTodoText = text;

    if (!subTodoText) {
      const promptResult = prompt('서브 할일을 입력하세요:');
      if (!promptResult || !promptResult.trim()) return;
      subTodoText = promptResult;
    }

    console.log('🔄 Adding sub todo:', {
      text: subTodoText.trim(),
      parent_id: parentId,
      category: parentTodo.category
    });

    try {
      const result = await storage.addTodo({
        text: subTodoText.trim(),
        completed: false,
        category: parentTodo.category,
        subcategory_id: parentTodo.subcategory_id || null,
        due_date: null,
        parent_id: parentId,
      });

      if (result) {
        console.log('✅ Sub todo added successfully:', result.id);
      } else {
        console.error('❌ Failed to add sub todo: no result returned');
        alert('서브 할일 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ Error adding sub todo:', error);
      alert('서브 할일 추가 중 오류가 발생했습니다.');
    }
  };

  const validateParentRelation = async (childId: string, potentialParentId: string): Promise<boolean> => {
    return await storage.canBeParent(childId, potentialParentId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setDragOverInfo(null);
      return;
    }

    const targetId = over.id as string;
    const targetTodo = todos.find(t => t.id === targetId);

    if (!targetTodo) {
      setDragOverInfo(null);
      return;
    }

    const zone: DropZone = targetTodo.parent_id ? 'after' : 'inside';

    setDragOverInfo({ targetId, zone });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setDragOverInfo(null);

    if (!over || active.id === over.id) return;

    const dragId = active.id as string;
    const targetId = over.id as string;
    const zone: DropZone = dragOverInfo?.zone || 'after';

    if (!isValidDrop(treeState, dragId, targetId, zone)) {
      return;
    }

    const newTreeState = moveTodo(treeState, dragId, targetId, zone);
    const newTodos = treeStateToTodos(newTreeState);

    setTodos(newTodos);

    try {
      const changedTodos = newTodos.filter(newTodo => {
        const originalTodo = todos.find(t => t.id === newTodo.id);
        return originalTodo && originalTodo.parent_id !== newTodo.parent_id;
      });

      for (const todo of changedTodos) {
        await storage.updateTodo(todo.id, {
          parent_id: todo.parent_id
        });
      }
    } catch (error) {
      console.error('Failed to sync drag and drop changes:', error);
      setTodos(todos);
      alert('순서 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return {
    updateDarkModeClass,
    addTodo,
    cancelAIAnalysis,
    restoreOriginalInput,
    addSimpleTodo,
    toggleTodo,
    deleteTodo,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSubCategory,
    handleUpdateSubCategory,
    handleDeleteSubCategory,
    handleConfirmReviewTodos,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleAddSubTodo,
    validateParentRelation,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};

export type TodoHandlers = ReturnType<typeof useTodoHandlers>;