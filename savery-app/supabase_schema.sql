-- Savery Core Database Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. user_profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
    full_name text,
    monthly_income numeric DEFAULT 0,
    persona text,
    onboarding_complete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. user_commitments
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_commitments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    label text NOT NULL,
    amount numeric NOT NULL,
    category text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. transactions
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    amount numeric NOT NULL,
    merchant text NOT NULL,
    category text NOT NULL,
    sub_category text,
    date timestamp with time zone NOT NULL,
    source text NOT NULL, -- e.g., 'bank', 'upi', 'cash', 'card', 'demo'
    is_cash boolean DEFAULT false,
    notes text,
    bucket text, -- 'fixed', 'essential', 'discretionary'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own commitments" ON public.user_commitments;
DROP POLICY IF EXISTS "Users can insert own commitments" ON public.user_commitments;
DROP POLICY IF EXISTS "Users can update own commitments" ON public.user_commitments;
DROP POLICY IF EXISTS "Users can delete own commitments" ON public.user_commitments;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for user_commitments
CREATE POLICY "Users can view own commitments" 
ON public.user_commitments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments" 
ON public.user_commitments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments" 
ON public.user_commitments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commitments" 
ON public.user_commitments FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);

