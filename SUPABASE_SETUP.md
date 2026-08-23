# 청음록 Supabase 연결 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. New project 생성
3. Project URL, anon public key 확인
   - Project Settings > API

## 2. 환경변수 설정

프로젝트 루트에 `.env.local` 생성:

```bash
cp .env.example .env.local
```

`.env.local`에 값 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY`는 Spotify 카탈로그를 검증해 저장하는 서버
라우트에서만 사용합니다. 절대로 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## 3. DB 스키마 실행

Supabase 대시보드에서:

1. SQL Editor 열기
2. `supabase/schema.sql` 전체 복사
3. Run 실행

생성되는 주요 테이블:

- `profiles`
- `albums`
- `tracks`
- `reviews`
- `review_likes`
- `review_comments`
- `album_comments`
- `follows`
- `news_posts`

## 4. 보안 migration 실행

`supabase/migrations/202608230001_security_ownership_and_privacy.sql`을 실행합니다.
이 migration은 취향 태그/추천 신호, 신고, 방문 이벤트 테이블과 보안 정책을
한 트랜잭션에서 적용합니다.

생성되는 테이블:

- `music_tags`
- `user_taste_signals`

## 5. 로컬 실행

```bash
npm run dev
```

## 6. 현재 구현된 핵심 흐름

1. 로그인/회원가입
2. Spotify 앨범/트랙 검색
3. `/write`에서 리뷰 저장
4. `/reviews`에서 공개 리뷰 불러오기
5. `/profile`에서 내 리뷰 표시 및 수정/삭제
6. 태그 기반 리뷰 필터와 취향 신호 표시
