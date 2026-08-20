-- 청음록 관리자 권한 부여
-- Supabase SQL Editor에서 실행하세요.
update public.profiles
set is_admin = true
where id = '22479c99-af0c-4b8e-bd62-74c5703ffd98';

select id, username, display_name, is_admin
from public.profiles
where id = '22479c99-af0c-4b8e-bd62-74c5703ffd98';
