import { DndContext } from '@dnd-kit/core';
import type { Todo } from './types';
import { storage } from './utils/supabaseStorage';
import { getFilteredTodosWithHierarchy, getCategoryInfo } from './utils/filterUtils';
import CategoryManagement from './components/CategoryManagement';
import TodoReviewModal from './components/TodoReviewModal';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import ProgressSection from './components/ProgressSection';
import AddTodoSection from './components/AddTodoSection';
import FiltersSection from './components/FiltersSection';
import TodoListSection from './components/TodoListSection';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTodoState } from './hooks/useTodoState';
import { useTodoHandlers } from './hooks/useTodoHandlers';
import { useTodoEffects } from './hooks/useTodoEffects';

function TodoApp() {
  const { user, loading } = useAuth();
  const state = useTodoState();
  const handlers = useTodoHandlers(state);
  useTodoEffects(state, handlers);

  const {
    todos,
    isDark,
    setIsDark,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    subcategoryFilter,
    setSubcategoryFilter,
    categories,
    subcategories,
    showCategoryManagement,
    setShowCategoryManagement,
    showReviewModal,
    setShowReviewModal,
    reviewTodos,
    setReviewTodos,
    aiSummary,
    setAiSummary,
    lastInputBeforeAI,
    isLoading,
    editingTodoId,
    activeDragId,
    dragOverInfo,
    newTodo,
    setNewTodo,
    newCategory,
    setNewCategory,
    newSubcategoryId,
    setNewSubcategoryId,
    newDueDate,
    setNewDueDate,
  } = state;

  const {
    updateDarkModeClass,
    addTodo,
    cancelAIAnalysis,
    restoreOriginalInput,
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
  } = handlers;

  const filteredTodos = getFilteredTodosWithHierarchy(todos, filter, categoryFilter, subcategoryFilter);
  const hierarchicalTodos = storage.getHierarchicalTodos(filteredTodos);
  const rootTodos = hierarchicalTodos.filter(todo => !todo.parent_id);

  const getChildrenOfTodo = (parentId: string): Todo[] => {
    return hierarchicalTodos.filter(todo => todo.parent_id === parentId);
  };

  const getCategoryInfoWrapper = (categoryName: string) => {
    return getCategoryInfo(categoryName, categories, isDark);
  };

  // 인증 로딩 중이거나 사용자가 없으면 로딩/로그인 페이지 표시
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ease-in-out ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header
          isDark={isDark}
          onToggleDark={() => {
            const newDarkMode = !isDark;
            setIsDark(newDarkMode);
            localStorage.setItem('darkMode', newDarkMode.toString());
            updateDarkModeClass(newDarkMode);
          }}
          onOpenCategoryManagement={() => setShowCategoryManagement(true)}
        />

        <ProgressSection
          todos={todos}
          isDark={isDark}
        />

        <AddTodoSection
          newTodo={newTodo}
          setNewTodo={setNewTodo}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          newSubcategoryId={newSubcategoryId}
          setNewSubcategoryId={setNewSubcategoryId}
          newDueDate={newDueDate}
          setNewDueDate={setNewDueDate}
          categories={categories}
          subcategories={subcategories}
          isLoading={isLoading}
          isDark={isDark}
          onAddTodo={addTodo}
          onCancelAI={cancelAIAnalysis}
        />

        <FiltersSection
          filter={filter}
          setFilter={setFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          subcategoryFilter={subcategoryFilter}
          setSubcategoryFilter={setSubcategoryFilter}
          categories={categories}
          subcategories={subcategories}
          todos={todos}
          isDark={isDark}
          getCategoryInfo={getCategoryInfoWrapper}
        />

        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <TodoListSection
            rootTodos={rootTodos}
            hierarchicalTodos={hierarchicalTodos}
            getChildrenOfTodo={getChildrenOfTodo}
            categories={categories}
            subcategories={subcategories}
            isDark={isDark}
            editingTodoId={editingTodoId}
            filter={filter}
            categoryFilter={categoryFilter}
            subcategoryFilter={subcategoryFilter}
            isLoading={isLoading}
            activeDragId={activeDragId}
            dragOverInfo={dragOverInfo}
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onAddSubTodo={handleAddSubTodo}
            onValidateParent={validateParentRelation}
          />
        </DndContext>

        <CategoryManagement
          isOpen={showCategoryManagement}
          onClose={() => setShowCategoryManagement(false)}
          categories={categories}
          subcategories={subcategories}
          isDark={isDark}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onAddSubCategory={handleAddSubCategory}
          onUpdateSubCategory={handleUpdateSubCategory}
          onDeleteSubCategory={handleDeleteSubCategory}
        />

        <TodoReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTodos([]);
            setAiSummary('');
            if (lastInputBeforeAI) {
              restoreOriginalInput();
            }
          }}
          reviewTodos={reviewTodos}
          categories={categories}
          subcategories={subcategories}
          isDark={isDark}
          onConfirm={handleConfirmReviewTodos}
          isSubmitting={isLoading}
          aiSummary={aiSummary}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TodoApp />
    </AuthProvider>
  );
}