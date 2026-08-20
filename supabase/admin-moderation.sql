-- 관리자 리뷰 숨김/복구 권한
-- Supabase SQL Editor에서 실행하세요.
drop policy if exists "admins can moderate reviews" on public.reviews;

create policy "admins can moderate reviews"
on public.reviews for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
