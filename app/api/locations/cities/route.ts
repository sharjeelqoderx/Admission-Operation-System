import { fetchCities } from "@/lib/data/locations"
import { err, ok } from "@/lib/api"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get("country")?.trim()
    const state = searchParams.get("state")?.trim()

    if (!country) {
        return err("country is required", 400)
    }

    if (!state) {
        return err("state is required", 400)
    }

    const cities = await fetchCities(country, state)
    return ok(cities)
}
