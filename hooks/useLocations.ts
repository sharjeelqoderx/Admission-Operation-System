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

async function fetchStatesClient(country: string): Promise<string[]> {
    const params = new URLSearchParams({ country })
    const res = await fetch(`/api/locations/states?${params.toString()}`)
    const json = await res.json()
    if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to load states")
    }
    return json.data as string[]
}

async function fetchCitiesClient(country: string, state: string): Promise<string[]> {
    const params = new URLSearchParams({ country, state })
    const res = await fetch(`/api/locations/cities?${params.toString()}`)
    const json = await res.json()
    if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to load cities")
    }
    return json.data as string[]
}

export function useCountries() {
    return useQuery({
        queryKey: LOCATIONS_QUERY_KEYS.countries,
        queryFn: fetchCountriesClient,
        staleTime: 1000 * 60 * 60 * 24 * 7,
        retry: 2,
    })
}

export function useStates(country: string) {
    return useQuery({
        queryKey: LOCATIONS_QUERY_KEYS.states(country),
        queryFn: () => fetchStatesClient(country),
        enabled: Boolean(country.trim()),
        staleTime: 1000 * 60 * 60 * 24,
        retry: 2,
    })
}

export function useCities(country: string, state: string) {
    return useQuery({
        queryKey: LOCATIONS_QUERY_KEYS.cities(country, state),
        queryFn: () => fetchCitiesClient(country, state),
        enabled: Boolean(country.trim() && state.trim()),
        staleTime: 1000 * 60 * 60 * 24,
        retry: 2,
    })
}
