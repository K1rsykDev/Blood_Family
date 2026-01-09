-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('guest', 'member', 'admin');

-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  discord_id VARCHAR(32),
  avatar_url TEXT,
  role app_role DEFAULT 'guest',
  admin_code_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discord_id VARCHAR(32),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  status contract_status DEFAULT 'pending',
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE public.applications (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  static VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  playtime VARCHAR(255) NOT NULL,
  motive TEXT NOT NULL,
  discord_id VARCHAR(32),
  status application_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create news table
CREATE TABLE public.news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create giveaways table
CREATE TABLE public.giveaways (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  prize TEXT NOT NULL,
  image_url TEXT,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create site settings table
CREATE TABLE public.site_settings (
  id SERIAL PRIMARY KEY,
  background_url TEXT,
  snow_enabled BOOLEAN DEFAULT TRUE,
  garland_enabled BOOLEAN DEFAULT TRUE,
  primary_color VARCHAR(20) DEFAULT '#dc2626',
  admin_code VARCHAR(100) DEFAULT 'bloodfamily2024',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.site_settings (id) VALUES (1);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Create is_member_or_admin function
CREATE OR REPLACE FUNCTION public.is_member_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role IN ('member', 'admin')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Contracts policies
CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can insert contracts" ON public.contracts FOR INSERT WITH CHECK (public.is_member_or_admin(auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Admins can view all contracts" ON public.contracts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contracts" ON public.contracts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Applications policies (public for insert, admin for read/update)
CREATE POLICY "Anyone can insert application" ON public.applications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can view applications" ON public.applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- News policies
CREATE POLICY "Anyone can view news" ON public.news FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage news" ON public.news FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Giveaways policies
CREATE POLICY "Members can view giveaways" ON public.giveaways FOR SELECT USING (public.is_member_or_admin(auth.uid()));
CREATE POLICY "Admins can manage giveaways" ON public.giveaways FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Site settings policies
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();