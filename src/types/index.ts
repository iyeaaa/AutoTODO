export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  subcategory_id?: string | null;
  due_date?: string | null;
  parent_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// 2-레벨 트리를 위한 헬퍼 타입들
export type Id = string;
export type DropZone = 'inside' | 'before' | 'after' | 'root';

export interface TreeState {
  nodes: Record<Id, Todo>;
  rootOrder: Id[];                 // 부모들의 순서
  children: Record<Id, Id[]>;      // key=부모 id, value=그 자식들 순서
}

export interface DragOperation {
  dragId: Id;
  targetId: Id | null;
  zone: DropZone;
}

export interface DropIndicator {
  position: 'before' | 'inside' | 'after' | null;
  isValid: boolean;
  targetType: 'parent' | 'child' | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubCategory {
  id: string;
  name: string;
  parent_category_id: string;
  color: string;
  icon: string;
  display_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedTodo {
  title: string;
  dueDate?: string;
  category?: string;
  subcategory?: string;
  confidence?: number;
}

export interface ReviewTodo {
  id: string;
  text: string;
  category: string;
  subcategory_id?: string | null;
  due_date: string | null;
  parent_id?: string | null;
  selected: boolean;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: SubCategory[];
}

export interface GeminiResponse {
  todos: ParsedTodo[];
  summary?: string;
}

export type FilterType = 'all' | 'active' | 'completed';
export type SortType = 'newest' | 'oldest' | 'dueDate';

// Auth types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}