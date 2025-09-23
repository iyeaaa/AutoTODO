import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, ChevronDown, Database, AlertCircle } from 'lucide-react';

interface UserProfileProps {
  isDark: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isDark }) => {
  const { user, signOut, migrateAnonymousData, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const needsMigration = localStorage.getItem('needsMigration') === 'true';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      await migrateAnonymousData();
      setShowDropdown(false);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('데이터 마이그레이션에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsMigrating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* 마이그레이션 필요 알림 */}
      {needsMigration && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto p-4 rounded-xl border flex items-start space-x-3 ${
          isDark
            ? 'bg-amber-900/20 border-amber-600 text-amber-300'
            : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">기존 데이터를 계정에 연결하시겠습니까?</p>
            <div className="flex space-x-2">
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="px-3 py-1 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {isMigrating ? '연결 중...' : '연결하기'}
              </button>
              <button
                onClick={() => localStorage.removeItem('needsMigration')}
                className={`px-3 py-1 text-xs rounded-lg ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      )}

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
                {needsMigration && (
                  <button
                    onClick={handleMigration}
                    disabled={isMigrating}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isDark
                        ? 'hover:bg-gray-700 text-amber-400'
                        : 'hover:bg-amber-50 text-amber-600'
                    } disabled:opacity-50`}
                  >
                    <Database className="w-4 h-4" />
                    <span className="text-sm">
                      {isMigrating ? '데이터 연결 중...' : '기존 데이터 연결하기'}
                    </span>
                  </button>
                )}

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