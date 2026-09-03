# 청음록 배포 체크리스트

## 1. 지원 런타임과 품질 게이트

- Node.js: `22.13.0` 이상 `22.x` 또는 `24.x`
- 설치: 잠금파일을 사용하는 `npm ci`

```bash
npm ci
npm run check
npm run audit:prod
```

`check`는 test → lint → production build 순서로 실행됩니다. 하나라도 실패하면
배포하지 않습니다. Node.js 21과 23은 일부 개발 의존성의 지원 범위 밖입니다.

로컬 스모크 확인:

```bash
npm run dev
```

```text
http://localhost:3000
```

## 2. Vercel 환경변수

Vercel Project Settings > Environment Variables에 등록합니다.

| 이름 | 공개 여부 | 권장 범위 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저 공개 | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 공개 | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 비밀** | Production, Preview |
| `SPOTIFY_CLIENT_ID` | 서버 비밀 | Production, Preview |
| `SPOTIFY_CLIENT_SECRET` | **서버 비밀** | Production, Preview |

- `SUPABASE_SERVICE_ROLE_KEY`에는 전용 `sb_secret_...` 키 또는 legacy
  `service_role` 키를 사용합니다.
- 비밀값에 `NEXT_PUBLIC_` 접두사를 붙이거나 채팅, 이슈, 빌드 로그에
  붙여넣지 않습니다.
- `.env.local` 전체를 일괄 복사하지 말고 변수 이름과 대상 환경을 하나씩
  확인합니다.
- 키를 저장하거나 변경한 뒤에는 새 배포를 만들어야 기존 배포에 반영됩니다.

## 3. Supabase 사전 조건

`supabase/README-apply-security.md`의 버전 순서대로 schema와 migration을
적용하고 검증 SQL 및 역할별 RLS 테스트를 완료합니다. 운영 DB의 적용 상태를
저장소 문서만 보고 추정하지 않습니다.

관리자 권한은 앱 UI로 부여하지 말고 신뢰된 운영 절차로만 설정합니다.

## 4. Supabase Auth URL

Supabase Dashboard > Authentication > URL Configuration:

```text
Site URL: https://cheongeumrok.vercel.app
Redirect URLs: https://cheongeumrok.vercel.app/**
```

커스텀 도메인을 사용하면 해당 HTTPS 주소도 추가합니다. Preview 전체 와일드카드는
팀 정책에 따라 필요한 경우에만 추가합니다.

## 5. 변경 검토와 배포

`npm run deploy`는 품질 게이트와 운영 의존성 감사를 다시 실행한 뒤, 현재
브랜치의 추적/미추적 변경을 모두 커밋하고 GitHub에 push합니다. 실행 직전에
아래를 확인합니다.

```bash
git status --short
git branch --show-current
git diff --check
```

```bash
npm run deploy -- "커밋 메시지"
```

main 보호 규칙 또는 PR 검토를 사용하는 저장소에서는 자동 명령 대신 승인된
PR 병합 절차를 따릅니다. 이 체크리스트를 검증하는 동안에는 명령을 실행하지
않습니다.

## 6. 배포 후 테스트 플로우

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
11. 비로그인 사용자가 비공개 리뷰/반응을 조회할 수 없는지 확인
12. 일반 사용자가 관리자 권한을 변경할 수 없는지 확인
13. 응답에 `X-Content-Type-Options`, `X-Frame-Options`, HSTS 헤더가 있는지 확인

## 7. 롤백 준비

- 배포 전 main 커밋 SHA와 직전 정상 Vercel 배포를 기록합니다.
- 앱 롤백은 Vercel의 직전 정상 배포 Promote/Redeploy 절차를 사용합니다.
- DB migration은 앱 배포와 별도로 취급합니다. 운영 데이터가 있는 migration은
  적용 전에 검증 SQL과 복구 절차를 준비합니다.
