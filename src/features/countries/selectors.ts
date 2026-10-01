import { countries } from "../../data/countries";
import { locations } from "../../data/cities";
import { continents } from "../../data/continents";
import { clampCenter } from "../map/mapBounds";
import type { ContinentId, Country, Location } from "../../types/geography";
import type { CountryFilters } from "./countryFilters";
import { filterCountries, hasActiveFilters as filtersActive } from "./countryFilters";

export interface MapState {
  selectedCountryId: string | null;
  selectedLocationId: string | null;
  zoom: number;
  center: [number, number];
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;

/**
 * Стартовый зум: при меньшем значении Британские острова нельзя поставить
 * в центр — проекция не даёт увести карту так далеко на север.
 */
export const DEFAULT_ZOOM = 4.5;

/** Центр карты — Британские острова, метрополия империи. */
export const DEFAULT_CENTER: [number, number] = clampCenter([-2.5, 53.5], DEFAULT_ZOOM);

export const DEFAULT_MAP_STATE: MapState = {
  selectedCountryId: null,
  selectedLocationId: null,
  zoom: DEFAULT_ZOOM,
  center: DEFAULT_CENTER,
};

export interface AppState extends MapState {
  searchQuery: string;
  selectedContinent: ContinentId | null;
  withCapitalOnly: boolean;
  withDescriptionOnly: boolean;
  selectedLocationType: Location["type"] | null;
}

export const DEFAULT_APP_STATE: AppState = {
  ...DEFAULT_MAP_STATE,
  searchQuery: "",
  selectedContinent: null,
  withCapitalOnly: false,
  withDescriptionOnly: false,
  selectedLocationType: null,
};

const countriesById = new Map(countries.map((country) => [country.id, country]));

export function countryById(id: string): Country | undefined {
  return countriesById.get(id);
}

export function toCountryFilters(state: AppState): CountryFilters {
  return {
    continent: state.selectedContinent,
    query: state.searchQuery,
    withCapitalOnly: state.withCapitalOnly,
    withDescriptionOnly: state.withDescriptionOnly,
    locationType: state.selectedLocationType,
  };
}

export function selectVisibleCountries(state: AppState): Country[] {
  return filterCountries(countries, locations, toCountryFilters(state));
}

export function selectVisibleCountryIds(state: AppState): Set<string> {
  const filters = toCountryFilters(state);

  if (!filtersActive(filters)) {
    return new Set(countries.map((country) => country.id));
  }

  return new Set(selectVisibleCountries(state).map((country) => country.id));
}

export function selectVisibleLocations(state: AppState): Location[] {
  const visibleIds = selectVisibleCountryIds(state);
  const types = state.selectedLocationType ? new Set([state.selectedLocationType]) : null;

  return locations.filter((location) => {
    if (!visibleIds.has(location.countryId)) {
      return false;
    }
    if (types && !types.has(location.type)) {
      return false;
    }
    return true;
  });
}

export { continents, countries, locations };

/** Страна, к которой относится маркер. */
export function locationCountry(location: Location): Country | undefined {
  return countryById(location.countryId);
}