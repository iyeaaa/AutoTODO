export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  subcategory_id?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
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