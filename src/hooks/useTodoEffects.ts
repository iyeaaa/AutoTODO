import { useEffect } from 'react';
import { storage } from '../utils/supabaseStorage';
import { todosToTreeState } from '../utils/treeOperations';
import { testEmojiValidation } from '../utils/emojiUtils';
import { useAuth } from '../contexts/AuthContext';
import type { TodoState } from './useTodoState';
import type { TodoHandlers } from './useTodoHandlers';

export const useTodoEffects = (state: TodoState, handlers: TodoHandlers) => {
  const { user } = useAuth();
  const {
    todos,
    setTodos,
    setCategories,
    setSubcategories,
    setNewCategory,
    setNewSubcategoryId,
    isDark,
    setTreeState,
  } = state;
  const { updateDarkModeClass } = handlers;

  useEffect(() => {
    if (!user) return;

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

        if (finalCategories.length > 0) {
          console.log('✅ 기본 카테고리 설정:', finalCategories[0].name);
          setNewCategory(finalCategories[0].name);
          const firstCategorySubcategories = subcategories.filter(sub => sub.parent_category_id === finalCategories[0].id);
          if (firstCategorySubcategories.length > 0) {
            setNewSubcategoryId(firstCategorySubcategories[0].id);
          }
        } else {
          console.log('❌ 카테고리 생성도 실패했습니다!');
        }
      } catch (error) {
        console.error('❌ Failed to load data:', error);

        if (retryCount < 2) {
          console.log('🔄 데이터 로딩 재시도 중...');
          setTimeout(() => loadData(retryCount + 1), 2000);
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

    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => testEmojiValidation(), 1000);
    }

    updateDarkModeClass(isDark);

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
  }, [user]);

  useEffect(() => {
    const newTreeState = todosToTreeState(todos);
    setTreeState(newTreeState);
  }, [todos]);
};