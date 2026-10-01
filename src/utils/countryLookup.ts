import { countries } from "../data/countries";
import { locations } from "../data/cities";
import { continents } from "../data/continents";
import { ALPHA3_TO_ISO_NUMERIC } from "../data/isoNumeric";
import type { ContinentId, Country } from "../types/geography";

const countryById = new Map(countries.map((country) => [country.id, country]));
const countryByIso3 = new Map(countries.map((country) => [country.iso3, country]));
const countryByNumeric = new Map<string, Country>();

for (const [iso3, numeric] of Object.entries(ALPHA3_TO_ISO_NUMERIC)) {
  const country = countryByIso3.get(iso3);
  if (country) {
    countryByNumeric.set(numeric, country);
  }
}

export function findCountryById(id: string): Country | undefined {
  return countryById.get(id);
}

export function findCountryByIso3(iso3: string): Country | undefined {
  return countryByIso3.get(iso3);
}

/** Страна приложения по идентификатору геометрии TopoJSON (ISO 3166-1 numeric-3). */
export function findCountryByGeometryId(geometryId: string): Country | undefined {
  return countryByNumeric.get(geometryId);
}

export function continentName(continent: ContinentId): string {
  return continents.find((item) => item.id === continent)?.name ?? continent;
}

export { locations };

/**
 * Континенты, представленные в статических данных.
 * Геометрии без карточки страны не относятся ни к одному континенту
 * и не участвуют в фильтрации.
 */
export function continentsWithCountries(): ContinentId[] {
  const present = new Set(countries.map((country) => country.continent));
  return continents.filter((item) => present.has(item.id)).map((item) => item.id);
}