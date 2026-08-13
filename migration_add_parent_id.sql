-- 서브 투두 기능을 위한 parent_id 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. todos 테이블에 parent_id 컬럼 추가
ALTER TABLE todos
ADD COLUMN parent_id UUID REFERENCES todos(id) ON DELETE CASCADE;

-- 2. 성능을 위한 인덱스 추가
CREATE INDEX idx_todos_parent_id ON todos(parent_id);

-- 3. 기존 데이터는 모두 parent_id = NULL로 유지 (이미 기본값)

-- 4. RLS 정책 확인 (기존 정책이 새 컬럼도 적용되는지 확인)
-- SELECT * FROM pg_policies WHERE tablename = 'todos';

-- 5. 테스트 쿼리
-- SELECT id, text, parent_id FROM todos WHERE user_id = auth.uid() ORDER BY created_at DESC;

COMMENT ON COLUMN todos.parent_id IS '부모 투두 ID (NULL이면 루트 레벨)';