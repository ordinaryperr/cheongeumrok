# 청음록

**취향을 넓히며, 나만의 울타리를 조금씩 넓혀가는 음악 기록 커뮤니티.**

청음록은 앨범과 곡을 검색하고, 별점과 감상을 남기고, 다른 사람의 기록을 통해 새로운 음악을 발견하는 Next.js 기반 MVP입니다.

## 주요 기능

- Spotify 앨범/트랙 검색
- 앨범/트랙 리뷰 작성
- 0.5 단위 별점 입력
- 한줄평/긴 감상/추천 트랙/취향 확장 메모 저장
- 공개 리뷰 피드 및 정렬/태그 필터
- 팔로잉 피드
- 내 프로필/청음 기록/평균 별점/취향 신호
- 리뷰 수정/삭제
- 앨범 상세 및 댓글
- 뉴스/에디터 글 및 관리자 등록 화면
- Beyond Your Fence 취향 확장 페이지
- PWA manifest/service worker

## 기술 스택

- Next.js 16
- React 19
- Supabase Auth/Database/RLS
- Spotify Web API
- ESLint
- Vercel 배포 기준

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

로컬 주소:

```text
http://localhost:3000
```

## 환경변수

`.env.local`에 아래 값을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

## Supabase 설정

Supabase SQL Editor에서 아래 순서로 실행합니다.

1. `supabase/schema.sql`
2. `supabase/ontology-schema.sql`

`schema.sql`은 기본 MVP 테이블을 생성합니다.

- `profiles`
- `albums`
- `tracks`
- `reviews`
- `review_likes`
- `review_comments`
- `album_comments`
- `follows`
- `news_posts`

`ontology-schema.sql`은 취향 분석/태그 기능용 테이블을 생성합니다.

- `music_tags`
- `user_taste_signals`

관리자 뉴스 등록을 사용하려면 Supabase에서 해당 계정의 프로필을 관리자 처리합니다.

```sql
update public.profiles
set is_admin = true
where id = 'USER_ID';
```

## 주요 명령어

```bash
npm run dev      # 개발 서버
npm run lint     # ESLint 검사
npm run build    # 프로덕션 빌드 확인
npm run start    # 빌드 결과 실행
```

배포 전 자동 확인/커밋/푸시:

```bash
npm run deploy -- "Commit message"
```

## 배포 전 테스트 플로우

1. 홈 접속
2. 회원가입/로그인
3. `/search`에서 Spotify 검색
4. 앨범 또는 트랙 선택
5. `/write`에서 리뷰 저장
6. `/reviews`에 리뷰 노출 확인
7. `/profile`에서 내 기록 확인
8. 리뷰 수정/삭제 확인
9. 앨범 상세 댓글 확인
10. 관리자 계정으로 `/admin/news`에서 뉴스 등록
11. `/news`에서 뉴스 노출 확인
12. `/beyond-your-fence`에서 취향 확장 페이지 확인

## 제품 방향

자세한 제품 방향은 `PRODUCT_DIRECTION.md`를 참고합니다.

MVP 우선순위는 다음 흐름입니다.

1. 검색 → 앨범 상세 → 리뷰 작성
2. 별점 입력 UX
3. 리뷰 피드
4. 내 프로필/청음 기록
5. 최근 뉴스/에디터 섹션
6. Supabase 로그인/DB
7. Spotify API 검색
