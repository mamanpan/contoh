
-- 1) Restrict "viewable by all" policies to authenticated only
DROP POLICY IF EXISTS "Banners viewable by all" ON public.banners;
CREATE POLICY "Banners viewable by authenticated" ON public.banners
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Branding viewable by all" ON public.branding;
CREATE POLICY "Branding viewable by authenticated" ON public.branding
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Comments viewable by all" ON public.comments;
CREATE POLICY "Comments viewable by authenticated" ON public.comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Follows viewable by all" ON public.follows;
CREATE POLICY "Follows viewable by authenticated" ON public.follows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Products viewable by all" ON public.products;
CREATE POLICY "Products viewable by authenticated" ON public.products
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Stats viewable by all" ON public.site_stats;
CREATE POLICY "Stats viewable by authenticated" ON public.site_stats
  FOR SELECT TO authenticated USING (true);

-- Revoke anon SELECT since no anon policies remain
REVOKE SELECT ON public.banners, public.branding, public.comments,
  public.follows, public.products, public.site_stats FROM anon;

-- 2) Move phone into a private table (owner + admin only)
CREATE TABLE IF NOT EXISTS public.profile_private (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own phone" ON public.profile_private
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can insert own phone" ON public.profile_private
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update own phone" ON public.profile_private
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all phones" ON public.profile_private
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profile_private_updated_at
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migrate existing phone values
INSERT INTO public.profile_private (user_id, phone)
SELECT id, phone FROM public.profiles WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Drop phone column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
