import { vi } from "vitest";
import type { Topology } from "topojson-specification";

/**
 * Тестовая топология с настоящими дугами, чтобы d3-geo мог построить путь SVG.
 * Дуги описаны в координатах долгота/широта (градусы).
 */
const ARC_RUS: [number, number][] = [
  [30, 60],
  [100, 60],
  [100, 70],
  [30, 70],
  [30, 60],
];

const ARC_FRA: [number, number][] = [
  [-5, 45],
  [5, 45],
  [5, 50],
  [-5, 50],
  [-5, 45],
];

const ARC_TESTLAND: [number, number][] = [
  [100, 10],
  [110, 10],
  [110, 20],
  [100, 20],
  [100, 10],
];

/** Минимальный TopoJSON: Россия (643), Франция (250), Testland (999) и дубликат/без id. */
export function createTestTopology(): Topology {
  return {
    type: "Topology",
    arcs: [
      ARC_RUS.map((point) => point),
      ARC_FRA.map((point) => point),
      ARC_TESTLAND.map((point) => point),
    ],
    transform: null,
    objects: {
      countries: {
        type: "GeometryCollection",
        geometries: [
          {
            type: "Polygon",
            id: "643",
            arcs: [[0]],
            properties: { name: "Russia" },
          },
          {
            type: "Polygon",
            id: "250",
            arcs: [[1]],
            properties: { name: "France" },
          },
          {
            type: "Polygon",
            id: "999",
            arcs: [[2]],
            properties: { name: "Testland" },
          },
        ],
      },
    },
  } as unknown as Topology;
}

export function installFetchMock(body: unknown = createTestTopology()): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
    })),
  );
}

export function installFailingFetchMock(status = 404): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      status,
      json: async () => ({}),
    })),
  );
}