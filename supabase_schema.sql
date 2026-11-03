-- ============================================================================
-- RISEUP COLLEGE ACADEMIC RESULTS PUBLISHER - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- 
-- ⚡ QUICK SETUP:
-- 1. Create a free project at https://supabase.com
-- 2. Open Supabase Dashboard -> SQL Editor -> New Query
-- 3. Paste this entire file and click "Run"
-- 4. Copy your Project URL & Anon Key into src/services/supabaseClient.js
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. SCHOOL SETTINGS TABLE
-- Stores school metadata, grading scales (WAEC/NECO), CA/Exam weights, term/session
-- ============================================================================
create table if not exists public.school_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 2. CLASSES TABLE
-- Stores class definitions (e.g., Grade 10A, JSS 1A)
-- ============================================================================
create table if not exists public.classes (
  id text primary key,
  name text not null,
  level text not null default 'Senior', -- 'Junior' | 'Senior'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 3. SUBJECTS TABLE
-- Stores subjects and their 7 Department Classifications
-- ============================================================================
create table if not exists public.subjects (
  id text primary key,
  name text not null,
  code text,
  department text not null default 'General',
  -- department values: 'General', 'Science', 'Art', 'Commercial', 'Arts & Commercial', 'Elective', 'Junior'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 4. STUDENTS REGISTER TABLE
-- Stores student profiles, departments, assigned class, and access PIN for result checking
-- ============================================================================
create table if not exists public.students (
  id text primary key,
  reg_no text,
  name text not null,
  class_id text not null references public.classes(id) on delete cascade,
  department text not null default 'General',
  -- department values: 'General', 'Science', 'Art', 'Commercial', 'Junior'
  access_pin text not null default '1234',
  gender text default 'M',
  guardian_phone text,
  guardian_email text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_students_dept on public.students(department);

-- ============================================================================
-- 5. GRADES TABLE
-- Stores continuous assessments (CA), exam marks, total, grade, remark per term/session
-- ============================================================================
create table if not exists public.grades (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.students(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  session_id text not null default '2025/2026',
  term_id text not null default 't1', -- 't1' | 't2' | 't3'
  ca numeric(5,2),
  exam numeric(5,2),
  total numeric(5,2),
  grade text,
  remark text,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint uq_student_subject_term_session unique (student_id, subject_id, session_id, term_id)
);

create index if not exists idx_grades_lookup on public.grades(student_id, session_id, term_id);
create index if not exists idx_grades_class_sub on public.grades(class_id, subject_id, session_id, term_id);

-- ============================================================================
-- 6. APP USERS TABLE
-- Stores user credentials for Admin, Class Teacher, Subject Teacher, and Student logins
-- ============================================================================
create table if not exists public.app_users (
  id text primary key default gen_random_uuid()::text,
  username text unique not null,
  password text not null,
  role text not null, -- 'admin' | 'class_teacher' | 'teacher' | 'student'
  full_name text not null,
  assigned_class_id text references public.classes(id) on delete set null,
  assigned_subject_id text references public.subjects(id) on delete set null,
  student_id text references public.students(id) on delete cascade,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Enables open client access with the public anon key for smooth app functioning
-- ============================================================================
alter table public.school_settings enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.grades enable row level security;
alter table public.app_users enable row level security;

-- Open policies for anon client
drop policy if exists "Allow public access to school_settings" on public.school_settings;
create policy "Allow public access to school_settings" on public.school_settings for all using (true) with check (true);

drop policy if exists "Allow public access to classes" on public.classes;
create policy "Allow public access to classes" on public.classes for all using (true) with check (true);

drop policy if exists "Allow public access to subjects" on public.subjects;
create policy "Allow public access to subjects" on public.subjects for all using (true) with check (true);

drop policy if exists "Allow public access to students" on public.students;
create policy "Allow public access to students" on public.students for all using (true) with check (true);

drop policy if exists "Allow public access to grades" on public.grades;
create policy "Allow public access to grades" on public.grades for all using (true) with check (true);

drop policy if exists "Allow public access to app_users" on public.app_users;
create policy "Allow public access to app_users" on public.app_users for all using (true) with check (true);

-- ============================================================================
-- 8. INITIAL SEED DATA
-- Pre-configures RiseUp College default classes, subjects, students, and users
-- ============================================================================

-- School Settings
insert into public.school_settings (key, value)
values
  ('schoolName', '"RiseUp College"'::jsonb),
  ('schoolMotto', '"Excellence, Knowledge & Integrity"'::jsonb),
  ('schoolAddress', '"Plot 14, Academic Boulevard, Victoria Island, Lagos"'::jsonb),
  ('schoolEmail', '"info@riseupcollege.edu.ng"'::jsonb),
  ('schoolPhone', '"+234 800 747 3872"'::jsonb),
  ('principalName', '"Dr. (Mrs.) C. N. Okonjo (Ph.D, FSTAN)"'::jsonb),
  ('activeTerm', '"t1"'::jsonb),
  ('activeSession', '"2025/2026"'::jsonb),
  ('sessions', '["2024/2025", "2025/2026", "2026/2027"]'::jsonb),
  ('caWeight', '40'::jsonb),
  ('examWeight', '60'::jsonb),
  ('scale', '[
    {"grade": "A1", "min": 75, "max": 100, "remark": "Excellent"},
    {"grade": "B2", "min": 70, "max": 74, "remark": "Very Good"},
    {"grade": "B3", "min": 65, "max": 69, "remark": "Good"},
    {"grade": "C4", "min": 60, "max": 64, "remark": "Credit"},
    {"grade": "C5", "min": 55, "max": 59, "remark": "Credit"},
    {"grade": "C6", "min": 50, "max": 54, "remark": "Credit"},
    {"grade": "D7", "min": 45, "max": 49, "remark": "Pass"},
    {"grade": "E8", "min": 40, "max": 44, "remark": "Pass"},
    {"grade": "F9", "min": 0, "max": 39, "remark": "Fail"}
  ]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Classes
insert into public.classes (id, name, level)
values
  ('c1', 'Grade 10A', 'Senior'),
  ('c2', 'Grade 11B', 'Senior'),
  ('c3', 'JSS 1A', 'Junior')
on conflict (id) do nothing;

-- Subjects
insert into public.subjects (id, name, code, department)
values
  ('s1', 'Mathematics', 'MTH', 'General'),
  ('s2', 'English Language', 'ENG', 'General'),
  ('s3', 'Chemistry', 'CHM', 'Science'),
  ('s4', 'Physics', 'PHY', 'Science'),
  ('s5', 'Economics', 'ECO', 'Arts & Commercial'),
  ('s6', 'Literature in English', 'LIT', 'Art'),
  ('s7', 'Government', 'GOV', 'Arts & Commercial'),
  ('s8', 'Financial Accounting', 'ACC', 'Commercial'),
  ('s9', 'Biology', 'BIO', 'Science'),
  ('s10', 'Civic Education', 'CIV', 'General'),
  ('s11', 'Computer Studies', 'CMP', 'Elective'),
  ('s12', 'Agricultural Science', 'AGR', 'Elective'),
  ('s13', 'Basic Science', 'BSC', 'Junior'),
  ('s14', 'Basic Technology', 'BTC', 'Junior'),
  ('s15', 'Social Studies', 'SOS', 'Junior'),
  ('s16', 'Business Studies', 'BUS', 'Junior')
on conflict (id) do nothing;

-- Students
insert into public.students (id, reg_no, name, class_id, department, access_pin, gender)
values
  ('st1', 'RC/2026/001', 'Chinedu Okafor', 'c1', 'Science', '8821', 'M'),
  ('st2', 'RC/2026/002', 'Amina Yusuf', 'c1', 'Art', '4412', 'F'),
  ('st3', 'RC/2026/003', 'Tunde Bakare', 'c1', 'Commercial', '9103', 'M'),
  ('st4', 'RC/2026/004', 'Elizabeth Adebayo', 'c1', 'Science', '5529', 'F'),
  ('st5', 'RC/2026/005', 'John Peterson', 'c2', 'Science', '7311', 'M'),
  ('st6', 'RC/2026/006', 'Fatima Umar', 'c2', 'Art', '3284', 'F'),
  ('st7', 'RC/2026/007', 'Blessing Eze', 'c3', 'Junior', '6045', 'F')
on conflict (id) do nothing;

-- Default Users
insert into public.app_users (username, password, role, full_name, assigned_class_id, assigned_subject_id, student_id)
values
  ('admin', 'adminpassword', 'admin', 'School Administrator', null, null, null),
  ('class_teacher', 'teacherpassword', 'class_teacher', 'Mr. Emmanuel Adeyemi (Class Teacher)', 'c1', null, null),
  ('subject_teacher', 'teacherpassword', 'teacher', 'Mrs. Folashade Adeleke (Subject Teacher)', null, 's1', null),
  ('st1', 'okafor', 'student', 'Chinedu Okafor', 'c1', null, 'st1'),
  ('st2', 'yusuf', 'student', 'Amina Yusuf', 'c1', null, 'st2'),
  ('st7', 'eze', 'student', 'Blessing Eze', 'c3', null, 'st7')
on conflict (username) do nothing;

-- Demo Grades for Term 1 (Grade 10A)
insert into public.grades (student_id, class_id, subject_id, session_id, term_id, ca, exam, total, grade, remark)
values
  ('st1', 'c1', 's1', '2025/2026', 't1', 34, 52, 86, 'A1', 'Excellent'),
  ('st1', 'c1', 's2', '2025/2026', 't1', 31, 48, 79, 'A1', 'Excellent'),
  ('st1', 'c1', 's3', '2025/2026', 't1', 36, 50, 86, 'A1', 'Excellent'),
  ('st1', 'c1', 's4', '2025/2026', 't1', 32, 45, 77, 'A1', 'Excellent'),
  ('st1', 'c1', 's9', '2025/2026', 't1', 30, 42, 72, 'B2', 'Very Good'),
  ('st1', 'c1', 's10', '2025/2026', 't1', 35, 45, 80, 'A1', 'Excellent'),
  ('st1', 'c1', 's11', '2025/2026', 't1', 37, 54, 91, 'A1', 'Excellent'),
  
  ('st2', 'c1', 's1', '2025/2026', 't1', 28, 40, 68, 'B3', 'Good'),
  ('st2', 'c1', 's2', '2025/2026', 't1', 35, 50, 85, 'A1', 'Excellent'),
  ('st2', 'c1', 's5', '2025/2026', 't1', 32, 44, 76, 'A1', 'Excellent'),
  ('st2', 'c1', 's6', '2025/2026', 't1', 36, 52, 88, 'A1', 'Excellent'),
  ('st2', 'c1', 's7', '2025/2026', 't1', 30, 45, 75, 'A1', 'Excellent'),
  ('st2', 'c1', 's10', '2025/2026', 't1', 33, 46, 79, 'A1', 'Excellent'),
  
  ('st3', 'c1', 's1', '2025/2026', 't1', 25, 38, 63, 'C4', 'Credit'),
  ('st3', 'c1', 's2', '2025/2026', 't1', 29, 41, 70, 'B2', 'Very Good'),
  ('st3', 'c1', 's5', '2025/2026', 't1', 35, 48, 83, 'A1', 'Excellent'),
  ('st3', 'c1', 's7', '2025/2026', 't1', 28, 42, 70, 'B2', 'Very Good'),
  ('st3', 'c1', 's8', '2025/2026', 't1', 34, 50, 84, 'A1', 'Excellent'),
  ('st3', 'c1', 's10', '2025/2026', 't1', 30, 42, 72, 'B2', 'Very Good'),

  ('st7', 'c3', 's1', '2025/2026', 't1', 30, 45, 75, 'A1', 'Excellent'),
  ('st7', 'c3', 's2', '2025/2026', 't1', 33, 47, 80, 'A1', 'Excellent'),
  ('st7', 'c3', 's13', '2025/2026', 't1', 35, 49, 84, 'A1', 'Excellent'),
  ('st7', 'c3', 's14', '2025/2026', 't1', 31, 46, 77, 'A1', 'Excellent'),
  ('st7', 'c3', 's15', '2025/2026', 't1', 34, 48, 82, 'A1', 'Excellent'),
  ('st7', 'c3', 's16', '2025/2026', 't1', 32, 45, 77, 'A1', 'Excellent')
on conflict do nothing;
