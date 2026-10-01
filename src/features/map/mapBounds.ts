import { geoEqualEarth, geoPath } from "d3-geo";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 560;

/**
 * Порог зума, ниже которого перетаскивание карты отключено:
 * весь мир помещается в область просмотра, двигать его некуда.
 */
export const PAN_MIN_ZOOM = 1.2;

/**
 * Та же проекция, что и у ComposableMap (geoEqualEarth с настройками
 * по умолчанию), — нужна, чтобы считать те же координаты пикселей,
 * которыми оперирует d3-zoom внутри ZoomableGroup.
 */
const projection = geoEqualEarth().translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

/** Границы сферы в пикселях SVG: [xMin, yMin], [xMax, yMax]. */
const [
  [sphereXMin, sphereYMin],
  [sphereXMax, sphereYMax],
] = geoPath(projection).bounds({ type: "Sphere" });

/**
 * Смещение центра вдоль оси, удерживающее карту в области просмотра.
 *
 * Если сфера помещается целиком, центр фиксируется на её середине;
 * иначе он ограничен так, чтобы край сферы доходил до края окна —
 * за пределы карты уехать нельзя.
 */
function clampAxis(
  value: number,
  sphereMin: number,
  sphereMax: number,
  zoom: number,
  viewportSize: number,
): number {
  const half = viewportSize / 2 / zoom;
  const lower = sphereMin + half;
  const upper = sphereMax - half;

  if (lower >= upper) {
    return (sphereMin + sphereMax) / 2;
  }

  return Math.min(Math.max(value, lower), upper);
}

/**
 * Ограничивает географический центр карты по краям мира.
 *
 * Нужно для программных изменений центра (кнопки зума, выбор локации)
 * и для корректировки результата перетаскивания: ограничения d3-zoom
 * задаются прямоугольником SVG, а не содержимым карты.
 */
export function clampCenter(center: [number, number], zoom: number): [number, number] {
  const point = projection(center);

  if (!point) {
    return center;
  }

  const x = clampAxis(point[0], sphereXMin, sphereXMax, zoom, MAP_WIDTH);
  const y = clampAxis(point[1], sphereYMin, sphereYMax, zoom, MAP_HEIGHT);
  const projected = projection.invert?.([x, y]);

  if (!projected) {
    return center;
  }

  return [projected[0], projected[1]];
}

/** Умещается ли весь мир в область просмотра — нужно ли панорамирование. */
export function canPan(zoom: number): boolean {
  return zoom >= PAN_MIN_ZOOM;
}

/**
 * Минимальный зум, при котором точку ещё можно поставить в центр карты.
 *
 * Нужен для перелёта к локации: на обзорном зуме Фиджи или Аляску
 * видно только у самого края сферы, поэтому зум подбирается под точку.
 * Перебор с шагом 0.1 гарантирует ту же арифметику, что и в clampCenter.
 */
export function zoomToReach(point: [number, number], maxZoom = 8): number {
  for (let zoom = 1; zoom <= maxZoom; zoom = Math.round((zoom + 0.1) * 10) / 10) {
    const center = clampCenter(point, zoom);

    if (Math.abs(center[0] - point[0]) < 0.05 && Math.abs(center[1] - point[1]) < 0.05) {
      return zoom;
    }
  }

  return maxZoom;
}

/**
 * Границы панорамирования для текущего зума, которые понимает ZoomableGroup.
 *
 * d3-zoom считает их от прямоугольника SVG, а не от содержимого карты,
 * поэтому значения подобраны так, чтобы совпасть с clampCenter:
 * за край сферы уехать нельзя, а лишней пустоты не появляется.
 * При zoom = 1 диапазон схлопывается — карта неподвижна.
 */
export function mapTranslateExtent(zoom: number): [[number, number], [number, number]] {
  return [
    [-sphereXMin * zoom, -sphereYMin * zoom],
    [
      MAP_WIDTH + (MAP_WIDTH - sphereXMax) * zoom,
      MAP_HEIGHT + (MAP_HEIGHT - sphereYMax) * zoom,
    ],
  ];
}
