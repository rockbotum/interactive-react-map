import { describe, expect, it } from "vitest";
import type { Topology } from "topojson-specification";

import { countryFeatures } from "./useWorldMapData";

const topology = {
  type: "Topology",
  arcs: [],
  objects: {
    countries: {
      type: "GeometryCollection",
      geometries: [
        { type: "Polygon", id: "643", arcs: [], properties: { name: "Russia" } },
        { type: "Polygon", id: "250", arcs: [], properties: { name: "France" } },
        { type: "Polygon", id: "643", arcs: [], properties: { name: "Russia" } },
        { type: "Polygon", arcs: [], properties: { name: "N. Cyprus" } },
      ],
    },
  },
} as unknown as Topology;

describe("countryFeatures", () => {
  it("возвращает фичи с идентификатором", () => {
    const result = countryFeatures(topology);

    expect(result.map((item) => item.id)).toEqual(["643", "250"]);
  });

  it("отбрасывает фичи без идентификатора", () => {
    const result = countryFeatures(topology);

    expect(result.every((item) => item.id.length === 3)).toBe(true);
  });

  it("сохраняет название из свойств", () => {
    const result = countryFeatures(topology);

    expect(result[0]?.properties.name).toBe("Russia");
  });

  it("подставляет идентификатор вместо отсутствующего названия", () => {
    const noName = {
      type: "Topology",
      arcs: [],
      objects: {
        countries: {
          type: "GeometryCollection",
          geometries: [{ type: "Polygon", id: "276", arcs: [], properties: {} }],
        },
      },
    } as unknown as Topology;

    const noNameRes = countryFeatures(noName);
    expect(noNameRes[0]?.properties.name).toBe("276");
  });

  it("возвращает пустой массив для пустой топологии", () => {
    const empty = { type: "Topology", arcs: [], objects: {} } as unknown as Topology;

    expect(countryFeatures(empty)).toEqual([]);
  });


});