export type CountryId = string;

export type LocationId = string;

export type ContinentId =
  | "africa"
  | "antarctica"
  | "asia"
  | "europe"
  | "north-america"
  | "south-america"
  | "oceania";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Continent {
  id: ContinentId;
  name: string;
  nameEn: string;
}

export interface Country {
  id: CountryId;
  iso2: string;
  iso3: string;
  name: string;
  nameEn: string;
  continent: ContinentId;
  capital?: string;
  population?: number;
  areaKm2?: number;
  flagEmoji?: string;
  description?: string;
  tags: string[];
  /** Принадлежность к Британской империи на срез EMPIRE_YEAR. */
  empire?: EmpireMembership;
}

/**
 * Статус владения в составе Британской империи.
 * Значения соответствуют административно-правовым формам управления,
 * которые использовались в разные годы — единовременного статуса у всех
 * владений не существовало.
 */
export type EmpireStatus =
  | "metropolis"
  | "state"
  | "dominion"
  | "colony"
  | "protectorate"
  | "mandate"
  | "dependency"
  | "condominium";

export const EMPIRE_STATUS_LABELS: Readonly<Record<EmpireStatus, string>> = {
  metropolis: "Метрополия",
  state: "Часть Соединённого королевства",
  dominion: "Доминион",
  colony: "Колония",
  protectorate: "Протекторат",
  mandate: "Мандат Лиги Наций",
  dependency: "Зависимая территория",
  condominium: "Кондоминиум",
};

export interface EmpireMembership {
  /** Название владения на имперской карте. */
  historicalName: string;
  /** Современное название — по нему территория находится поиском. */
  modernName?: string;
  status: EmpireStatus;
  /** Уточнение прохождения границ или смены статуса. */
  note?: string;
}

export type LocationType =
  | "capital"
  | "city"
  | "landmark"
  | "mountain"
  | "lake"
  | "river"
  | "museum"
  | "natural-object";

export interface Location {
  id: LocationId;
  countryId: CountryId;
  name: string;
  description?: string;
  type: LocationType;
  coordinates: Coordinates;
  tags: string[];
}

export const LOCATION_TYPE_LABELS: Readonly<Record<LocationType, string>> = {
  capital: "Столица",
  city: "Город",
  landmark: "Достопримечательность",
  mountain: "Гора",
  lake: "Озеро",
  river: "Река",
  museum: "Музей",
  "natural-object": "Природный объект",
};
