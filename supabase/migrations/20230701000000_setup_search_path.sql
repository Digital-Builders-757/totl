-- Set the search_path for all functions and views
ALTER DATABASE postgres SET search_path TO public, auth;

-- Create a helper function to get the current user ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid();
$$;

-- Create a secure view for user profiles
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.id,
  p.role,
  p.email,
  p.display_name,
  p.created_at,
  p.updated_at
FROM 
  public.profiles p
WHERE 
  p.id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;

-- Create a secure function to get talent applications
CREATE OR REPLACE FUNCTION public.get_talent_applications(user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  status text,
  created_at timestamptz,
  gig_id uuid,
  gig_title text,
  company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the user is requesting their own data or is an admin
  IF user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT 
      a.id,
      a.status,
      a.created_at,
      g.id as gig_id,
      g.title as gig_title,
      g.company_name
    FROM 
      public.applications a
    JOIN 
      public.gigs g ON a.gig_id = g.id
    WHERE 
      a.talent_id = user_id
    ORDER BY 
      a.created_at DESC;
  ELSE
    -- Return empty result if not authorized
    RETURN;
  END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_talent_applications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_talent_applications TO service_role;
