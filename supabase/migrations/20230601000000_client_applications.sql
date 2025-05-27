-- Create client applications table
CREATE TABLE client_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  business_description TEXT NOT NULL,
  needs_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE client_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert applications
CREATE POLICY "Allow anonymous users to insert applications" 
ON client_applications FOR INSERT 
TO anon
WITH CHECK (true);

-- Only allow admins to view and update applications
CREATE POLICY "Allow admins to view applications" 
ON client_applications FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Allow admins to update applications" 
ON client_applications FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_client_applications_updated_at
BEFORE UPDATE ON client_applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
