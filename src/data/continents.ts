import type { Continent, ContinentId } from "../types/geography";

export const continents: Continent[] = [
  { id: "africa", name: "Африка", nameEn: "Africa" },
  { id: "antarctica", name: "Антарктида", nameEn: "Antarctica" },
  { id: "asia", name: "Азия", nameEn: "Asia" },
  { id: "europe", name: "Европа", nameEn: "Europe" },
  { id: "north-america", name: "Северная Америка", nameEn: "North America" },
  { id: "south-america", name: "Южная Америка", nameEn: "South America" },
  { id: "oceania", name: "Океания", nameEn: "Oceania" },
];

const continentIds = new Set<ContinentId>(continents.map((item) => item.id));

export function isContinentId(value: string): value is ContinentId {
  return continentIds.has(value as ContinentId);
}