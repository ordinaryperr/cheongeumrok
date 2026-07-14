# 청음록 배포 체크리스트

## 로컬 확인

```bash
npm run build
npm run dev
```

로컬 주소:

```text
http://localhost:3000
```

## 자동 배포 명령

수정 후 아래 명령을 실행하면 빌드 확인, Git 커밋, GitHub push까지 한 번에 진행됩니다.
Vercel은 GitHub push를 감지해 자동 재배포합니다.

```bash
npm run deploy -- "커밋 메시지"
```

예시:

```bash
npm run deploy -- "Update homepage copy"
```

변경사항이 없으면 커밋/푸시하지 않고 종료됩니다.

## Vercel 환경변수

Vercel Project Settings > Environment Variables에 아래 값을 등록합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

값은 로컬 `.env.local`에 있는 값을 그대로 옮기면 됩니다.

## Supabase 확인

Supabase SQL Editor에서 `supabase/schema.sql`이 적용되어 있어야 합니다.

필수 테이블:

- profiles
- albums
- tracks
- reviews
- album_comments
- news_posts

관리자 계정은 `profiles.is_admin = true`로 설정합니다.

## 배포 후 테스트 플로우

1. 홈 접속
2. 로그인/회원가입
3. `/search`에서 Spotify 검색
4. 검색 결과에서 기록하기
5. `/write`에서 리뷰 저장
6. `/profile`에서 내 기록 확인
7. 리뷰 수정/삭제
8. 앨범 상세에서 댓글 작성/삭제
9. `/admin/news`에서 관리자 계정으로 뉴스 등록
10. `/news`에서 뉴스 노출 확인

## Supabase Auth Redirect URL

Vercel 배포 주소가 생기면 Supabase Dashboard > Authentication > URL Configuration에서 아래를 등록합니다.

```text
Site URL: https://cheongeumrok.vercel.app
Redirect URLs: https://cheongeumrok.vercel.app/**
```
