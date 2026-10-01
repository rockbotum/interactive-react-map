import { describe, expect, it } from "vitest";
import { countries } from "../../data/countries";
import { locations } from "../../data/cities";
import { continents } from "../../data/continents";
import { ALPHA3_TO_ISO_NUMERIC, alpha3ToNumeric } from "../../data/isoNumeric";
import { emptyFilters, filterCountries } from "./countryFilters";

describe("filterCountries", () => {
  function search(query: string) {
    return filterCountries(countries, locations, { ...emptyFilters, query });
  }

  it("возвращает все страны для пустого запроса", () => {
    expect(search("   ")).toHaveLength(countries.length);
  });

  it("ищет по русскому названию без учёта регистра", () => {
    const result = search("РОССИЯ");

    expect(result).toHaveLength(1);
    expect(result[0]?.iso3).toBe("RUS");
  });

  it("ищет по английскому названию", () => {
    expect(search("france").map((item) => item.iso3)).toContain("FRA");
  });

  it("ищет по столице", () => {
    const result = search("москва");

    expect(result.map((item) => item.iso3)).toEqual(["RUS"]);
  });

  it("ищет по названию города", () => {
    expect(search("токио").map((item) => item.iso3)).toEqual(["JPN"]);
  });

  it("ищет по названию континента и находит все страны этого континента", () => {
    const result = search("азия");
    const asianCountries = countries.filter((country) => country.continent === "asia");

    expect(asianCountries.length).toBeGreaterThan(0);

    for (const country of asianCountries) {
      expect(result.map((item) => item.iso3)).toContain(country.iso3);
    }
  });

  it("ищет по тегу", () => {
    expect(search("пустыня").length).toBeGreaterThan(0);
  });

  it("возвращает пустой массив, если ничего не найдено", () => {
    expect(search("несуществующая страна")).toEqual([]);
  });

  it("не изменяет исходный массив стран", () => {
    const before = countries.length;
    filterCountries(countries, locations, { ...emptyFilters, query: "франция" });

    expect(countries).toHaveLength(before);
  });

  it("фильтрует по континенту", () => {
    const result = filterCountries(countries, locations, {
      ...emptyFilters,
      continent: "south-america",
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((country) => country.continent === "south-america")).toBe(true);
  });

  it("фильтрует по наличию столицы", () => {
    const result = filterCountries(countries, locations, {
      ...emptyFilters,
      withCapitalOnly: true,
    });

    expect(result.every((country) => Boolean(country.capital))).toBe(true);
  });

  it("фильтрует по наличию описания", () => {
    const result = filterCountries(countries, locations, {
      ...emptyFilters,
      withDescriptionOnly: true,
    });

    expect(result.every((country) => Boolean(country.description))).toBe(true);
  });

  it("фильтрует по типу объекта", () => {
    const result = filterCountries(countries, locations, {
      ...emptyFilters,
      locationType: "mountain",
    });

    expect(result.map((country) => country.iso3).sort()).toEqual(["NZL", "ZAF"]);
  });

  it("комбинирует поиск и фильтр континента", () => {
    const result = filterCountries(countries, locations, {
      ...emptyFilters,
      continent: "africa",
      query: "алжир",
    });

    expect(result.map((country) => country.iso3)).toEqual(["DZA"]);
  });
});

describe("данные стран", () => {
  it("содержит не менее 10 стран", () => {
    expect(countries.length).toBeGreaterThanOrEqual(10);
  });

  it("не содержит стран без описания в статическом наборе", () => {
    const missing = countries.filter((country) => !country.description);

    expect(missing).toEqual([]);
  });

  it("использует уникальные идентификаторы", () => {
    const ids = new Set(countries.map((country) => country.id));

    expect(ids.size).toBe(countries.length);
  });

  it("ссылается только на существующие континенты", () => {
    const known = new Set(continents.map((continent) => continent.id));
    const unknown = countries.filter((country) => !known.has(country.continent));

    expect(unknown).toEqual([]);
  });

  it("содержит столицу у каждой страны статического набора", () => {
    const missing = countries.filter((country) => !country.capital);

    expect(missing).toEqual([]);
  });
});

describe("локации", () => {
  it("ссылаются на существующие страны", () => {
    const ids = new Set(countries.map((country) => country.id));
    const orphans = locations.filter((location) => !ids.has(location.countryId));

    expect(orphans).toEqual([]);
  });

  it("имеют координаты в допустимых пределах", () => {
    const invalid = locations.filter(
      (location) =>
        location.coordinates.latitude < -90 ||
        location.coordinates.latitude > 90 ||
        location.coordinates.longitude < -180 ||
        location.coordinates.longitude > 180,
    );

    expect(invalid).toEqual([]);
  });
});

describe("сопоставление идентификаторов геометрии", () => {
  it("содержит alpha-3 для России и Франции", () => {
    expect(alpha3ToNumeric("RUS")).toBe("643");
    expect(alpha3ToNumeric("FRA")).toBe("250");
  });

  it("не содержит идентификаторов короче трёх символов", () => {
    const invalid = Object.entries(ALPHA3_TO_ISO_NUMERIC).filter(([, numeric]) => typeof numeric !== "string" || numeric.length !== 3);

    expect(invalid).toEqual([]);
  });

  it("возвращает undefined для неизвестного кода", () => {
    expect(alpha3ToNumeric("XXX")).toBeUndefined();
  });
});