-- Create gig_notifications table for email subscriptions
CREATE TABLE IF NOT EXISTS gig_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gig_notifications_email ON gig_notifications(email);
CREATE INDEX IF NOT EXISTS idx_gig_notifications_user_id ON gig_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_notifications_active ON gig_notifications(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE gig_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON gig_notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own notifications" ON gig_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own notifications" ON gig_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON gig_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_gig_notifications_updated_at
  BEFORE UPDATE ON gig_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
