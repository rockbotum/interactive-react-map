import { describe, expect, it } from "vitest";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  PAN_MIN_ZOOM,
  canPan,
  clampCenter,
  mapTranslateExtent,
  zoomToReach,
} from "./mapBounds";

describe("clampCenter", () => {
  it("фиксирует центр, когда весь мир помещается в экран", () => {
    expect(clampCenter([120, 40], 1)).toEqual([0, 0]);
    expect(clampCenter([-120, -40], 1)).toEqual([0, 0]);
  });

  it("не выходит за пределы сферы при приближении", () => {
    const [north] = clampCenter([0, 89], 4);
    const [south] = clampCenter([0, -89], 4);
    const [east] = clampCenter([179, 0], 4);
    const [west] = clampCenter([-179, 0], 4);

    expect(north).toBeLessThan(89);
    expect(south).toBeGreaterThan(-89);
    expect(east).toBeLessThan(179);
    expect(west).toBeGreaterThan(-179);
  });

  it("достигает любой точки при достаточном зуме", () => {
    const cases: Array<[[number, number], number]> = [
      [[-2.5, 53.5], 6],
      [[139.69, 35.68], 5],
      [[-149.9, 61.2], 8],
      [[-43.2, -22.9], 3],
    ];

    for (const [point, zoom] of cases) {
      const clamped = clampCenter(point, zoom);

      expect(Math.abs(clamped[0] - point[0])).toBeLessThan(0.01);
      expect(Math.abs(clamped[1] - point[1])).toBeLessThan(0.01);
    }
  });

  it("не выходит за размеры области просмотра", () => {
    const center = clampCenter([0, 85], 2);

    expect(Math.abs(center[0])).toBeLessThanOrEqual(180);
    expect(Math.abs(center[1])).toBeLessThanOrEqual(90);
  });
});

describe("zoomToReach", () => {
  it("находит зум, при котором точка встаёт в центр", () => {
    const points: Array<[[number, number], number]> = [
      [[-0.13, 51.5], 4.5],
      [[139.69, 35.68], 3.6],
      [[-43.2, -22.9], 2],
      [[18.42, -33.92], 2.5],
    ];

    for (const [point, expected] of points) {
      const zoom = zoomToReach(point);

      expect(zoom).toBeGreaterThanOrEqual(expected - 0.1);
      expect(clampCenter(point, zoom)[0]).toBeCloseTo(point[0], 1);
      expect(clampCenter(point, zoom)[1]).toBeCloseTo(point[1], 1);
    }
  });

  it("отдаёт максимальный зум для точки у края сферы", () => {
    // Фиджи лежит у линии перемены даты: в центр окна она не встанет
    // ни при каком зуме — но и не исчезнет из вида.
    const suva: [number, number] = [178.44, -18.14];

    expect(zoomToReach(suva, 8)).toBe(8);

    const visibleSpan = 360 / 8;
    const [center] = clampCenter(suva, 8);

    expect(Math.abs(suva[0] - center)).toBeLessThanOrEqual(visibleSpan / 2);
  });
});

describe("mapTranslateExtent", () => {
  it("задаёт пустой диапазон сдвига при зуме 1 — карта неподвижна", () => {
    const [[x0, y0], [x1, y1]] = mapTranslateExtent(1);

    // d3-zoom разрешает сдвиг в [x1 - ширина окна, x0]: при зуме 1 диапазон пуст.
    expect(x1 - MAP_WIDTH).toBeGreaterThan(x0);
    expect(y1 - MAP_HEIGHT).toBeGreaterThan(y0);
  });

  it("расширяется с ростом зума", () => {
    const [[x0]] = mapTranslateExtent(1);
    const [[x4]] = mapTranslateExtent(4);

    expect(Math.abs(x4)).toBeGreaterThan(Math.abs(x0));
  });
});

describe("canPan", () => {
  it("запрещает панорамирование на обзорном зуме", () => {
    expect(canPan(1)).toBe(false);
    expect(canPan(PAN_MIN_ZOOM)).toBe(true);
  });
});
