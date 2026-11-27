alter table public.profiles
  add column username text;

update public.profiles
set username = 'user_' || substring(replace(id::text, '-', ''), 1, 12)
where username is null;

alter table public.profiles
  alter column username set not null;

alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9][a-z0-9_-]{2,23}$');

create unique index profiles_username_unique_idx
  on public.profiles (username);

create or replace function public.create_pending_teacher_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, institution, role, status)
  values (
    new.id,
    coalesce(
      nullif(lower(trim(new.raw_user_meta_data ->> 'username')), ''),
      'user_' || substring(replace(new.id::text, '-', ''), 1, 12)
    ),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Преподаватель'),
    coalesce(new.raw_user_meta_data ->> 'institution', ''),
    'teacher',
    'pending'
  );
  return new;
end;
$$;
