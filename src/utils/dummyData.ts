import type { Todo } from '../types';

export const dummyTodos: Todo[] = [
  {
    id: '1',
    text: '프로젝트 기획서 작성',
    completed: false,
    category: '업무',
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    text: '운동하기',
    completed: true,
    category: '건강',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    text: '장보기 (우유, 계란, 빵)',
    completed: false,
    category: '쇼핑',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    text: '친구와 저녁 약속',
    completed: false,
    category: '개인',
    due_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    text: '독서 - JavaScript 완벽 가이드',
    completed: true,
    category: '학습',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];