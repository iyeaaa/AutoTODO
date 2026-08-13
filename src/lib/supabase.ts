import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnpmucyuqsuswkzacuke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucG11Y3l1cXN1c3dremFjdWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjQ1OTEsImV4cCI6MjA3NDIwMDU5MX0.laQZMVmOauqpOrtNtSAYjCPgQBMWTd4e-biEbk_LBfQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

export type Database = {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string;
          text: string;
          completed: boolean;
          category: string;
          subcategory_id: string | null;
          due_date: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          completed?: boolean;
          category?: string;
          subcategory_id?: string | null;
          due_date?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          completed?: boolean;
          category?: string;
          subcategory_id?: string | null;
          due_date?: string | null;
          user_id?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string;
          display_order: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          icon?: string;
          display_order?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          icon?: string;
          display_order?: number;
          user_id?: string;
          updated_at?: string;
        };
      };
      subcategories: {
        Row: {
          id: string;
          name: string;
          parent_category_id: string;
          color: string;
          icon: string;
          display_order: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_category_id: string;
          color?: string;
          icon?: string;
          display_order?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_category_id?: string;
          color?: string;
          icon?: string;
          display_order?: number;
          user_id?: string;
          updated_at?: string;
        };
      };
    };
  };
};