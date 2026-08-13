-- RLS 정책 확인용 SQL
-- Supabase SQL Editor에서 실행하여 현재 정책 상태 확인

-- 1. 현재 todos 테이블의 RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'todos'
ORDER BY policyname;

-- 2. 테이블 구조 확인 (parent_id 컬럼이 추가되었는지)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'todos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 테스트 쿼리 (권한 확인)
-- SELECT id, text, parent_id, user_id FROM todos WHERE user_id = auth.uid() LIMIT 5;