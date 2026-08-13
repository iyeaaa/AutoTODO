import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiResponse } from '../types';

const API_KEY = 'AIzaSyDlIwXIVkpWD3COHVngvkPZAqLNX5uYp-M';

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: {
    responseMimeType: 'application/json',
  }
});

export const parseTextToTodos = async (text: string, availableCategories: string[] = [], availableSubcategories: { category: string; subcategories: { id: string; name: string }[] }[] = []): Promise<GeminiResponse> => {
  if (!text.trim()) {
    throw new Error('텍스트를 입력해주세요');
  }

  // 현재 날짜 정보
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 다음 주 월요일
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (7 - today.getDay() + 1) % 7 || 7);
  const nextMondayStr = nextMonday.toISOString().split('T')[0];

  const categoriesText = availableCategories.length > 0
    ? availableCategories.join(', ')
    : '업무, 개인, 건강, 쇼핑, 학습';

  // 서브카테고리 정보를 문자열로 변환
  const subcategoriesText = availableSubcategories.length > 0
    ? availableSubcategories.map(cat =>
        `${cat.category}: ${cat.subcategories.map(sub => sub.name).join(', ')}`
      ).join('\n')
    : `업무: 회의, 프로젝트, 리포트
개인: 취미, 가족, 자기계발
건강: 운동, 식단, 의료
쇼핑: 생필품, 의류, 전자제품
학습: 온라인강의, 독서, 시험준비`;

  const prompt = `
오늘 날짜: ${todayStr}
내일 날짜: ${tomorrowStr}
다음 주 월요일: ${nextMondayStr}

다음 텍스트에서 할 일(TODO)들을 추출해서 JSON 형식으로 반환해주세요.

응답 형식:
{
  "todos": [
    {
      "title": "할 일 제목",
      "dueDate": "YYYY-MM-DD (선택사항, 날짜가 명확하지 않으면 null)",
      "category": "카테고리명 (선택사항, 추론 불가능하면 null)",
      "subcategory": "서브카테고리명 (선택사항, 해당 카테고리에 맞는 서브카테고리가 있으면 추론)",
      "confidence": 0.9 (0.0-1.0, 카테고리/서브카테고리/날짜 추론의 확신도)
    }
  ],
  "summary": "추출된 할 일들에 대한 간단한 요약"
}

사용 가능한 카테고리: ${categoriesText}

사용 가능한 서브카테고리:
${subcategoriesText}

규칙:
1. 명령형 문장, "해야 할", "필요한" 등의 표현에서 할 일 추출
2. 나열된 항목들 (-, *, 1., 2. 등)에서 할 일 추출
3. 날짜/시간 표현 정확히 해석:
   - "내일" → ${tomorrowStr}
   - "다음 주" → ${nextMondayStr}
   - "월요일" → 다음 월요일 계산
   - "12월 25일" → 연도 추가하여 완전한 날짜로
   - 애매한 표현("나중에", "언젠가")은 null
4. 카테고리 및 서브카테고리 추론:
   - 먼저 적절한 카테고리 판단
   - 해당 카테고리에 서브카테고리가 있으면 더 구체적으로 분류
   - 예: "팀 회의" → category: "업무", subcategory: "회의"
   - 예: "헬스장 가기" → category: "건강", subcategory: "운동"
   - 예: "책 주문" → category: "쇼핑", subcategory: "온라인강의" (아니면 null)
5. 서브카테고리 추론 규칙:
   - 회의: 미팅, 회의, 발표, 논의 관련
   - 프로젝트: 개발, 기획, 설계, 프로젝트 관련
   - 리포트: 보고서, 문서, 작성, 정리 관련
   - 운동: 헬스, 러닝, 요가, 체육 관련
   - 식단: 요리, 음식, 다이어트, 영양 관련
   - 의료: 병원, 치료, 약, 건강검진 관련
6. 중복되거나 유사한 할 일은 하나로 통합
7. 너무 모호한 내용은 제외

텍스트:
${text}
`;

  // 재시도 로직
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      return JSON.parse(responseText) as GeminiResponse;
    } catch (error: any) {
      lastError = error;
      console.error(`Gemini API Error (attempt ${attempt}/${maxRetries}):`, error);

      // 에러 유형 확인
      const isRetryableError = error.message?.includes('503') ||
                              error.message?.includes('overloaded') ||
                              error.message?.includes('429') ||
                              error.message?.includes('quota');

      // 마지막 시도가 아니고 재시도 가능한 에러인 경우
      if (attempt < maxRetries && isRetryableError) {
        // 지수 백오프: 1초, 2초, 4초
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`${delay}ms 후 재시도합니다...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // 마지막 시도이거나 재시도 불가능한 에러
      break;
    }
  }

  // 모든 재시도 실패 시 구체적인 에러 메시지 제공
  if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
    throw new Error('AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
  } else if (lastError.message?.includes('429') || lastError.message?.includes('quota')) {
    throw new Error('API 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.');
  } else if (lastError.message?.includes('401') || lastError.message?.includes('403')) {
    throw new Error('API 키가 유효하지 않습니다. 설정을 확인해주세요.');
  } else {
    throw new Error('AI 분석 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
  }
};