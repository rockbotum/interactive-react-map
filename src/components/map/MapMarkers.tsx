import { memo } from "react";
import { Marker } from "react-simple-maps";
import type { Location } from "../../types/geography";
import { LOCATION_TYPE_LABELS } from "../../types/geography";
import styles from "./MapMarkers.module.css";

export interface MapMarkersProps {
  locations: Location[];
  selectedLocationId: string | null;
  /** Текущий зум — метки не растут при приближении, как точки на гравюре. */
  zoom: number;
  onLocationClick: (location: Location) => void;
}

export const MapMarkers = memo(function MapMarkers({
  locations,
  selectedLocationId,
  zoom,
  onLocationClick,
}: MapMarkersProps) {
  return (
    <g className={styles.layer}>
      {locations.map((location) => {
        const isSelected = location.id === selectedLocationId;

        return (
          <Marker
            key={location.id}
            coordinates={[location.coordinates.longitude, location.coordinates.latitude]}
          >
            <g
              className={`${styles.marker} ${isSelected ? styles.selected : ""}`}
              transform={`scale(${1 / zoom})`}
              role="button"
              tabIndex={0}
              aria-label={`${location.name}, ${LOCATION_TYPE_LABELS[location.type]}`}
              aria-pressed={isSelected}
              onClick={(event) => {
                event.stopPropagation();
                onLocationClick(location);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onLocationClick(location);
                }
              }}
            >
              <circle className={styles.hit} r={10} />
              <circle className={styles.dot} r={2.2} />
            </g>
          </Marker>
        );
      })}
    </g>
  );
});
