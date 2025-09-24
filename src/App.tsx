import { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { X, Plus, Moon, Sun, Circle, Settings } from 'lucide-react';
import type { Todo, Category, SubCategory, ReviewTodo, TreeState, DropZone } from './types';
import { parseTextToTodos } from './lib/gemini';
import { storage } from './utils/supabaseStorage';
import { todosToTreeState, treeStateToTodos, moveTodo, isValidDrop } from './utils/treeOperations';
import CategoryManagement from './components/CategoryManagement';
import TodoReviewModal from './components/TodoReviewModal';
import DraggableTreeItem from './components/DraggableTreeItem';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { testEmojiValidation } from './utils/emojiUtils';

function TodoApp() {
  const { user, loading } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isDark, setIsDark] = useState(() => {
    // 초기 다크모드 상태를 localStorage에서 가져오기
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

  useEffect(() => {
    if (!user) return; // 사용자가 없으면 데이터 로딩하지 않음
    const loadData = async (retryCount = 0) => {
      console.log('📦 데이터 로딩 시작... (시도:', retryCount + 1, ')');
      try {
        console.log('🔄 Todos, Categories, Subcategories 로딩 중...');
        const [todos, categories, subcategories] = await Promise.all([
          storage.getTodos(),
          storage.getCategories(),
          storage.getSubCategories()
        ]);

        console.log('📊 로드된 데이터:', {
          todos: todos.length,
          categories: categories.length,
          subcategories: subcategories.length
        });
        console.log('📋 Categories:', categories);
        console.log('📋 Subcategories:', subcategories);

        // 기본 카테고리가 없으면 생성
        let finalCategories = categories;
        if (categories.length === 0) {
          console.log('🔧 기본 카테고리 생성 중...');
          try {
            const defaultCategories = [
              { name: '개인', color: '#6B7280', icon: '👤', display_order: 1 },
              { name: '업무', color: '#3B82F6', icon: '💼', display_order: 2 },
              { name: '학습', color: '#10B981', icon: '📚', display_order: 3 }
            ];

            const createdCategories = [];
            for (const catData of defaultCategories) {
              const created = await storage.addCategory(catData);
              if (created) {
                createdCategories.push(created);
              }
            }
            finalCategories = createdCategories;
            console.log('✅ 기본 카테고리 생성 완료:', createdCategories.length);
          } catch (error) {
            console.error('❌ 기본 카테고리 생성 실패:', error);
          }
        }

        setTodos(todos);
        setCategories(finalCategories);
        setSubcategories(subcategories);

        // 첫 번째 카테고리를 기본값으로 설정
        if (finalCategories.length > 0) {
          console.log('✅ 기본 카테고리 설정:', finalCategories[0].name);
          setNewCategory(finalCategories[0].name);
          // 첫 번째 카테고리의 첫 번째 서브카테고리를 기본값으로 설정
          const firstCategorySubcategories = subcategories.filter(sub => sub.parent_category_id === finalCategories[0].id);
          if (firstCategorySubcategories.length > 0) {
            setNewSubcategoryId(firstCategorySubcategories[0].id);
          }
        } else {
          console.log('❌ 카테고리 생성도 실패했습니다!');
        }
      } catch (error) {
        console.error('❌ Failed to load data:', error);

        // 최대 3회까지 재시도
        if (retryCount < 2) {
          console.log('🔄 데이터 로딩 재시도 중...');
          setTimeout(() => loadData(retryCount + 1), 2000); // 2초 후 재시도
          return;
        } else {
          console.error('❌ 데이터 로딩 최종 실패. 로컬 데이터 사용.');
          alert('데이터 로딩에 실패했습니다. 새로고침을 시도하거나 네트워크를 확인해주세요.');
        }
      } finally {
        console.log('🏁 데이터 로딩 완료');
      }
    };

    loadData();

    // 개발용 이모지 테스트 (브라우저 콘솔에서 확인)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => testEmojiValidation(), 1000);
    }

    // 초기 다크모드 클래스 적용
    updateDarkModeClass(isDark);


    // 실시간 구독 설정
    const unsubscribeTodos = storage.subscribeToChanges((updatedTodos) => {
      console.log('🔄 실시간 할일 업데이트:', updatedTodos.length);
      setTodos(updatedTodos);
    });

    const unsubscribeCategories = storage.subscribeToCategoryChanges((updatedCategories) => {
      console.log('🔄 실시간 카테고리 업데이트:', updatedCategories.length);
      setCategories(updatedCategories);
    });

    const unsubscribeSubcategories = storage.subscribeToSubCategoryChanges((updatedSubcategories) => {
      console.log('🔄 실시간 서브카테고리 업데이트:', updatedSubcategories.length);
      setSubcategories(updatedSubcategories);
    });


    return () => {
      unsubscribeTodos();
      unsubscribeCategories();
      unsubscribeSubcategories();
    };
  }, [user]); // user를 dependency에 추가

  // todos가 변경될 때마다 TreeState 업데이트
  useEffect(() => {
    const newTreeState = todosToTreeState(todos);
    setTreeState(newTreeState);
  }, [todos]);

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
      // Try to parse with AI first if it's a complex input
      if (newTodo.includes(',') || newTodo.includes('그리고') || newTodo.includes('및') || newTodo.includes('후에') || newTodo.includes('다음에')) {
        // 입력 내용 백업
        setLastInputBeforeAI(newTodo);
        setLastCategoryBeforeAI(newCategory);
        setLastDueDateBeforeAI(newDueDate);

        // AbortController 생성
        const controller = new AbortController();
        setAbortController(controller);
        setIsLoading(true);

        // 입력 필드 초기화
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

          // 요청이 취소되었는지 확인
          if (controller.signal.aborted) {
            return;
          }

          if (response.todos && response.todos.length > 0) {
            // AI가 분석한 할일들을 검토 모달로 보내기
            const reviewItems: ReviewTodo[] = response.todos.map((parsedTodo, index) => {
              // 서브카테고리 ID 찾기
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
            // AI 분석 결과가 없으면 원래 내용 복원 후 단순 추가
            restoreOriginalInput();
            addSimpleTodo();
          }
        } catch (error: any) {
          console.error('Failed to parse todos:', error);
          if (!controller.signal.aborted) {
            // 구체적인 에러 메시지 표시
            const errorMessage = error.message || 'AI 분석 중 오류가 발생했습니다';
            alert(`❌ ${errorMessage}\n\n원래 입력을 복원하고 단순 추가 모드로 전환합니다.`);

            // 에러 발생 시 원래 내용 복원
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
    // 서브카테고리도 복원
    const category = categories.find(cat => cat.name === lastCategoryBeforeAI);
    if (category) {
      const catSubcategories = subcategories.filter(sub => sub.parent_category_id === category.id);
      setNewSubcategoryId(catSubcategories.length > 0 ? catSubcategories[0].id : '');
    }
    // 백업 데이터 초기화
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
      // 실시간 구독이 상태를 업데이트하므로 수동 업데이트 제거
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

    // 낙관적 업데이트: 즉시 로컬 상태 업데이트
    const updatedTodos = todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updatedTodos);

    try {
      // Supabase 업데이트
      await storage.updateTodo(id, {
        completed: !todo.completed
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // 실패 시 롤백
      setTodos(todos);
      alert('할일 상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const deleteTodo = async (id: string) => {
    const todoToDelete = todos.find(t => t.id === id);
    if (!todoToDelete) return;

    // 낙관적 업데이트: 즉시 로컬 상태에서 제거
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);

    try {
      // Supabase에서 삭제
      const success = await storage.deleteTodo(id);
      if (!success) {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // 실패 시 롤백
      setTodos(todos);
      alert('할일 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 계층 구조를 고려한 필터링 함수
  const getFilteredTodosWithHierarchy = () => {
    // 개별 투두 필터 조건 체크
    const matchesFilter = (todo: Todo) => {
      // 상태 필터
      let statusMatch = true;
      if (filter === 'completed') statusMatch = todo.completed;
      if (filter === 'active') statusMatch = !todo.completed;

      // 카테고리 필터
      let categoryMatch = true;
      if (categoryFilter !== 'all') categoryMatch = todo.category === categoryFilter;

      // 서브카테고리 필터
      let subcategoryMatch = true;
      if (subcategoryFilter !== 'all') {
        if (subcategoryFilter === 'none') {
          subcategoryMatch = !todo.subcategory_id;
        } else {
          subcategoryMatch = todo.subcategory_id === subcategoryFilter;
        }
      }

      return statusMatch && categoryMatch && subcategoryMatch;
    };

    // 모든 조상을 가져오는 함수
    const getAncestors = (todoId: string): Todo[] => {
      const ancestors: Todo[] = [];
      let currentTodo = todos.find(t => t.id === todoId);

      while (currentTodo && currentTodo.parent_id) {
        const parent = todos.find(t => t.id === currentTodo!.parent_id);
        if (parent) {
          ancestors.unshift(parent); // 조상 순서로 정렬
          currentTodo = parent;
        } else {
          break;
        }
      }
      return ancestors;
    };

    // 모든 후손을 가져오는 함수
    const getDescendants = (todoId: string): Todo[] => {
      const descendants: Todo[] = [];
      const stack = [todoId];

      while (stack.length > 0) {
        const currentId = stack.pop()!;
        const children = todos.filter(t => t.parent_id === currentId);
        descendants.push(...children);
        stack.push(...children.map(child => child.id));
      }
      return descendants;
    };

    // 필터 매치하는 투두들과 관련된 모든 투두들 수집
    const relevantTodoIds = new Set<string>();

    todos.forEach(todo => {
      if (matchesFilter(todo)) {
        // 매치하는 투두
        relevantTodoIds.add(todo.id);

        // 그 투두의 모든 조상들도 포함 (구조 유지를 위해)
        getAncestors(todo.id).forEach(ancestor => {
          relevantTodoIds.add(ancestor.id);
        });

        // 그 투두의 모든 후손들도 포함 (하위 구조 표시를 위해)
        getDescendants(todo.id).forEach(descendant => {
          relevantTodoIds.add(descendant.id);
        });
      }
    });

    return todos.filter(todo => relevantTodoIds.has(todo.id));
  };

  const filteredTodos = getFilteredTodosWithHierarchy();

  // 계층 구조로 정렬된 투두들
  const hierarchicalTodos = storage.getHierarchicalTodos(filteredTodos);

  // 루트 투두들만 추출 (자식들은 HierarchicalTodoItem에서 렌더링)
  const rootTodos = hierarchicalTodos.filter(todo => !todo.parent_id);

  // 각 루트 투두의 자식들을 가져오는 함수
  const getChildrenOfTodo = (parentId: string): Todo[] => {
    return hierarchicalTodos.filter(todo => todo.parent_id === parentId);
  };

  // 서브 투두를 포함한 완료율 계산
  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount ? (completedCount / totalCount) * 100 : 0;


  const getCategoryInfo = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) {
      return {
        color: '#6B7280',
        icon: '',
        className: isDark ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-gray-100 text-gray-800'
      };
    }

    // 색상을 기반으로 적절한 배경/텍스트 색상 생성
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(category.color);
    const bgOpacity = isDark ? '0.2' : '0.1';
    const textOpacity = isDark ? '0.9' : '0.8';

    return {
      color: category.color,
      icon: category.icon,
      className: '',
      style: {
        backgroundColor: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})` : undefined,
        color: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${textOpacity})` : undefined,
      }
    };
  };

  // Category management handlers
  const handleAddCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    // 실시간 구독이 상태를 업데이트하므로 여기서는 스토리지 호출만
    await storage.addCategory(categoryData);
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    // 실시간 구독이 상태를 업데이트하므로 여기서는 스토리지 호출만
    await storage.updateCategory(id, updates);
  };

  const handleDeleteCategory = async (id: string) => {
    // 실시간 구독이 상태를 업데이트하므로 여기서는 스토리지 호출만
    await storage.deleteCategory(id);
  };

  // SubCategory management handlers
  const handleAddSubCategory = async (subcategoryData: Omit<SubCategory, 'id' | 'created_at' | 'updated_at'>) => {
    await storage.addSubCategory(subcategoryData);
  };

  const handleUpdateSubCategory = async (id: string, updates: Partial<SubCategory>) => {
    await storage.updateSubCategory(id, updates);
  };

  const handleDeleteSubCategory = async (id: string) => {
    await storage.deleteSubCategory(id);
  };

  // 검토 모달에서 할일들을 확인 후 추가하는 함수
  const handleConfirmReviewTodos = async (confirmedTodos: ReviewTodo[]) => {
    setIsLoading(true);
    try {
      // 기존 할일과 중복 체크
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

      // 낙관적 업데이트용 임시 할일들 생성
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

      // 낙관적 업데이트: 즉시 UI에 표시
      setTodos(prevTodos => [...tempTodos, ...prevTodos]);

      // Supabase에 순차적으로 추가
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

      // 임시 할일들을 실제 할일들로 교체
      setTodos(prevTodos => [
        ...addedTodos,
        ...prevTodos.filter(todo => !todo.id.startsWith('temp_'))
      ]);

      setShowReviewModal(false);
      setReviewTodos([]);
      setAiSummary('');

      // 백업된 입력 데이터 초기화
      setLastInputBeforeAI('');
      setLastCategoryBeforeAI('');
      setLastDueDateBeforeAI('');
    } catch (error) {
      console.error('Failed to add reviewed todos:', error);
      // 실패 시 임시 할일들 제거
      setTodos(prevTodos => prevTodos.filter(todo => !todo.id.startsWith('temp_')));
      alert('할일 추가 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 투두 인라인 편집 핸들러
  const handleStartEdit = (todoId: string) => {
    setEditingTodoId(todoId);
  };

  const handleSaveEdit = async (todoId: string, updates: Partial<Todo>) => {
    const originalTodos = [...todos];

    // 낙관적 업데이트: 즉시 로컬 상태 업데이트
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, ...updates } : todo
    );
    setTodos(updatedTodos);
    setEditingTodoId(null);

    try {
      // Supabase 업데이트
      await storage.updateTodo(todoId, updates);
    } catch (error) {
      console.error('Failed to save todo edit:', error);
      // 실패 시 롤백
      setTodos(originalTodos);
      setEditingTodoId(todoId); // 편집 모드 복원
      alert('할일 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
  };

  // 서브 투두 추가 함수
  const handleAddSubTodo = async (parentId: string, text?: string) => {
    // 부모 투두의 정보를 가져와서 새 서브투두에 설정
    const parentTodo = todos.find(t => t.id === parentId);
    if (!parentTodo) return;

    // 부모가 이미 자식이라면 서브투두 추가 불가 (2-레벨 제한)
    if (parentTodo.parent_id) {
      alert('자식 할일에는 더 이상 하위 할일을 추가할 수 없습니다.');
      return;
    }

    let subTodoText = text;

    // text가 제공되지 않은 경우 프롬프트 사용 (이전 버전 호환)
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
      // 서브투두 추가
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

  // 부모-자식 관계 검증 함수 (순환 참조 방지)
  const validateParentRelation = async (childId: string, potentialParentId: string): Promise<boolean> => {
    return await storage.canBeParent(childId, potentialParentId);
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  // 드래그 오버 핸들러 (실시간 피드백)
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

    // 드롭존 결정 (간단한 구현 - 실제로는 마우스 위치 기반)
    const zone: DropZone = targetTodo.parent_id ? 'after' : 'inside';

    setDragOverInfo({ targetId, zone });
  };

  // 드래그 종료 핸들러
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setDragOverInfo(null);

    if (!over || active.id === over.id) return;

    // 드롭 위치 결정
    const dragId = active.id as string;
    const targetId = over.id as string;
    const zone: DropZone = dragOverInfo?.zone || 'after';

    // 드롭 유효성 검사
    if (!isValidDrop(treeState, dragId, targetId, zone)) {
      return;
    }

    // 새로운 트리 상태 계산
    const newTreeState = moveTodo(treeState, dragId, targetId, zone);
    const newTodos = treeStateToTodos(newTreeState);

    // 낙관적 업데이트
    setTodos(newTodos);

    // 서버에 변경사항 동기화 (parent_id 변경만)
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
      // 실패 시 롤백
      setTodos(todos);
      alert('순서 변경에 실패했습니다. 다시 시도해주세요.');
    }
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-down">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-light transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              할일
            </h1>
            <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              오늘 해야 할 일들을 정리해보세요
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCategoryManagement(true)}
              className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-purple-400'
                  : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-purple-600 shadow-lg hover:shadow-xl'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const newDarkMode = !isDark;
                setIsDark(newDarkMode);
                localStorage.setItem('darkMode', newDarkMode.toString());
                updateDarkModeClass(newDarkMode);
              }}
              className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-yellow-400'
                  : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <UserProfile isDark={isDark} />
          </div>
        </div>

        {/* Progress */}
        {todos.length > 0 && (
          <div className={`p-6 rounded-2xl mb-6 transition-all duration-500 animate-slide-in-up ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  전체 진행률
                </span>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  모든 할일(서브 할일 포함)
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-mono transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {completedCount}/{totalCount}
                </span>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {Math.round(progressPercent)}%
                </p>
              </div>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Add Todo */}
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
                      addTodo();
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
{/* AI 분석 인디케이터 또는 로딩 상태 */}
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
                  onClick={cancelAIAnalysis}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <X className="w-4 h-4" />
                  취소
                </button>
              ) : (
                <button
                  onClick={addTodo}
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
                  // 카테고리 변경 시 서브카테고리 초기화
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

        {/* Filters */}
        <div className="space-y-4 mb-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: '전체' },
              { key: 'active' as const, label: '미완료' },
              { key: 'completed' as const, label: '완료' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-3 min-h-[44px] rounded-xl text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation ${
                  filter === key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-3">
              {/* Main category filters */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setSubcategoryFilter('all');
                  }}
                  className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation ${
                    categoryFilter === 'all'
                      ? 'bg-gray-500 text-white shadow-md'
                      : isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  모든 카테고리
                </button>
                {categories.map(category => {
                  const categoryTodos = todos.filter(todo => todo.category === category.name);
                  const completedCategoryTodos = categoryTodos.filter(todo => todo.completed);
                  const categoryInfo = getCategoryInfo(category.name);

                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setCategoryFilter(category.name);
                        setSubcategoryFilter('all');
                      }}
                      className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation flex items-center gap-1 whitespace-nowrap ${
                        categoryFilter === category.name
                          ? 'shadow-md ring-2 ring-offset-1'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: categoryFilter === category.name
                          ? categoryInfo.color
                          : categoryInfo.style?.backgroundColor,
                        color: categoryFilter === category.name
                          ? 'white'
                          : categoryInfo.style?.color,
                        ...(categoryFilter === category.name ? { '--tw-ring-color': categoryInfo.color } : {})
                      } as React.CSSProperties}
                    >
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                      <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                        categoryFilter === category.name
                          ? 'bg-white/20 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {completedCategoryTodos.length}/{categoryTodos.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Subcategory filters - only show when a specific category is selected */}
              {categoryFilter !== 'all' && subcategories.filter(sub => {
                const category = categories.find(cat => cat.name === categoryFilter);
                return category && sub.parent_category_id === category.id;
              }).length > 0 && (
                <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setSubcategoryFilter('all')}
                    className={`px-2 py-1 rounded text-xs transition-all duration-300 transform hover:scale-105 ${
                      subcategoryFilter === 'all'
                        ? 'bg-gray-400 text-white shadow-sm'
                        : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    전체 서브카테고리
                  </button>
                  <button
                    onClick={() => setSubcategoryFilter('none')}
                    className={`px-2 py-1 rounded text-xs transition-all duration-300 transform hover:scale-105 ${
                      subcategoryFilter === 'none'
                        ? 'bg-gray-400 text-white shadow-sm'
                        : isDark
                          ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    서브카테고리 없음 ({todos.filter(todo => todo.category === categoryFilter && !todo.subcategory_id).length})
                  </button>
                  {subcategories
                    .filter(sub => {
                      const category = categories.find(cat => cat.name === categoryFilter);
                      return category && sub.parent_category_id === category.id;
                    })
                    .map(subcategory => {
                      const subcategoryTodos = todos.filter(todo => todo.subcategory_id === subcategory.id);
                      const completedSubcategoryTodos = subcategoryTodos.filter(todo => todo.completed);
                      const incompleteSubcategoryTodos = subcategoryTodos.filter(todo => !todo.completed);

                      return (
                        <button
                          key={subcategory.id}
                          onClick={() => setSubcategoryFilter(subcategory.id)}
                          className={`px-2 py-1 rounded text-xs transition-all duration-300 transform hover:scale-105 flex items-center gap-1 ${
                            subcategoryFilter === subcategory.id
                              ? 'shadow-md ring-1 ring-offset-1'
                              : 'hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: subcategoryFilter === subcategory.id
                              ? subcategory.color
                              : `${subcategory.color}20`,
                            color: subcategoryFilter === subcategory.id
                              ? 'white'
                              : subcategory.color,
                            ...(subcategoryFilter === subcategory.id ? { '--tw-ring-color': subcategory.color } : {})
                          } as React.CSSProperties}
                        >
                          {subcategory.icon && <span>{subcategory.icon}</span>}
                          <span>{subcategory.name}</span>
                          <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                            subcategoryFilter === subcategory.id
                              ? 'bg-white/20 text-white'
                              : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {incompleteSubcategoryTodos.length}/{completedSubcategoryTodos.length}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Todo List with Drag & Drop */}
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
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
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onAddSubTodo={handleAddSubTodo}
                  onValidateParent={validateParentRelation}
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

          </div>

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
        </DndContext>

        {/* Category Management Modal */}
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

        {/* Todo Review Modal */}
        <TodoReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTodos([]);
            setAiSummary('');
            // 검토 모달을 닫을 때 원래 입력 복원
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