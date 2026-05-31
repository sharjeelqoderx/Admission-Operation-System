import { useQuery } from "@tanstack/react-query"
import type { CountryOption } from "@/lib/data/locations"
import { LOCATIONS_QUERY_KEYS } from "@/lib/data/locations"

async function fetchCountriesClient(): Promise<CountryOption[]> {
    const res = await fetch("/api/locations/countries")
    const json = await res.json()
    if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to load countries")
    }
    return json.data as CountryOption[]
}

export function useCountries() {
    return useQuery({
        queryKey: LOCATIONS_QUERY_KEYS.countries,
        queryFn: fetchCountriesClient,
        staleTime: 1000 * 60 * 60 * 24 * 7,
        retry: 2,
    })
}
