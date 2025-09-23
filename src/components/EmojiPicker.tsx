import { useState, useEffect, useRef } from 'react';
import { Search, Clock, Hash, Smile, X } from 'lucide-react';
import {
  getCategoryEmojiSuggestions,
  searchEmojis,
  isValidEmoji,
  extractEmojis,
  addToRecentEmojis,
  getRecentEmojis,
  CATEGORY_EMOJI_SUGGESTIONS
} from '../utils/emojiUtils';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji: string;
  categoryName?: string;
  isDark: boolean;
}

const PRESET_EMOJIS = [
  '💼', '👤', '🏃', '🛒', '📚', '🎯', '⚡', '🎨', '🍔', '🏠',
  '✈️', '🎵', '💡', '📱', '🚗', '💰', '🎮', '📝', '🔧', '🌟',
  '❤️', '💚', '💙', '💜', '🧡', '💛', '🖤', '🤍', '🤎', '💗'
];

export default function EmojiPicker({
  isOpen,
  onClose,
  onSelect,
  currentEmoji,
  categoryName,
  isDark
}: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<'preset' | 'category' | 'search' | 'recent' | 'custom' | 'none'>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecentEmojis(getRecentEmojis());
      if (categoryName && CATEGORY_EMOJI_SUGGESTIONS[categoryName as keyof typeof CATEGORY_EMOJI_SUGGESTIONS]) {
        setActiveTab('category');
      }
    }
  }, [isOpen, categoryName]);

  useEffect(() => {
    if (activeTab === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (activeTab === 'custom' && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [activeTab]);

  const handleEmojiSelect = (emoji: string) => {
    addToRecentEmojis(emoji);
    setRecentEmojis(getRecentEmojis());
    onSelect(emoji);
    onClose();
  };

  const handleCustomInput = () => {
    const cleanedInput = extractEmojis(customInput);
    if (isValidEmoji(cleanedInput)) {
      handleEmojiSelect(cleanedInput);
      setCustomInput('');
    }
  };

  const getCategoryEmojis = () => {
    return categoryName ? getCategoryEmojiSuggestions(categoryName) : [];
  };

  const getSearchResults = () => {
    return searchEmojis(searchQuery);
  };

  const tabs = [
    { key: 'preset' as const, label: '기본', icon: <Hash className="w-4 h-4" /> },
    { key: 'recent' as const, label: '최근', icon: <Clock className="w-4 h-4" /> },
    ...(categoryName ? [{ key: 'category' as const, label: categoryName, icon: <Smile className="w-4 h-4" /> }] : []),
    { key: 'search' as const, label: '검색', icon: <Search className="w-4 h-4" /> },
    { key: 'custom' as const, label: '직접입력', icon: <span className="text-sm">✏️</span> },
    { key: 'none' as const, label: '없음', icon: <X className="w-4 h-4" /> }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className={`max-w-md w-full mx-4 rounded-2xl overflow-hidden ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } animate-scale-in`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            이모지 선택
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 text-sm flex items-center justify-center gap-1 transition-colors ${
                activeTab === tab.key
                  ? isDark ? 'bg-gray-700 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {/* 기본 이모지 */}
          {activeTab === 'preset' && (
            <div className="grid grid-cols-6 gap-2">
              {PRESET_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl transition-all hover:scale-110 ${
                    currentEmoji === emoji
                      ? isDark ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-blue-100 ring-2 ring-blue-500'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* 최근 사용한 이모지 */}
          {activeTab === 'recent' && (
            <div>
              {recentEmojis.length > 0 ? (
                <div className="grid grid-cols-6 gap-2">
                  {recentEmojis.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl transition-all hover:scale-110 ${
                        currentEmoji === emoji
                          ? isDark ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-blue-100 ring-2 ring-blue-500'
                          : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">최근 사용한 이모지가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 카테고리 추천 이모지 */}
          {activeTab === 'category' && categoryName && (
            <div className="grid grid-cols-6 gap-2">
              {getCategoryEmojis().map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl transition-all hover:scale-110 ${
                    currentEmoji === emoji
                      ? isDark ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-blue-100 ring-2 ring-blue-500'
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* 이모지 검색 */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이모지 검색... (예: 하트, 집, 운동)"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              {searchQuery && (
                <div className="grid grid-cols-6 gap-2">
                  {getSearchResults().map((emoji, index) => (
                    <button
                      key={`search-${emoji}-${index}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl transition-all hover:scale-110 ${
                        currentEmoji === emoji
                          ? isDark ? 'bg-blue-700 ring-2 ring-blue-400' : 'bg-blue-100 ring-2 ring-blue-500'
                          : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && getSearchResults().length === 0 && (
                <div className={`text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 직접 입력 */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  ref={customInputRef}
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="이모지를 붙여넣거나 입력하세요"
                  className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomInput()}
                />
                <button
                  onClick={handleCustomInput}
                  disabled={!customInput.trim() || !isValidEmoji(extractEmojis(customInput))}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  확인
                </button>
              </div>

              {/* 미리보기 */}
              {customInput && (
                <div className={`p-3 rounded-lg border ${
                  isValidEmoji(extractEmojis(customInput))
                    ? isDark ? 'border-green-600 bg-green-900/20' : 'border-green-300 bg-green-50'
                    : isDark ? 'border-red-600 bg-red-900/20' : 'border-red-300 bg-red-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {isValidEmoji(extractEmojis(customInput)) ? extractEmojis(customInput) : '❌'}
                    </div>
                    <div className="text-sm">
                      {isValidEmoji(extractEmojis(customInput)) ? (
                        <span className={isDark ? 'text-green-300' : 'text-green-700'}>
                          유효한 이모지입니다
                        </span>
                      ) : (
                        <span className={isDark ? 'text-red-300' : 'text-red-700'}>
                          올바른 이모지를 입력해주세요
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>💡 팁: 다른 앱에서 이모지를 복사해서 붙여넣을 수 있습니다</p>
              </div>
            </div>
          )}

          {/* 이모지 없음 선택 */}
          {activeTab === 'none' && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <X className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                이모지 없이 카테고리를 만들 수 있습니다
              </p>
              <button
                onClick={() => onSelect('')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                이모지 제거
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}