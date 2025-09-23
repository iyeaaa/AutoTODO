import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Brain, Zap, Sparkles } from 'lucide-react';

interface LoginPageProps {
  isDark: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ isDark }) => {
  const { signInWithGoogle, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI 할일 분석",
      description: "복잡한 할일 목록을 AI가 자동으로 분석하고 정리합니다"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "스마트 카테고리",
      description: "할일을 자동으로 분류하고 우선순위를 제안합니다"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "실시간 동기화",
      description: "모든 기기에서 실시간으로 동기화되는 할일 관리"
    }
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 transition-all duration-500 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-2xl ${
              isDark ? 'bg-gray-800' : 'bg-white shadow-lg'
            }`}>
              <Sparkles className={`w-12 h-12 ${
                isDark ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
          </div>
          <h1 className={`text-3xl font-light mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            AI 할일 관리
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            스마트하게 할일을 관리하세요
          </p>
        </div>

        {/* 기능 소개 */}
        <div className={`p-6 rounded-2xl space-y-4 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
        }`}>
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg ${
                isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium mb-1 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 로그인 버튼 */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || isSigningIn}
            className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl'
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 shadow-lg hover:shadow-xl'
            }`}
          >
            {(loading || isSigningIn) ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>로그인 중...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google로 시작하기</span>
              </div>
            )}
          </button>

          <p className={`text-center text-sm ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            계정이 없으면 자동으로 생성됩니다
          </p>
        </div>

        {/* 하단 정보 */}
        <div className="text-center space-y-2">
          <p className={`text-xs ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`}>
            로그인하면 서비스 이용약관과 개인정보처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;