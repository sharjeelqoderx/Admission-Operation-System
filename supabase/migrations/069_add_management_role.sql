-- Add MANAGEMENT role enum value.
-- Must be committed before MANAGEMENT can be referenced in functions/policies.

ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'MANAGEMENT';
