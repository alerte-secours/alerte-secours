-- Safe email existence-check used by the app's "is this email already registered?"
-- flow, replacing the public_anon select on email.email (which let any
-- authenticated user enumerate every email in the base). The function returns a
-- single boolean and its result type exposes NO email column, so it cannot be
-- used to enumerate addresses.
CREATE OR REPLACE VIEW "public"."view_email_registered_result" AS
  SELECT false AS registered WHERE false;

CREATE OR REPLACE FUNCTION public.lookup_email_registered(check_email text)
 RETURNS SETOF "public"."view_email_registered_result"
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM "email"
    WHERE "email"."email" = check_email AND "email"."verified"
  ) AS registered
$function$;
