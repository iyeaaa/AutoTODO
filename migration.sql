-- Google 로그인 기능을 위한 데이터베이스 스키마 마이그레이션
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- Step 1: user_id 컬럼을 todos 테이블에 추가
ALTER TABLE todos
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: user_id 컬럼을 categories 테이블에 추가
ALTER TABLE categories
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: user_id 컬럼을 subcategories 테이블에 추가
ALTER TABLE subcategories
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Row Level Security (RLS) 정책 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Step 5: todos 테이블 RLS 정책 생성
-- 사용자는 자신의 todos만 볼 수 있음
CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 todos만 삽입할 수 있음
CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 todos만 수정할 수 있음
CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 todos만 삭제할 수 있음
CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Step 6: categories 테이블 RLS 정책 생성
-- 사용자는 자신의 categories만 볼 수 있음
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 categories만 삽입할 수 있음
CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 categories만 수정할 수 있음
CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 categories만 삭제할 수 있음
CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- Step 7: subcategories 테이블 RLS 정책 생성
-- 사용자는 자신의 subcategories만 볼 수 있음
CREATE POLICY "Users can view their own subcategories" ON subcategories
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 subcategories만 삽입할 수 있음
CREATE POLICY "Users can insert their own subcategories" ON subcategories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 subcategories만 수정할 수 있음
CREATE POLICY "Users can update their own subcategories" ON subcategories
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 subcategories만 삭제할 수 있음
CREATE POLICY "Users can delete their own subcategories" ON subcategories
    FOR DELETE USING (auth.uid() = user_id);

-- Step 8: 기본 카테고리 생성 함수 (새 사용자를 위한)
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 개인 카테고리 생성
  INSERT INTO categories (name, color, icon, display_order, user_id)
  VALUES ('개인', '#6B7280', '👤', 1, NEW.id);

  -- 업무 카테고리 생성
  INSERT INTO categories (name, color, icon, display_order, user_id)
  VALUES ('업무', '#3B82F6', '💼', 2, NEW.id);

  -- 학습 카테고리 생성
  INSERT INTO categories (name, color, icon, display_order, user_id)
  VALUES ('학습', '#10B981', '📚', 3, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: 새 사용자 등록 시 기본 카테고리 자동 생성 트리거
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_user();

-- Step 10: 기존 데이터 정리 (선택사항)
-- 기존의 익명 데이터는 수동으로 처리하거나 삭제할 수 있습니다
-- 만약 기존 데이터를 모두 삭제하려면 다음 주석을 해제하세요:

-- DELETE FROM todos WHERE user_id IS NULL;
-- DELETE FROM subcategories WHERE user_id IS NULL;
-- DELETE FROM categories WHERE user_id IS NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Google 로그인 기능을 위한 데이터베이스 마이그레이션이 완료되었습니다!';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. Supabase 대시보드에서 Google OAuth 설정';
  RAISE NOTICE '2. 허용된 리다이렉트 URL 추가';
  RAISE NOTICE '3. 앱에서 로그인 테스트';
END $$;