import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_STATE,
  selectVisibleCountries,
  selectVisibleCountryIds,
  selectVisibleLocations,
} from "./selectors";
import type { AppState } from "./selectors";

function stateWith(patch: Partial<AppState>): AppState {
  return { ...DEFAULT_APP_STATE, ...patch };
}

describe("состояние по умолчанию", () => {
  it("показывает все страны статического набора", () => {
    expect(selectVisibleCountries(DEFAULT_APP_STATE).length).toBe(
      selectVisibleCountryIds(DEFAULT_APP_STATE).size,
    );
  });

  it("показывает маркеры всех локаций", () => {
    expect(selectVisibleLocations(DEFAULT_APP_STATE).length).toBeGreaterThan(0);
  });

  it("не ограничивает маркеры одним типом", () => {
    const types = new Set(selectVisibleLocations(DEFAULT_APP_STATE).map((item) => item.type));

    expect(types.size).toBeGreaterThan(1);
  });
});

describe("selectVisibleLocations", () => {
  it("оставляет только локации стран, прошедших фильтр", () => {
    const result = selectVisibleLocations(stateWith({ selectedContinent: "europe" }));
    const visibleCountryIds = new Set(
      selectVisibleCountries(stateWith({ selectedContinent: "europe" })).map((c) => c.id),
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => visibleCountryIds.has(item.countryId))).toBe(true);
  });

  it("фильтрует маркеры по типу локации", () => {
    const result = selectVisibleLocations(stateWith({ selectedLocationType: "capital" }));

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.type === "capital")).toBe(true);
  });

  it("возвращает пустой список, если ни одна страна не подходит", () => {
    expect(selectVisibleLocations(stateWith({ searchQuery: "zzz-not-a-country" }))).toEqual([]);
  });
});