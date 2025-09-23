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
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        this.localCache = data || [];
        this.saveToLocalStorage(this.localCache);
        return this.localCache;
      } else {
        // 오프라인일 때는 로컬 캐시 사용
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
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

  async addTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Promise<Todo | null> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('todos')
          .insert([todo])
          .select()
          .single();

        if (error) throw error;

        this.localCache.unshift(data);
        this.saveToLocalStorage(this.localCache);
        return data;
      } else {
        // 오프라인일 때는 임시 ID로 로컬에 저장
        const tempTodo: Todo = {
          ...todo,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

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
        const { data, error } = await supabase
          .from('todos')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

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
    } catch (error) {
      console.error('Failed to update todo:', error);
      return null;
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      if (this.isOnline) {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      this.localCache = this.localCache.filter(todo => todo.id !== id);
      this.saveToLocalStorage(this.localCache);
      return true;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      return false;
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
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;

        this.categoriesCache = data || [];
        this.saveCategoriesLocalStorage(this.categoriesCache);
        return this.categoriesCache;
      } else {
        return this.loadCategoriesLocalStorage();
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return this.loadCategoriesLocalStorage();
    }
  }

  async addCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category | null> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('categories')
          .insert([category])
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
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('subcategories')
          .select('*')
          .order('parent_category_id', { ascending: true })
          .order('display_order', { ascending: true });

        if (error) throw error;

        this.subcategoriesCache = data || [];
        this.saveSubcategoriesLocalStorage(this.subcategoriesCache);
        return this.subcategoriesCache;
      } else {
        return this.loadSubcategoriesLocalStorage();
      }
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
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
}

export const storage = new SupabaseStorage();