import { supabase } from '../lib/supabase';
import type { Todo, Category, SubCategory } from '../types';

class SupabaseStorage {
  private localCache: Todo[] = [];
  private categoriesCache: Category[] = [];
  private subcategoriesCache: SubCategory[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async getTodos(): Promise<Todo[]> {
    try {
      console.log('✅ getTodos 시작, isOnline:', this.isOnline);

      if (this.isOnline) {
        console.log('🔐 사용자 인증 확인 중...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 사용자:', user?.id || 'null');

        if (!user) {
          console.log('❌ 사용자 없음, 로컬 캐시 사용');
          return this.loadFromLocalStorage();
        }

        console.log('🔍 Supabase에서 할일 조회 중...');
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        console.log('📊 할일 응답:', { data: data?.length, error });

        if (error) throw error;

        this.localCache = data || [];
        this.saveToLocalStorage(this.localCache);
        console.log('✅ 할일 로딩 완료:', this.localCache.length, '개');
        return this.localCache;
      } else {
        console.log('📱 오프라인 모드, 로컬 캐시 사용');
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ Failed to fetch todos:', error);
      return this.loadFromLocalStorage();
    }
  }

  async saveTodos(todos: Todo[]): Promise<void> {
    this.localCache = todos;
    this.saveToLocalStorage(todos);

    if (this.isOnline) {
      await this.syncWithServer();
    }
  }

  async addTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Todo | null> {
    try {
      // 기본값 설정
      const todoWithDefaults = {
        ...todo,
        parent_id: todo.parent_id || null
      };

      console.log('📝 Adding todo with defaults:', {
        text: todoWithDefaults.text,
        parent_id: todoWithDefaults.parent_id
      });

      if (this.isOnline) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const todoWithUser = {
          ...todoWithDefaults,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from('todos')
          .insert([todoWithUser])
          .select()
          .single();

        if (error) throw error;

        this.localCache.unshift(data);
        this.saveToLocalStorage(this.localCache);
        return data;
      } else {
        // 오프라인일 때는 임시 ID로 로컬에 저장
        const tempTodo: Todo = {
          ...todoWithDefaults,
          id: `temp_${Date.now()}`,
          user_id: 'temp_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('📱 Adding temp todo (offline):', tempTodo);

        this.localCache.unshift(tempTodo);
        this.saveToLocalStorage(this.localCache);
        return tempTodo;
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
      return null;
    }
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null> {
    try {
      if (this.isOnline) {
        console.log('🔄 할일 업데이트 시작:', id);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('❌ 사용자 인증 실패');
          throw new Error('사용자 인증이 필요합니다. 다시 로그인해주세요.');
        }

        const { data, error } = await supabase
          .from('todos')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase 업데이트 실패:', error);
          if (error.code === 'PGRST116') {
            throw new Error('해당 할일을 찾을 수 없습니다.');
          }
          if (error.code === '42501') {
            throw new Error('할일을 수정할 권한이 없습니다.');
          }
          throw new Error(`할일 업데이트 실패: ${error.message}`);
        }

        console.log('✅ 할일 업데이트 성공:', data.id);
        const index = this.localCache.findIndex(todo => todo.id === id);
        if (index !== -1) {
          this.localCache[index] = data;
          this.saveToLocalStorage(this.localCache);
        }
        return data;
      } else {
        // 오프라인일 때는 로컬에서만 업데이트
        const index = this.localCache.findIndex(todo => todo.id === id);
        if (index !== -1) {
          this.localCache[index] = {
            ...this.localCache[index],
            ...updates,
            updated_at: new Date().toISOString()
          };
          this.saveToLocalStorage(this.localCache);
          return this.localCache[index];
        }
        return null;
      }
    } catch (error: any) {
      console.error('❌ 할일 업데이트 실패:', error);
      // 상세한 에러 정보 로깅
      if (error.code) {
        console.error('에러 코드:', error.code);
      }
      if (error.details) {
        console.error('에러 세부사항:', error.details);
      }
      throw error; // 에러를 상위로 전파하여 App에서 처리할 수 있도록
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      if (this.isOnline) {
        console.log('🗑️ 할일 삭제 시작:', id);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('❌ 사용자 인증 실패');
          throw new Error('사용자 인증이 필요합니다. 다시 로그인해주세요.');
        }

        // 먼저 하위 투두들을 재귀적으로 삭제
        const childTodos = await this.getChildTodos(id);
        for (const child of childTodos) {
          await this.deleteTodo(child.id);
        }

        // 부모 투두 삭제
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Supabase 삭제 실패:', error);
          if (error.code === 'PGRST116') {
            throw new Error('해당 할일을 찾을 수 없습니다.');
          }
          if (error.code === '42501') {
            throw new Error('할일을 삭제할 권한이 없습니다.');
          }
          throw new Error(`할일 삭제 실패: ${error.message}`);
        }

        console.log('✅ 할일 삭제 성공:', id);
      } else {
        // 오프라인에서도 하위 투두들 재귀적으로 삭제
        const childTodos = this.getChildTodosLocal(id);
        for (const child of childTodos) {
          await this.deleteTodo(child.id);
        }
      }

      this.localCache = this.localCache.filter(todo => todo.id !== id);
      this.saveToLocalStorage(this.localCache);
      return true;
    } catch (error: any) {
      console.error('❌ 할일 삭제 실패:', error);
      if (error.code) {
        console.error('에러 코드:', error.code);
      }
      if (error.details) {
        console.error('에러 세부사항:', error.details);
      }
      throw error; // 에러를 상위로 전파
    }
  }

  private async syncWithServer(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    try {
      const localTodos = this.loadFromLocalStorage();
      const tempTodos = localTodos.filter(todo => todo.id.startsWith('temp_'));

      // 임시 할일들을 서버에 업로드
      for (const tempTodo of tempTodos) {
        const { id, created_at, updated_at, ...todoData } = tempTodo;
        await this.addTodo(todoData);
      }

      // 서버에서 최신 데이터 가져오기
      await this.getTodos();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private saveToLocalStorage(todos: Todo[]): void {
    try {
      localStorage.setItem('todos-cache', JSON.stringify(todos));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): Todo[] {
    try {
      const stored = localStorage.getItem('todos-cache');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Category CRUD methods
  async getCategories(): Promise<Category[]> {
    try {
      console.log('🏷️ getCategories 시작, isOnline:', this.isOnline);

      if (this.isOnline) {
        console.log('🔐 사용자 인증 확인 중...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 사용자:', user?.id || 'null');

        if (!user) {
          console.log('❌ 사용자 없음, 로컬 스토리지 사용');
          return this.loadCategoriesLocalStorage();
        }

        console.log('🔍 Supabase에서 카테고리 조회 중...');
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('display_order', { ascending: true });

        console.log('📊 카테고리 응답:', { data, error });

        if (error) throw error;

        this.categoriesCache = data || [];
        this.saveCategoriesLocalStorage(this.categoriesCache);
        console.log('✅ 카테고리 로딩 완료:', this.categoriesCache.length, '개');
        return this.categoriesCache;
      } else {
        console.log('📱 오프라인 모드, 로컬 스토리지 사용');
        return this.loadCategoriesLocalStorage();
      }
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      return this.loadCategoriesLocalStorage();
    }
  }

  async addCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Category | null> {
    try {
      if (this.isOnline) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const categoryWithUser = {
          ...category,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from('categories')
          .insert([categoryWithUser])
          .select()
          .single();

        if (error) throw error;

        this.categoriesCache.push(data);
        this.categoriesCache.sort((a, b) => a.display_order - b.display_order);
        this.saveCategoriesLocalStorage(this.categoriesCache);
        return data;
      } else {
        // 오프라인일 때는 임시 ID로 로컬에 저장
        const tempCategory: Category = {
          ...category,
          id: `temp_cat_${Date.now()}`,
          user_id: 'temp_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        this.categoriesCache.push(tempCategory);
        this.categoriesCache.sort((a, b) => a.display_order - b.display_order);
        this.saveCategoriesLocalStorage(this.categoriesCache);
        return tempCategory;
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      return null;
    }
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('categories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        const index = this.categoriesCache.findIndex(cat => cat.id === id);
        if (index !== -1) {
          this.categoriesCache[index] = data;
          this.categoriesCache.sort((a, b) => a.display_order - b.display_order);
          this.saveCategoriesLocalStorage(this.categoriesCache);
        }
        return data;
      } else {
        const index = this.categoriesCache.findIndex(cat => cat.id === id);
        if (index !== -1) {
          this.categoriesCache[index] = {
            ...this.categoriesCache[index],
            ...updates,
            updated_at: new Date().toISOString()
          };
          this.categoriesCache.sort((a, b) => a.display_order - b.display_order);
          this.saveCategoriesLocalStorage(this.categoriesCache);
          return this.categoriesCache[index];
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      return null;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      // 먼저 해당 카테고리를 사용하는 할일들을 "개인" 카테고리로 이동
      const categoryToDelete = this.categoriesCache.find(cat => cat.id === id);
      if (!categoryToDelete) return false;

      if (this.isOnline) {
        // 할일들을 "개인" 카테고리로 업데이트
        await supabase
          .from('todos')
          .update({ category: '개인' })
          .eq('category', categoryToDelete.name);

        // 카테고리 삭제
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      // 로컬 캐시에서도 할일들 업데이트
      this.localCache = this.localCache.map(todo =>
        todo.category === categoryToDelete.name
          ? { ...todo, category: '개인' }
          : todo
      );
      this.saveToLocalStorage(this.localCache);

      // 카테고리 캐시에서 제거
      this.categoriesCache = this.categoriesCache.filter(cat => cat.id !== id);
      this.saveCategoriesLocalStorage(this.categoriesCache);
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      return false;
    }
  }

  private saveCategoriesLocalStorage(categories: Category[]): void {
    try {
      localStorage.setItem('categories-cache', JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories to localStorage:', error);
    }
  }

  private loadCategoriesLocalStorage(): Category[] {
    try {
      const stored = localStorage.getItem('categories-cache');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load categories from localStorage:', error);
      return [];
    }
  }

  // SubCategory CRUD methods
  async getSubCategories(): Promise<SubCategory[]> {
    try {
      console.log('📂 getSubCategories 시작, isOnline:', this.isOnline);

      if (this.isOnline) {
        console.log('🔍 Supabase에서 서브카테고리 조회 중...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 사용자:', user?.id || 'null');

        const { data, error } = await supabase
          .from('subcategories')
          .select('*')
          .eq('user_id', user?.id)
          .order('parent_category_id', { ascending: true })
          .order('display_order', { ascending: true });

        console.log('📊 서브카테고리 응답:', { data, error });

        if (error) throw error;

        this.subcategoriesCache = data || [];
        this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
        console.log('✅ 서브카테고리 로딩 완료:', this.subcategoriesCache.length, '개');
        return this.subcategoriesCache;
      } else {
        console.log('📱 오프라인 모드, 로컬 스토리지 사용');
        return this.loadSubcategoriesLocalStorage();
      }
    } catch (error) {
      console.error('❌ Failed to fetch subcategories:', error);
      return this.loadSubcategoriesLocalStorage();
    }
  }

  async addSubCategory(subcategory: Omit<SubCategory, 'id' | 'created_at' | 'updated_at'>): Promise<SubCategory | null> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('subcategories')
          .insert([subcategory])
          .select()
          .single();

        if (error) throw error;

        this.subcategoriesCache.push(data);
        this.subcategoriesCache.sort((a, b) =>
          a.parent_category_id.localeCompare(b.parent_category_id) || a.display_order - b.display_order
        );
        this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
        return data;
      } else {
        const tempSubCategory: SubCategory = {
          ...subcategory,
          id: `temp_subcat_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        this.subcategoriesCache.push(tempSubCategory);
        this.subcategoriesCache.sort((a, b) =>
          a.parent_category_id.localeCompare(b.parent_category_id) || a.display_order - b.display_order
        );
        this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
        return tempSubCategory;
      }
    } catch (error) {
      console.error('Failed to add subcategory:', error);
      return null;
    }
  }

  async updateSubCategory(id: string, updates: Partial<SubCategory>): Promise<SubCategory | null> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('subcategories')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        const index = this.subcategoriesCache.findIndex(subcat => subcat.id === id);
        if (index !== -1) {
          this.subcategoriesCache[index] = data;
          this.subcategoriesCache.sort((a, b) =>
            a.parent_category_id.localeCompare(b.parent_category_id) || a.display_order - b.display_order
          );
          this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
        }
        return data;
      } else {
        const index = this.subcategoriesCache.findIndex(subcat => subcat.id === id);
        if (index !== -1) {
          this.subcategoriesCache[index] = {
            ...this.subcategoriesCache[index],
            ...updates,
            updated_at: new Date().toISOString()
          };
          this.subcategoriesCache.sort((a, b) =>
            a.parent_category_id.localeCompare(b.parent_category_id) || a.display_order - b.display_order
          );
          this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
          return this.subcategoriesCache[index];
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to update subcategory:', error);
      return null;
    }
  }

  async deleteSubCategory(id: string): Promise<boolean> {
    try {
      // 먼저 해당 서브카테고리를 사용하는 할일들의 서브카테고리 제거
      if (this.isOnline) {
        await supabase
          .from('todos')
          .update({ subcategory_id: null })
          .eq('subcategory_id', id);

        const { error } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      // 로컬 캐시에서도 할일들 업데이트
      this.localCache = this.localCache.map(todo =>
        todo.subcategory_id === id
          ? { ...todo, subcategory_id: null }
          : todo
      );
      this.saveToLocalStorage(this.localCache);

      // 서브카테고리 캐시에서 제거
      this.subcategoriesCache = this.subcategoriesCache.filter(subcat => subcat.id !== id);
      this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
      return true;
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
      return false;
    }
  }

  private saveSubcategoriesLocalStorage(subcategories: SubCategory[]): void {
    try {
      localStorage.setItem('subcategories-cache', JSON.stringify(subcategories));
    } catch (error) {
      console.error('Failed to save subcategories to localStorage:', error);
    }
  }

  private loadSubcategoriesLocalStorage(): SubCategory[] {
    try {
      const stored = localStorage.getItem('subcategories-cache');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load subcategories from localStorage:', error);
      return [];
    }
  }

  // 실시간 구독 설정
  subscribeToChanges(callback: (todos: Todo[]) => void): () => void {
    const subscription = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos'
        },
        async () => {
          // 변경사항이 있을 때 최신 데이터 가져오기
          const todos = await this.getTodos();
          callback(todos);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // 카테고리 실시간 구독 설정
  subscribeToCategoryChanges(callback: (categories: Category[]) => void): () => void {
    const subscription = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        async () => {
          // 변경사항이 있을 때 최신 데이터 가져오기
          const categories = await this.getCategories();
          callback(categories);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // 서브카테고리 실시간 구독 설정
  subscribeToSubCategoryChanges(callback: (subcategories: SubCategory[]) => void): () => void {
    const subscription = supabase
      .channel('subcategories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcategories'
        },
        async () => {
          // 변경사항이 있을 때 최신 데이터 가져오기
          const subcategories = await this.getSubCategories();
          callback(subcategories);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // 서브 투두 관련 헬퍼 메서드들
  async getChildTodos(parentId: string): Promise<Todo[]> {
    if (this.isOnline) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('parent_id', parentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch child todos:', error);
        return [];
      }

      return data || [];
    } else {
      return this.getChildTodosLocal(parentId);
    }
  }

  private getChildTodosLocal(parentId: string): Todo[] {
    return this.localCache.filter(todo => todo.parent_id === parentId);
  }

  async getAllDescendants(parentId: string): Promise<Todo[]> {
    const descendants: Todo[] = [];
    const children = await this.getChildTodos(parentId);

    for (const child of children) {
      descendants.push(child);
      const childDescendants = await this.getAllDescendants(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }


  // 계층 구조로 투두들을 정렬 (2-레벨 전용)
  getHierarchicalTodos(todos: Todo[]): Todo[] {
    const sortedTodos: Todo[] = [];

    // 루트 투두들을 created_at으로 정렬 (최신순)
    const rootTodos = todos
      .filter(todo => !todo.parent_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 각 루트 투두와 그 자식들을 순서대로 추가
    rootTodos.forEach(rootTodo => {
      sortedTodos.push(rootTodo);

      // 자식들을 created_at으로 정렬하여 추가 (생성 순서)
      const children = todos
        .filter(todo => todo.parent_id === rootTodo.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      sortedTodos.push(...children);
    });

    return sortedTodos;
  }

  // 부모-자식 관계의 순환 참조 방지 (2-레벨 전용)
  async canBeParent(childId: string, potentialParentId: string): Promise<boolean> {
    // 자기 자신을 부모로 설정하려는 경우
    if (childId === potentialParentId) {
      return false;
    }

    const potentialParent = this.localCache.find(todo => todo.id === potentialParentId);

    // 잠재적 부모가 이미 자식이라면 불가 (2-레벨 제한)
    if (potentialParent && potentialParent.parent_id) {
      return false;
    }

    // 잠재적 부모가 현재 childId의 자식이라면 불가 (순환 참조)
    if (potentialParent && potentialParent.parent_id === childId) {
      return false;
    }

    return true;
  }


  // 완료율 계산 (서브 투두 포함)
  calculateCompletionStats(todos: Todo[]): { completed: number; total: number; percentage: number } {
    const completed = todos.filter(todo => todo.completed).length;
    const total = todos.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }

  // 특정 부모의 완료율 계산
  async getParentCompletionStats(parentId: string): Promise<{ completed: number; total: number; percentage: number }> {
    const children = await this.getChildTodos(parentId);
    return this.calculateCompletionStats(children);
  }

  // TreeState와 동기화를 위한 헬퍼 (parent_id만 업데이트)
  async syncTreeState(treeState: any): Promise<boolean> {
    try {
      const todos = Object.values(treeState.nodes) as Todo[];

      // 변경된 parent_id만 업데이트
      for (const todo of todos) {
        const originalTodo = this.localCache.find(t => t.id === todo.id);
        if (originalTodo && originalTodo.parent_id !== todo.parent_id) {
          await this.updateTodo(todo.id, {
            parent_id: todo.parent_id
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to sync tree state:', error);
      return false;
    }
  }
}

export const storage = new SupabaseStorage();