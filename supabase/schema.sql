create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text not null,
  original_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_path text not null,
  file_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_files_project_id_idx
  on public.project_files(project_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_project_files_updated_at on public.project_files;
create trigger set_project_files_updated_at
before update on public.project_files
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_files enable row level security;

drop policy if exists "Development read projects" on public.projects;
create policy "Development read projects"
on public.projects for select
using (true);

drop policy if exists "Development insert projects" on public.projects;
create policy "Development insert projects"
on public.projects for insert
with check (true);

drop policy if exists "Development update projects" on public.projects;
create policy "Development update projects"
on public.projects for update
using (true)
with check (true);

drop policy if exists "Development delete projects" on public.projects;
create policy "Development delete projects"
on public.projects for delete
using (true);

drop policy if exists "Development read project files" on public.project_files;
create policy "Development read project files"
on public.project_files for select
using (true);

drop policy if exists "Development insert project files" on public.project_files;
create policy "Development insert project files"
on public.project_files for insert
with check (true);

drop policy if exists "Development update project files" on public.project_files;
create policy "Development update project files"
on public.project_files for update
using (true)
with check (true);

drop policy if exists "Development delete project files" on public.project_files;
create policy "Development delete project files"
on public.project_files for delete
using (true);
