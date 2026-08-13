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
        console.log('🔍 초기 세션 확인 중...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 세션 결과:', session);
        if (session?.user) {
          console.log('✅ 사용자 세션 발견:', session.user);
          const convertedUser = convertSupabaseUser(session.user);
          console.log('✅ 변환된 사용자:', convertedUser);
          setUser(convertedUser);
        } else {
          console.log('❌ 사용자 세션 없음');
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
      } finally {
        console.log('🏁 초기 로딩 완료');
        setLoading(false);
      }
    };

    initializeAuth();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 인증 상태 변화:', { event, session });
        setLoading(true);

        if (session?.user) {
          console.log('✅ 세션에 사용자 있음:', session.user);
          const convertedUser = convertSupabaseUser(session.user);
          console.log('✅ 사용자 설정:', convertedUser);
          setUser(convertedUser);

          if (event === 'SIGNED_IN') {
            console.log('🎉 SIGNED_IN 이벤트 발생');
          }
        } else {
          console.log('❌ 세션에 사용자 없음');
          setUser(null);
        }

        console.log('🏁 인증 상태 로딩 완료');
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('🚀 구글 로그인 시작...');
      console.log('🔗 리다이렉트 URL:', `${window.location.origin}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('📊 로그인 응답:', { data, error });

      if (error) {
        console.error('❌ 로그인 에러:', error);
        throw error;
      }

      console.log('✅ 로그인 요청 성공');
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
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

      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};