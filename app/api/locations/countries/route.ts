import { fetchCountries } from "@/lib/data/locations"
import { ok } from "@/lib/api"

export async function GET() {
    const countries = await fetchCountries()
    return ok(countries)
}
