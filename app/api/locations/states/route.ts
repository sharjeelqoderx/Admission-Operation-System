import { fetchStates } from "@/lib/data/locations"
import { err, ok } from "@/lib/api"

export async function GET(req: Request) {
    const country = new URL(req.url).searchParams.get("country")?.trim()

    if (!country) {
        return err("country is required", 400)
    }

    const states = await fetchStates(country)
    return ok(states)
}
