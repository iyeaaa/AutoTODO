# Supabase Google OAuth 설정 가이드

이 가이드는 TODO 앱에 Google 로그인 기능을 추가하기 위한 Supabase 설정 방법을 안내합니다.

## 1. 데이터베이스 마이그레이션

1. Supabase 대시보드에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 **SQL Editor**를 클릭합니다.
4. `migration.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣습니다.
5. **Run** 버튼을 클릭하여 마이그레이션을 실행합니다.

## 2. Google OAuth 설정

### 2.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인합니다.
2. 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
3. **APIs & Services** > **Credentials**로 이동합니다.
4. **Create Credentials** > **OAuth 2.0 Client IDs**를 클릭합니다.
5. Application type으로 **Web application**을 선택합니다.
6. **Authorized redirect URIs**에 다음을 추가합니다:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (your-project-ref를 실제 Supabase 프로젝트 참조로 교체)

7. **Create**를 클릭하고 Client ID와 Client Secret을 복사합니다.

### 2.2 Supabase OAuth 설정

1. Supabase 대시보드로 돌아갑니다.
2. **Authentication** > **Providers**로 이동합니다.
3. **Google** 제공자를 찾아 **Enable** 토글을 켭니다.
4. Google Cloud Console에서 복사한 정보를 입력합니다:
   - **Client ID**: Google OAuth Client ID
   - **Client Secret**: Google OAuth Client Secret
5. **Save**를 클릭합니다.

### 2.3 리다이렉트 URL 설정

1. **Authentication** > **URL Configuration**으로 이동합니다.
2. **Redirect URLs**에 다음을 추가합니다:
   ```
   http://localhost:5173/ (개발용)
   https://your-domain.com/ (운영용)
   ```
3. **Save**를 클릭합니다.

## 3. 환경 변수 확인

`.env` 파일이 있다면 다음 변수들이 올바르게 설정되어 있는지 확인하세요:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. 테스트

1. 개발 서버를 시작합니다:
   ```bash
   npm run dev
   ```

2. 브라우저에서 앱에 접속합니다.

3. **Google로 시작하기** 버튼을 클릭합니다.

4. Google 계정으로 로그인하고 권한을 승인합니다.

5. 성공적으로 로그인되면 TODO 앱 메인 화면이 표시됩니다.

## 5. 문제 해결

### 로그인 후 리다이렉트되지 않는 경우
- Supabase의 Redirect URLs 설정을 확인하세요.
- Google Cloud Console의 Authorized redirect URIs 설정을 확인하세요.

### "Invalid OAuth state" 오류
- 브라우저 쿠키가 차단되어 있지 않은지 확인하세요.
- 시크릿 모드에서 테스트해보세요.

### "Access denied" 오류
- Google OAuth 앱이 테스트 모드가 아닌 프로덕션 모드로 설정되어 있는지 확인하세요.
- 테스트 사용자 목록에 추가되어 있는지 확인하세요.

## 6. 보안 고려사항

1. **RLS (Row Level Security)**가 모든 테이블에서 활성화되어 있는지 확인하세요.
2. 프로덕션 환경에서는 반드시 HTTPS를 사용하세요.
3. Supabase 프로젝트의 API 키를 공개 저장소에 커밋하지 마세요.
4. 정기적으로 OAuth 자격 증명을 회전하세요.

## 7. 다음 단계

로그인 기능이 정상적으로 작동하면:

1. 사용자별 데이터 분리가 올바르게 작동하는지 테스트하세요.
2. 기존 익명 데이터 마이그레이션을 테스트하세요.
3. 오프라인 기능이 여전히 작동하는지 확인하세요.
4. 다양한 기기와 브라우저에서 테스트하세요.