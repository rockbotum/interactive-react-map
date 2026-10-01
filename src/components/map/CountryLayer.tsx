import { memo } from "react";
import { Geographies, Geography, useMapContext } from "react-simple-maps";
import type { CountryFeature } from "../../hooks/useWorldMapData";
import { findCountryByGeometryId } from "../../utils/countryLookup";
import styles from "./CountryLayer.module.css";

export type CountryVisualState = "default" | "muted" | "matched" | "selected";

export interface CountryLayerProps {
  features: CountryFeature[];
  matchedCountryIds: Set<string>;
  /** Применены ли фильтры или поиск. */
  isFiltered: boolean;
  selectedCountryId: string | null;
  /** Текущий зум — подписи сохраняют размер на экране при приближении. */
  zoom: number;
  /** Показывать названия метрополии, доминионов и крупных владений. */
  showLabels?: boolean;
  onCountryClick: (countryId: string) => void;
  onCountryHover: (countryId: string | null) => void;
}

/**
 * Подписи на карте: метрополия, доминионы и крупнейшие владения.
 * Остальные территории подписаны в боковой панели — иначе текст перекрывает себя.
 */
const LABELLED_EMPIRE_IDS = new Set([
  "gbr",
  "can",
  "aus",
  "nzl",
  "zaf",
  "ind",
  "egy",
  "nga",
  "sdn",
  "gha",
  "ken",
  "tza",
  "mys",
]);

function resolveState(
  countryId: string | null,
  matchedCountryIds: Set<string>,
  selectedCountryId: string | null,
  isFiltered: boolean,
): CountryVisualState {
  if (countryId !== null && countryId === selectedCountryId) {
    return "selected";
  }

  if (!isFiltered) {
    return countryId === null ? "muted" : "default";
  }

  if (countryId !== null && matchedCountryIds.has(countryId)) {
    return "matched";
  }

  return "muted";
}

/**
 * Центр крупнейшего многоугольника в географических координатах.
 * Усреднение всех точек уводило бы подпись в океан у архипелагов
 * и стран, пересекающих линию перемены даты.
 */
function centroid(geometry: CountryFeature["geometry"]): [number, number] | null {
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") {
    return null;
  }

  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const points: [number, number][] = [];

  for (const polygon of polygons) {
    const current: [number, number][] = [];

    for (const ring of polygon) {
      for (const point of ring) {
        if (typeof point[0] === "number" && typeof point[1] === "number") {
          current.push([point[0], point[1]]);
        }
      }
    }

    if (current.length > points.length) {
      points.length = 0;
      points.push(...current);
    }
  }

  if (points.length === 0) {
    return null;
  }

  const [lon, lat] = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0],
  );

  return [lon / points.length, lat / points.length];
}

const EmpireLabels = memo(function EmpireLabels({
  features,
  zoom,
}: {
  features: CountryFeature[];
  zoom: number;
}) {
  const { projection } = useMapContext();

  return (
    <g className={styles.labels} aria-hidden="true">
      {features.map((feature) => {
        const country = findCountryByGeometryId(String(feature.id ?? ""));
        const empire = country?.empire;

        if (!empire || !LABELLED_EMPIRE_IDS.has(country!.id)) {
          return null;
        }

        const point = centroid(feature.geometry);
        const projected = point ? projection(point) : null;

        if (!projected) {
          return null;
        }

        return (
          <g
            key={`label-${feature.id}`}
            transform={`translate(${projected[0]}, ${projected[1]}) scale(${1 / zoom})`}
          >
            <text className={styles.label} textAnchor="middle" dy="0.35em">
              {empire.historicalName}
            </text>
          </g>
        );
      })}
    </g>
  );
});

export const CountryLayer = memo(function CountryLayer({
  features,
  matchedCountryIds,
  isFiltered,
  selectedCountryId,
  zoom,
  showLabels = true,
  onCountryClick,
  onCountryHover,
}: CountryLayerProps) {
  return (
    <>
      <Geographies geography={features}>
        {({ geographies }) =>
          geographies.map((shape) => {
            const geometryId = String(shape.id ?? "");
            const country = findCountryByGeometryId(geometryId);
            const countryId = country?.id ?? null;
            const name = shape.properties?.name ?? geometryId;
            const state = resolveState(countryId, matchedCountryIds, selectedCountryId, isFiltered);
            const label = country
              ? `${country.name} (${country.nameEn})`
              : `${name} — описание отсутствует`;
            const isEmpire = country?.empire !== undefined;

            // Интерактивны только страны с описанием, которые проходят текущий фильтр.
            const interactive = country !== undefined && state !== "muted";

            const classNames = [
              styles.country,
              styles[state],
              isEmpire ? styles.empire : "",
              countryId !== null && countryId === selectedCountryId ? styles.empireSelected : "",
              interactive ? styles.interactive : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <Geography
                key={shape.rsmKey}
                geography={shape}
                className={classNames}
                tabIndex={interactive ? 0 : -1}
                role={interactive ? "button" : undefined}
                aria-label={label}
                aria-pressed={interactive ? countryId === selectedCountryId : undefined}
                onClick={() => {
                  if (countryId) {
                    onCountryClick(countryId);
                  }
                }}
                onMouseEnter={() => onCountryHover(countryId)}
                onMouseLeave={() => onCountryHover(null)}
                onFocus={() => onCountryHover(countryId)}
                onBlur={() => onCountryHover(null)}
                onKeyDown={(event) => {
                  if (!countryId) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onCountryClick(countryId);
                  }
                }}
              />
            );
          })
        }
      </Geographies>

      {showLabels ? <EmpireLabels features={features} zoom={zoom} /> : null}
    </>
  );
});
