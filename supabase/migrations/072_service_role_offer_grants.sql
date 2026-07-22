-- Ensure server-side offer signing can update offer rows via service_role.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letter TO service_role;
