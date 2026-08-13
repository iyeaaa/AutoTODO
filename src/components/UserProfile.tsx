import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface UserProfileProps {
  isDark: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isDark }) => {
  const { user, signOut, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };


  if (!user) return null;

  return (
    <div className="relative">
      {/* 사용자 프로필 버튼 */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-lg hover:shadow-xl border border-gray-200'
        }`}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gray-600' : 'bg-gray-200'
          }`}>
            <User className="w-4 h-4" />
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium">
            {user.name || '사용자'}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {user.email}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
          showDropdown ? 'rotate-180' : ''
        }`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {showDropdown && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* 드롭다운 내용 */}
          <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl border z-50 ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-4">
              {/* 사용자 정보 */}
              <div className="flex items-center space-x-3 mb-4">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.email}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user.name || '사용자'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.email}
                  </p>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="space-y-2">
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isDark
                      ? 'hover:bg-gray-700 text-red-400'
                      : 'hover:bg-red-50 text-red-600'
                  } disabled:opacity-50`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">
                    {loading ? '로그아웃 중...' : '로그아웃'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;