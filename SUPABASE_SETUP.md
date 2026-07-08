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
```

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
- `follows`
- `news_posts`

## 4. 로컬 실행

```bash
npm run dev
```

## 5. 다음 구현 순서

1. 로그인/회원가입 페이지
2. `/write`에서 실제 리뷰 저장
3. `/reviews`에서 Supabase 리뷰 불러오기
4. `/profile`에서 내 리뷰만 표시
5. Spotify API 검색 연결
