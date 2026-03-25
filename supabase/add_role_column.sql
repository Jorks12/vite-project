-- ======================================================
-- Migration: Add 'role' column to 'users' table
-- Run this SQL in Supabase SQL Editor (Dashboard > SQL Editor)
-- ======================================================

-- 1. Add the role column with a default of 'student'
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

-- 2. Add a check constraint to ensure valid role values
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'mentor', 'student'));

-- 3. Update existing users' roles from their auth metadata (if set)
UPDATE public.users u
SET role = COALESCE(
  (SELECT raw_user_meta_data->>'role' FROM auth.users au WHERE au.id = u.id),
  'student'
)
WHERE u.role = 'student';

-- 4. (Optional) Update the trigger function to also set role on signup
-- If you already have a handle_new_user() trigger, update it:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, created_at, last_sign_in)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
