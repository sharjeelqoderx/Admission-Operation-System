-- Soft-delete support for degree_requirement (no hard deletes from app).

ALTER TABLE public.degree_requirement
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.degree_requirement.is_deleted IS
    'Soft-delete flag. Active document requirements must have is_deleted = false.';

-- Replace hard unique with active-only unique so soft-deleted rows can be restored/recreated.
ALTER TABLE public.degree_requirement
    DROP CONSTRAINT IF EXISTS uq_degree_document_type;

CREATE UNIQUE INDEX IF NOT EXISTS degree_requirement_active_unique_idx
    ON public.degree_requirement (degree_id, document_type_id)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS degree_requirement_is_deleted_idx
    ON public.degree_requirement (is_deleted);

-- Staff write policies (ADMIN / MANAGEMENT / SUPER_ADMIN / AGENT for consistency with staff tables)
DROP POLICY IF EXISTS "degree_requirement_insert_staff" ON public.degree_requirement;
CREATE POLICY "degree_requirement_insert_staff"
    ON public.degree_requirement
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_profile_role() IN (
            'SUPER_ADMIN'::public.role_enum,
            'ADMIN'::public.role_enum,
            'MANAGEMENT'::public.role_enum
        )
    );

DROP POLICY IF EXISTS "degree_requirement_update_staff" ON public.degree_requirement;
CREATE POLICY "degree_requirement_update_staff"
    ON public.degree_requirement
    FOR UPDATE
    TO authenticated
    USING (
        public.current_profile_role() IN (
            'SUPER_ADMIN'::public.role_enum,
            'ADMIN'::public.role_enum,
            'MANAGEMENT'::public.role_enum
        )
    )
    WITH CHECK (
        public.current_profile_role() IN (
            'SUPER_ADMIN'::public.role_enum,
            'ADMIN'::public.role_enum,
            'MANAGEMENT'::public.role_enum
        )
    );
