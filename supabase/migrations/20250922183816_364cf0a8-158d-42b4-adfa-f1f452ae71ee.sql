-- Create helper function for setting session configuration
CREATE OR REPLACE FUNCTION public.set_config(setting_name TEXT, setting_value TEXT) 
RETURNS VOID AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;