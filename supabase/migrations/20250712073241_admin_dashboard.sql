-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL CHECK (type IN ('add', 'update', 'damage', 'sale')),
    message text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read activities"
ON public.activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to read system alerts"
ON public.system_alerts FOR SELECT
TO authenticated
USING (true);

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
    activity_type text,
    activity_message text,
    activity_user_id uuid
) RETURNS uuid AS $$
DECLARE
    activity_id uuid;
BEGIN
    INSERT INTO public.activities (type, message, user_id)
    VALUES (activity_type, activity_message, activity_user_id)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 