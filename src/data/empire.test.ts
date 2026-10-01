import { describe, expect, it } from "vitest";
import { countries } from "./countries";
import { locations } from "./cities";
import { EMPIRE_YEAR } from "./empire";
import { ALPHA3_TO_ISO_NUMERIC, alpha3ToNumeric } from "./isoNumeric";
import { EMPIRE_STATUS_LABELS } from "../types/geography";

const empireCountries = countries.filter((country) => country.empire);

describe("данные Британской империи", () => {
  it("указывает срез карты", () => {
    expect(EMPIRE_YEAR).toBe(1921);
  });

  it("содержит метрополию и владения на нескольких континентах", () => {
    const metropolis = empireCountries.filter(
      (country) => country.empire?.status === "metropolis",
    );

    expect(metropolis.map((country) => country.iso3)).toEqual(["GBR"]);
    expect(
      new Set(empireCountries.map((country) => country.continent)).size,
    ).toBeGreaterThanOrEqual(5);
  });

  it("не содержит повторяющихся идентификаторов стран", () => {
    const ids = countries.map((country) => country.id);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });

  it("не содержит повторяющихся идентификаторов локаций", () => {
    const ids = locations.map((location) => location.id);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });

  it("заполняет обязательные поля имперской карточки", () => {
    for (const country of empireCountries) {
      expect(country.empire?.historicalName.length ?? 0).toBeGreaterThan(0);
      expect(EMPIRE_STATUS_LABELS[country.empire!.status]).toBeTruthy();
      expect(country.tags).toContain("империя");
    }
  });

  it("сопоставляет каждое владение с геометрией карты", () => {
    const unmapped = empireCountries
      .map((country) => country.iso3)
      .filter((iso3) => !ALPHA3_TO_ISO_NUMERIC[iso3]);

    expect(unmapped).toEqual([]);
  });

  it("не использует одну геометрию для двух стран", () => {
    const numericIds = empireCountries.map((country) =>
      alpha3ToNumeric(country.iso3),
    );

    expect(new Set(numericIds).size).toBe(numericIds.length);
  });

  it("ссылается только на существующие страны", () => {
    const countryIds = new Set(countries.map((country) => country.id));
    const orphans = locations
      .map((location) => location.countryId)
      .filter((countryId) => !countryIds.has(countryId));

    expect([...new Set(orphans)]).toEqual([]);
  });

  it("имеет локации хотя бы в половине владений", () => {
    const withLocations = empireCountries.filter((country) =>
      locations.some((location) => location.countryId === country.id),
    );

    expect(withLocations.length).toBeGreaterThanOrEqual(
      empireCountries.length / 2,
    );
  });

  it("покрывает ключевые владения всех регионов империи", () => {
    const expected = [
      "GBR",
      "CAN",
      "AUS",
      "NZL",
      "IND",
      "EGY",
      "ZAF",
      "NGA",
      "SDN",
      "SSD",
      "GHA",
      "SLE",
      "GMB",
      "KEN",
      "UGA",
      "TZA",
      "ZWE",
      "ZMB",
      "MWI",
      "NAM",
      "LSO",
      "BWA",
      "SWZ",
      "ERI",
      "SOM",
      "TGO",
      "BGD",
      "PAK",
      "MMR",
      "LKA",
      "MYS",
      "QAT",
      "KWT",
      "ARE",
      "YEM",
      "IRQ",
      "PSE",
      "JOR",
      "CYP",
      "IRL",
      "SLB",
      "FJI",
      "PNG",
      "FLK",
      "JAM",
      "BHS",
      "TTO",
      "BLZ",
      "GUY",
    ];

    const actual = empireCountries.map((country) => country.iso3);

    expect(new Set(expected).size).toBe(expected.length);
    expect(expected.filter((iso3) => !actual.includes(iso3))).toEqual([]);
  });
});
