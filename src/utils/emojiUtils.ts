// 이모지 감지 정규식 (완전한 유니코드 범위)
export const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F200}-\u{1F2FF}]/gu;

// 이모지 유효성 검사 (개선된 버전)
export const isValidEmoji = (text: string): boolean => {
  if (!text) return false;

  // 길이 제한을 늘려서 복합 이모지도 지원 (예: 👨‍👩‍👧‍👦)
  if (text.length > 8) return false;

  // 방법 1: 정규식으로 체크
  const emojiMatches = text.match(EMOJI_REGEX);
  if (emojiMatches && emojiMatches.join('') === text) {
    return true;
  }

  // 방법 2: Fallback - 시각적 문자 개수로 체크
  try {
    // 문자열을 시각적 문자 단위로 분리
    const segments = Array.from(text);

    // 너무 많은 시각적 문자가 있으면 이모지가 아님
    if (segments.length > 4) return false;

    // 각 문자가 높은 유니코드 범위에 있는지 확인 (대부분의 이모지)
    return segments.every(char => {
      const codePoint = char.codePointAt(0);
      return codePoint && (
        codePoint >= 0x1F000 ||  // 대부분의 이모지 범위
        codePoint >= 0x2600 ||   // 기타 심볼
        codePoint >= 0x1F100     // 추가 범위
      );
    });
  } catch {
    // Fallback: 빈 텍스트가 아니고 길이가 적당하면 허용
    return text.length <= 4;
  }
};

// 텍스트에서 이모지만 추출 (개선된 버전)
export const extractEmojis = (text: string): string => {
  if (!text) return '';

  // 정규식으로 먼저 시도
  const matches = text.match(EMOJI_REGEX);
  if (matches && matches.length > 0) {
    return matches[0]; // 첫 번째 이모지만 반환
  }

  // Fallback: 첫 번째 문자가 이모지인지 확인
  const firstChar = Array.from(text)[0];
  if (firstChar && isValidEmoji(firstChar)) {
    return firstChar;
  }

  return '';
};

// 카테고리별 추천 이모지
export const CATEGORY_EMOJI_SUGGESTIONS = {
  '업무': [
    '💼', '📊', '🏢', '📋', '📅', '⚡', '💻', '📞', '📈', '📇',
    '🗂️', '📄', '📑', '🖥️', '⌨️', '🖱️', '💾', '📠', '📧', '📬'
  ],
  '개인': [
    '👤', '🏠', '💭', '❤️', '🎉', '✨', '🌟', '💫', '🎈', '🎁',
    '📖', '🎭', '🎪', '🎨', '🎵', '🎬', '📷', '🎯', '💎', '🌈'
  ],
  '건강': [
    '🏃', '💪', '🥗', '🧘‍♀️', '🏥', '💊', '⚕️', '🩺', '💚', '🍎',
    '🏋️', '🚴', '🏊', '🧘', '💆', '🍃', '🌱', '💧', '🔥', '⛹️'
  ],
  '쇼핑': [
    '🛒', '🛍️', '💳', '🎁', '📦', '🏪', '💰', '🛵', '📱', '👕',
    '👔', '👗', '👠', '👜', '⌚', '💍', '🕶️', '🎒', '🧳', '🛎️'
  ],
  '학습': [
    '📚', '📖', '✏️', '🎓', '💡', '🧠', '📝', '💻', '📊', '📐',
    '📏', '🔬', '🧪', '🔭', '🌍', '📌', '📎', '🖇️', '📋', '🗒️'
  ]
};

// 이모지 검색을 위한 이름 매핑 (기본적인 것들만)
export const EMOJI_SEARCH_MAP: Record<string, string[]> = {
  '💼': ['업무', '직장', '비즈니스', 'work', 'business', 'office'],
  '👤': ['사람', '개인', '유저', 'person', 'user', 'individual'],
  '🏃': ['달리기', '운동', '건강', 'run', 'exercise', 'health'],
  '🛒': ['쇼핑', '장보기', '구매', 'shopping', 'cart', 'buy'],
  '📚': ['공부', '학습', '책', 'study', 'learn', 'book'],
  '❤️': ['사랑', '좋아요', '하트', 'love', 'heart', 'like'],
  '🎯': ['목표', '타겟', '집중', 'target', 'goal', 'focus'],
  '⚡': ['빠른', '에너지', '전력', 'fast', 'energy', 'power'],
  '🎨': ['예술', '창작', '디자인', 'art', 'creative', 'design'],
  '🏠': ['집', '가정', '홈', 'home', 'house', 'family'],
  '💡': ['아이디어', '생각', '영감', 'idea', 'think', 'inspiration'],
  '🔥': ['열정', '핫', '인기', 'passion', 'hot', 'trending'],
  '🌟': ['별', '특별', '중요', 'star', 'special', 'important'],
  '💪': ['강함', '힘', '근육', 'strong', 'power', 'muscle'],
  '📱': ['폰', '모바일', '스마트폰', 'phone', 'mobile', 'smartphone'],
  '🧹': ['청소', '빗자루', '정리', 'clean', 'broom', 'tidy'],
  '🧽': ['청소', '스펀지', '닦기', 'clean', 'sponge', 'wash'],
  '🧼': ['비누', '손씻기', '청소', 'soap', 'wash', 'clean']
};

// 이모지 이름으로 검색
export const searchEmojis = (query: string): string[] => {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  Object.entries(EMOJI_SEARCH_MAP).forEach(([emoji, keywords]) => {
    if (keywords.some(keyword => keyword.includes(lowerQuery))) {
      results.push(emoji);
    }
  });

  return results;
};

// 카테고리에 맞는 추천 이모지 가져오기
export const getCategoryEmojiSuggestions = (categoryName: string): string[] => {
  return CATEGORY_EMOJI_SUGGESTIONS[categoryName as keyof typeof CATEGORY_EMOJI_SUGGESTIONS] || CATEGORY_EMOJI_SUGGESTIONS['개인'];
};

// 최근 사용한 이모지 관리
const RECENT_EMOJIS_KEY = 'recent-emojis';
const MAX_RECENT_EMOJIS = 15;

export const addToRecentEmojis = (emoji: string): void => {
  try {
    const recent = getRecentEmojis();
    const filtered = recent.filter(e => e !== emoji);
    const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent emoji:', error);
  }
};

export const getRecentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load recent emojis:', error);
    return [];
  }
};

// 테스트 함수 (개발용)
export const testEmojiValidation = () => {
  const testEmojis = ['🧹', '🧽', '🧼', '💼', '👤', '🏃', '❤️', 'abc', '🧹text', ''];

  console.log('=== 이모지 유효성 테스트 ===');
  testEmojis.forEach(emoji => {
    console.log(`"${emoji}" -> isValid: ${isValidEmoji(emoji)}, extracted: "${extractEmojis(emoji)}"`);
  });

  // 🧹의 유니코드 코드포인트 확인
  console.log('🧹 codePoint:', '🧹'.codePointAt(0)?.toString(16));
  console.log('🧹 length:', '🧹'.length);
  console.log('🧹 Array.from length:', Array.from('🧹').length);
};