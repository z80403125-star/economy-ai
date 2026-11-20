create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.account_status as enum ('pending', 'approved', 'blocked');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160),
  institution text not null default '' check (char_length(institution) <= 240),
  role public.app_role not null default 'teacher',
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tests (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text not null default '',
  category text not null,
  question_count integer not null check (question_count > 0),
  legacy_path text not null,
  published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_slug text not null references public.tests (slug) on delete cascade,
  position integer not null check (position > 0),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_index integer not null check (correct_index >= 0),
  explanation text not null default '',
  unique (test_slug, position),
  check (correct_index < jsonb_array_length(options))
);

create table public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  test_slug text not null references public.tests (slug) on delete restrict,
  access_token uuid not null unique default gen_random_uuid(),
  title text not null default '',
  due_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.test_assignments (id) on delete cascade,
  student_name text not null check (char_length(student_name) between 1 and 160),
  correct_answers integer not null check (correct_answers >= 0),
  total_questions integer not null check (total_questions > 0),
  percentage numeric(5, 2) generated always as
    (round(correct_answers::numeric * 100 / total_questions, 2)) stored,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  check (correct_answers <= total_questions),
  check (jsonb_array_length(answers) = total_questions)
);

create table public.lectures (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text not null,
  published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  lecture_id uuid not null references public.lectures (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, lecture_id)
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index test_assignments_teacher_created_idx
  on public.test_assignments (teacher_id, created_at desc);
create index test_attempts_assignment_created_idx
  on public.test_attempts (assignment_id, created_at desc);
create index lectures_category_published_idx
  on public.lectures (category, published);
create index activity_logs_created_idx
  on public.activity_logs (created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and status = 'approved'
  );
$$;

create or replace function public.is_approved_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'teacher'
      and status = 'approved'
  );
$$;

create or replace function public.create_pending_teacher_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, institution, role, status)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Преподаватель'),
    coalesce(new.raw_user_meta_data ->> 'institution', ''),
    'teacher',
    'pending'
  );
  return new;
end;
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_approved_teacher() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved_teacher() to authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_pending_teacher_profile();

alter table public.profiles enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_assignments enable row level security;
alter table public.test_attempts enable row level security;
alter table public.lectures enable row level security;
alter table public.favorites enable row level security;
alter table public.activity_logs enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.tests to authenticated;
grant select on public.tests to anon;
grant select, insert, update, delete on public.test_questions to authenticated;
grant select, insert, update, delete on public.test_assignments to authenticated;
grant select on public.test_attempts to authenticated;
grant select, insert, update, delete on public.lectures to authenticated;
grant select on public.lectures to anon;
grant select, insert, update, delete on public.favorites to authenticated;
grant select on public.activity_logs to authenticated;

create policy "Profiles are visible to their owner or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins manage profiles"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Published tests are public"
  on public.tests for select to anon, authenticated
  using (published);

create policy "Admins manage tests"
  on public.tests for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Approved teachers read assigned test questions"
  on public.test_questions for select to authenticated
  using (
    (select public.is_admin())
    or (
      (select public.is_approved_teacher())
      and exists (
        select 1
        from public.test_assignments a
        where a.test_slug = test_questions.test_slug
          and a.teacher_id = (select auth.uid())
      )
    )
  );

create policy "Admins manage test questions"
  on public.test_questions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Teachers read their assignments"
  on public.test_assignments for select to authenticated
  using (teacher_id = (select auth.uid()) or (select public.is_admin()));

create policy "Approved teachers create assignments"
  on public.test_assignments for insert to authenticated
  with check (
    teacher_id = (select auth.uid())
    and (select public.is_approved_teacher())
  );

create policy "Teachers update their assignments"
  on public.test_assignments for update to authenticated
  using (teacher_id = (select auth.uid()) or (select public.is_admin()))
  with check (teacher_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins delete assignments"
  on public.test_assignments for delete to authenticated
  using ((select public.is_admin()));

create policy "Teachers read attempts for their assignments"
  on public.test_attempts for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.test_assignments a
      where a.id = test_attempts.assignment_id
        and a.teacher_id = (select auth.uid())
    )
  );

create policy "Published lectures are public"
  on public.lectures for select to anon, authenticated
  using (published or (select public.is_admin()));

create policy "Admins manage lectures"
  on public.lectures for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users manage their own favorites"
  on public.favorites for all to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins read activity logs"
  on public.activity_logs for select to authenticated
  using ((select public.is_admin()));

insert into public.tests (slug, title, description, category, question_count, legacy_path)
values
  ('economy-cycles', 'Цикличность развития национального хозяйства', 'Экономические циклы, макроэкономические показатели и меры экономической политики.', 'Национальное хозяйство', 20, '/tests/economy-cycles/index.html'),
  ('production-organization', 'Общие типы организации производства', 'Типы производства, специализация, поточная организация и кооперация.', 'Производство', 20, '/tests/production-organization/index.html'),
  ('ownership-and-economy', 'Собственность и экономика', 'Формы собственности, экономические системы и их особенности.', 'Собственность', 20, '/tests/ownership-and-economy/index.html'),
  ('market-economy', 'Экономическая викторина: рыночная экономика', 'Спрос, предложение, цены, конкуренция, предпринимательство и роль государства.', 'Рыночная экономика', 20, '/tests/market-economy/index.html'),
  ('property-and-society', 'Собственность и социально-экономический строй', 'Права собственности, формы владения и связь собственности с устройством общества.', 'Собственность', 20, '/tests/property-and-society/index.html'),
  ('competition-and-monopolies', 'Рынок знаний: конкуренция и монополии', 'Рыночные структуры, рыночная власть, картели и антимонопольное регулирование.', 'Конкуренция и монополия', 20, '/tests/competition-and-monopolies/index.html'),
  ('economics-basics', 'Экономическая викторина', 'Основы экономики, ограниченность ресурсов, производство и экономические системы.', 'Основы экономики', 20, '/tests/economics-basics/index.html'),
  ('salary-basics', 'Зарплата без секретов', 'Начисления, выплаты, налоги и документы по оплате труда.', 'Заработная плата', 20, '/tests/salary-basics/index.html'),
  ('income-and-profit', 'Финансовый радар: доход и прибыль', 'Доходы, выручка, расходы, прибыль и точка безубыточности.', 'Доходы и прибыль', 20, '/tests/income-and-profit/index.html'),
  ('advertising-basics', 'Реклама вокруг нас', 'Виды рекламы, её цели, аудитория и влияние на выбор покупателей.', 'Реклама и маркетинг', 20, '/tests/advertising-basics/index.html')
on conflict (slug) do nothing;
