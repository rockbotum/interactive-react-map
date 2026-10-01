import { ComposableMap, Graticule, Sphere, ZoomableGroup } from "react-simple-maps";
import type { ZoomPanCallbackProps } from "react-simple-maps";
import { CountryLayer } from "./CountryLayer";
import { Legend } from "../common/Legend";
import { MapControls } from "./MapControls";
import { MapMarkers } from "./MapMarkers";
import { MAX_ZOOM, MIN_ZOOM } from "../../features/countries/selectors";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  canPan,
  clampCenter,
  mapTranslateExtent,
} from "../../features/map/mapBounds";
import { useAnimatedView } from "../../features/map/useAnimatedView";
import type { Location } from "../../types/geography";
import { useWorldMapData } from "../../hooks/useWorldMapData";
import styles from "./WorldMap.module.css";

export interface WorldMapProps {
  zoom: number;
  center: [number, number];
  matchedCountryIds: Set<string>;
  /** Применены ли поиск или фильтры. */
  isFiltered: boolean;
  selectedCountryId: string | null;
  locations: Location[];
  selectedLocationId: string | null;
  onCountryClick: (countryId: string) => void;
  onCountryHover: (countryId: string | null) => void;
  onLocationClick: (location: Location) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (center: [number, number]) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function WorldMap({
  zoom,
  center,
  matchedCountryIds,
  isFiltered,
  selectedCountryId,
  locations,
  selectedLocationId,
  onCountryClick,
  onCountryHover,
  onLocationClick,
  onZoomChange,
  onCenterChange,
  onZoomIn,
  onZoomOut,
  onReset,
}: WorldMapProps) {
  const { status, features } = useWorldMapData();
  const { view, snap } = useAnimatedView({ center, zoom });

  function handleMoveEnd(event: ZoomPanCallbackProps) {
    if (typeof event.zoom === "number") {
      onZoomChange(event.zoom);
    }

    if (event.coordinates) {
      const nextCenter = clampCenter(event.coordinates, event.zoom ?? zoom);

      // Жест мыши уже передвинул карту: фиксируем вид без перехода.
      snap({ center: nextCenter, zoom: event.zoom ?? zoom });
      onCenterChange(nextCenter);
    }
  }

  /**
   * Колесо масштабирует карту всегда, а перетаскивание — только при
   * зуме, когда карта не помещается целиком.
   */
  function handleFilterZoomEvent(event: Event) {
    if (event.type === "wheel") {
      return true;
    }

    if (!canPan(view.zoom)) {
      return false;
    }

    const mouseEvent = event as MouseEvent;

    return !mouseEvent.ctrlKey && !mouseEvent.button;
  }

  return (
    <section className={styles.wrapper} aria-label="Карта Британской империи">
      {status === "loading" ? (
        <p className={styles.status} role="status">
          Загрузка карты…
        </p>
      ) : null}

      {status === "error" ? (
        <p className={styles.status} role="alert">
          Не удалось загрузить файл карты. Проверьте наличие public/maps/world.topo.json.
        </p>
      ) : null}

      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projection="geoEqualEarth"
        className={styles.map}
      >
        {/* Штриховка «школой гравюры» вместо сплошной заливки. */}
        <defs>
          <pattern
            id="empire-hatch"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect className={styles.hatchWash} width="5" height="5" />
            <line className={styles.hatchLine} x1="0" y1="0" x2="0" y2="5" />
          </pattern>
          <pattern
            id="empire-hatch-dense"
            width="3"
            height="3"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <rect className={styles.hatchWashDense} width="3" height="3" />
            <line className={styles.hatchLineDense} x1="0" y1="0" x2="0" y2="3" />
          </pattern>
          <radialGradient id="sea-wash" cx="38%" cy="32%" r="78%">
            <stop offset="0%" className={styles.seaLight} />
            <stop offset="100%" className={styles.seaShade} />
          </radialGradient>
        </defs>

        <Sphere className={styles.sphere} />
        <Graticule className={styles.graticule} />

        <ZoomableGroup
          center={view.center}
          zoom={view.zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          translateExtent={mapTranslateExtent(view.constraintZoom)}
          filterZoomEvent={handleFilterZoomEvent}
          onMoveEnd={handleMoveEnd}
        >
          {status === "ready" ? (
            <>
              <CountryLayer
                features={features}
                matchedCountryIds={matchedCountryIds}
                isFiltered={isFiltered}
                selectedCountryId={selectedCountryId}
                zoom={view.zoom}
                onCountryClick={onCountryClick}
                onCountryHover={onCountryHover}
              />
              <MapMarkers
                locations={locations}
                selectedLocationId={selectedLocationId}
                zoom={view.zoom}
                onLocationClick={onLocationClick}
              />
            </>
          ) : null}
        </ZoomableGroup>
      </ComposableMap>

      <MapControls
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onReset}
        canZoomIn={zoom < MAX_ZOOM}
        canZoomOut={zoom > MIN_ZOOM}
      />

      <Legend />
    </section>
  );
}
