-- Ensure server-side provisioning can manage profile/student rows via service_role.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_files TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_review TO service_role;
