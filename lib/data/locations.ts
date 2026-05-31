/** Country list (CountriesNow API + static fallback). Used by `/api/locations/countries`. */

export type CountryOption = {
    name: string
    iso2: string
}

const COUNTRIES_API = "https://countriesnow.space/api/v0.1/countries"

type CountriesNowCountry = {
    country: string
    iso2: string
}

export const LOCATIONS_QUERY_KEYS = {
    countries: ["locations", "countries"] as const,
}

/** Fallback when external API is unavailable */
export const FALLBACK_COUNTRIES: CountryOption[] = [
    { name: "Afghanistan", iso2: "AF" },
    { name: "Australia", iso2: "AU" },
    { name: "Bangladesh", iso2: "BD" },
    { name: "Canada", iso2: "CA" },
    { name: "China", iso2: "CN" },
    { name: "France", iso2: "FR" },
    { name: "Germany", iso2: "DE" },
    { name: "India", iso2: "IN" },
    { name: "Indonesia", iso2: "ID" },
    { name: "Italy", iso2: "IT" },
    { name: "Japan", iso2: "JP" },
    { name: "Malaysia", iso2: "MY" },
    { name: "Nepal", iso2: "NP" },
    { name: "Netherlands", iso2: "NL" },
    { name: "Nigeria", iso2: "NG" },
    { name: "Pakistan", iso2: "PK" },
    { name: "Saudi Arabia", iso2: "SA" },
    { name: "South Africa", iso2: "ZA" },
    { name: "Spain", iso2: "ES" },
    { name: "Sri Lanka", iso2: "LK" },
    { name: "Turkey", iso2: "TR" },
    { name: "United Arab Emirates", iso2: "AE" },
    { name: "United Kingdom", iso2: "GB" },
    { name: "United States", iso2: "US" },
].sort((a, b) => a.name.localeCompare(b.name))

export async function fetchCountries(): Promise<CountryOption[]> {
    try {
        const res = await fetch(COUNTRIES_API, {
            next: { revalidate: 60 * 60 * 24 * 7 },
        })

        if (!res.ok) {
            return FALLBACK_COUNTRIES
        }

        const json = (await res.json()) as {
            data?: CountriesNowCountry[]
            error?: boolean
            msg?: string
        }

        if (json.error || !Array.isArray(json.data) || json.data.length === 0) {
            return FALLBACK_COUNTRIES
        }

        return json.data
            .map((c) => ({ name: c.country, iso2: c.iso2 }))
            .sort((a, b) => a.name.localeCompare(b.name))
    } catch {
        return FALLBACK_COUNTRIES
    }
}
