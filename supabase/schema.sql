create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text not null,
  original_prompt text,
  slug text unique,
  status text not null default 'draft',
  published_at timestamptz null,
  category text null,
  template_variant text null,
  design_seed text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_status_check check (status in ('draft', 'published', 'unpublished'))
);

alter table public.projects
  add column if not exists slug text unique;

alter table public.projects
  add column if not exists status text not null default 'draft';

alter table public.projects
  add column if not exists published_at timestamptz null;

alter table public.projects
  add column if not exists category text null;

alter table public.projects
  add column if not exists template_variant text null;

alter table public.projects
  add column if not exists design_seed text null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_status_check'
  ) then
    alter table public.projects
      add constraint projects_status_check
      check (status in ('draft', 'published', 'unpublished'));
  end if;
end $$;

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_path text not null,
  file_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid null references public.projects(id) on delete set null,
  prompt text,
  category text,
  website_type text,
  generated_title text,
  app_code text,
  css_code text,
  quality_score int,
  validation_errors jsonb default '[]'::jsonb,
  user_rating int null,
  user_feedback text null,
  created_at timestamptz not null default now()
);

create table if not exists public.edit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid null references public.projects(id) on delete set null,
  instruction text,
  before_app_code text,
  before_css_code text,
  after_app_code text,
  after_css_code text,
  edit_success boolean,
  validation_errors jsonb default '[]'::jsonb,
  user_rating int null,
  created_at timestamptz not null default now()
);

create table if not exists public.template_examples (
  id uuid primary key default gen_random_uuid(),
  category text,
  template_variant text,
  original_prompt text,
  edit_instruction text,
  result_label text,
  title text,
  prompt text,
  app_code text,
  css_code text,
  rating int,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.template_examples
  add column if not exists template_variant text,
  add column if not exists original_prompt text,
  add column if not exists edit_instruction text,
  add column if not exists result_label text;

create table if not exists public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  domain text not null unique,
  status text not null default 'pending',
  verification_status text not null default 'pending',
  dns_instructions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_files_project_id_idx
  on public.project_files(project_id);

create unique index if not exists projects_slug_unique_idx
  on public.projects(slug)
  where slug is not null;

create index if not exists projects_status_idx
  on public.projects(status);

create index if not exists generation_logs_category_idx
  on public.generation_logs(category);

create index if not exists edit_logs_project_id_idx
  on public.edit_logs(project_id);

create index if not exists template_examples_category_idx
  on public.template_examples(category);

create index if not exists custom_domains_project_id_idx
  on public.custom_domains(project_id);

create index if not exists custom_domains_domain_idx
  on public.custom_domains(domain);

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

drop trigger if exists set_custom_domains_updated_at on public.custom_domains;
create trigger set_custom_domains_updated_at
before update on public.custom_domains
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.generation_logs enable row level security;
alter table public.edit_logs enable row level security;
alter table public.template_examples enable row level security;
alter table public.custom_domains enable row level security;

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

drop policy if exists "Development all generation logs" on public.generation_logs;
create policy "Development all generation logs"
on public.generation_logs for all
using (true)
with check (true);

drop policy if exists "Development all edit logs" on public.edit_logs;
create policy "Development all edit logs"
on public.edit_logs for all
using (true)
with check (true);

drop policy if exists "Development all template examples" on public.template_examples;
create policy "Development all template examples"
on public.template_examples for all
using (true)
with check (true);

drop policy if exists "Development all custom domains" on public.custom_domains;
create policy "Development all custom domains"
on public.custom_domains for all
using (true)
with check (true);
