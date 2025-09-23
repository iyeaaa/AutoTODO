import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
      avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '',
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at || supabaseUser.created_at,
    };
  };

  useEffect(() => {
    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(convertSupabaseUser(session.user));
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);

        if (session?.user) {
          setUser(convertSupabaseUser(session.user));

          // 최초 로그인 시 익명 데이터 마이그레이션 확인
          if (event === 'SIGNED_IN') {
            const hasAnonymousData = checkForAnonymousData();
            if (hasAnonymousData) {
              // 마이그레이션 필요 플래그 설정
              localStorage.setItem('needsMigration', 'true');
            }
          }
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkForAnonymousData = (): boolean => {
    // 로컬스토리지에 익명 데이터가 있는지 확인
    const todos = localStorage.getItem('todos-cache');
    const categories = localStorage.getItem('categories-cache');
    const subcategories = localStorage.getItem('subcategories-cache');

    return !!(todos || categories || subcategories);
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // 로컬 캐시 정리
      localStorage.removeItem('todos-cache');
      localStorage.removeItem('categories-cache');
      localStorage.removeItem('subcategories-cache');
      localStorage.removeItem('needsMigration');

      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const migrateAnonymousData = async (): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to migrate data');
    }

    try {
      setLoading(true);

      // 로컬스토리지에서 익명 데이터 가져오기
      const todosCache = localStorage.getItem('todos-cache');
      const categoriesCache = localStorage.getItem('categories-cache');
      const subcategoriesCache = localStorage.getItem('subcategories-cache');

      // 카테고리 마이그레이션
      if (categoriesCache) {
        const categories = JSON.parse(categoriesCache);
        for (const category of categories) {
          const { id, created_at, updated_at, ...categoryData } = category;
          await supabase.from('categories').insert({
            ...categoryData,
            user_id: user.id,
          });
        }
      }

      // 서브카테고리 마이그레이션
      if (subcategoriesCache) {
        const subcategories = JSON.parse(subcategoriesCache);
        for (const subcategory of subcategories) {
          const { id, created_at, updated_at, ...subcategoryData } = subcategory;
          await supabase.from('subcategories').insert({
            ...subcategoryData,
            user_id: user.id,
          });
        }
      }

      // 할일 마이그레이션
      if (todosCache) {
        const todos = JSON.parse(todosCache);
        for (const todo of todos) {
          const { id, created_at, updated_at, ...todoData } = todo;
          await supabase.from('todos').insert({
            ...todoData,
            user_id: user.id,
          });
        }
      }

      // 마이그레이션 완료 후 로컬 캐시 정리
      localStorage.removeItem('todos-cache');
      localStorage.removeItem('categories-cache');
      localStorage.removeItem('subcategories-cache');
      localStorage.removeItem('needsMigration');

      alert('기존 데이터가 성공적으로 계정에 연결되었습니다!');
    } catch (error) {
      console.error('Error migrating anonymous data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    migrateAnonymousData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};