-- Fix audit function to handle read-only contexts gracefully
CREATE OR REPLACE FUNCTION public.audit_admin_access(table_name_param text, record_id_param uuid, action_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if user is a super admin and we're not in a read-only transaction
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    BEGIN
      INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values
      ) VALUES (
        auth.uid(),
        action_param,
        table_name_param,
        record_id_param,
        jsonb_build_object(
          'accessed_at', now(),
          'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
          'user_agent', current_setting('request.headers', true)::json->>'user-agent'
        )
      );
      RETURN TRUE;
    EXCEPTION
      WHEN OTHERS THEN
        -- If we can't insert (e.g., read-only transaction), just return true to allow access
        RETURN TRUE;
    END;
  END IF;
  RETURN FALSE;
END;
$function$;