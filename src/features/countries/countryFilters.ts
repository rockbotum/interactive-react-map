import type { ContinentId, Country, Location } from "../../types/geography";
import { continentName } from "../../utils/countryLookup";

export interface CountryFilters {
  continent: ContinentId | null;
  query: string;
  withCapitalOnly: boolean;
  withDescriptionOnly: boolean;
  locationType: Location["type"] | null;
}

export const emptyFilters: CountryFilters = {
  continent: null,
  query: "",
  withCapitalOnly: false,
  withDescriptionOnly: false,
  locationType: null,
};

export function hasActiveFilters(filters: CountryFilters): boolean {
  return (
    filters.continent !== null ||
    filters.query.trim().length > 0 ||
    filters.withCapitalOnly ||
    filters.withDescriptionOnly ||
    filters.locationType !== null
  );
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function searchableText(country: Country, locations: Location[]): string {
  return [
    country.name,
    country.nameEn,
    country.capital,
    country.iso2,
    country.iso3,
    continentName(country.continent),
    country.tags.join(" "),
    ...locations.map((location) => `${location.name} ${location.tags.join(" ")}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

/**
 * Регистронезависимый поиск и фильтрация.
 * Исходные массивы не изменяются — возвращаются новые.
 */
export function filterCountries(
  allCountries: Country[],
  locations: Location[],
  filters: CountryFilters,
): Country[] {
  const query = normalize(filters.query);

  return allCountries.filter((country) => {
    if (filters.continent !== null && country.continent !== filters.continent) {
      return false;
    }

    if (filters.withCapitalOnly && !country.capital) {
      return false;
    }

    if (filters.withDescriptionOnly && !country.description) {
      return false;
    }

    const countryLocations = locations.filter(
      (location) => location.countryId === country.id,
    );

    if (
      filters.locationType !== null &&
      !countryLocations.some((location) => location.type === filters.locationType)
    ) {
      return false;
    }

    if (query.length > 0) {
      const haystack = searchableText(country, countryLocations);
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}