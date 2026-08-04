import { z } from "zod"

/** Accepts any Postgres uuid string, including non-RFC variants stored in Supabase. */
export const PostgresUuidSchema = z
    .string()
    .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        "Invalid id"
    )
