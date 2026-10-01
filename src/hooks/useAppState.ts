import { useMemo, useState } from "react";
import {
  DEFAULT_APP_STATE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from "../features/countries/selectors";
import { clampCenter, zoomToReach } from "../features/map/mapBounds";
import type { AppState } from "../features/countries/selectors";
import type { ContinentId, Location } from "../types/geography";

const ZOOM_STEP = 0.5;

export interface MapActions {
  selectCountry: (countryId: string | null) => void;
  selectLocation: (locationId: string | null, center?: [number, number]) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setCenter: (center: [number, number]) => void;
  setSearchQuery: (value: string) => void;
  setContinent: (continent: ContinentId | null) => void;
  toggleCapitalOnly: () => void;
  toggleDescriptionOnly: () => void;
  setLocationType: (type: Location["type"] | null) => void;
  resetMap: () => void;
  clearFilters: () => void;
}

export interface UseAppStateResult {
  state: AppState;
  actions: MapActions;
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function useAppState(): UseAppStateResult {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);

  const actions = useMemo<MapActions>(
    () => ({
      selectCountry(countryId) {
        setState((prev) => ({
          ...prev,
          selectedCountryId: countryId,
          selectedLocationId: null,
        }));
      },

      selectLocation(locationId, center) {
        setState((prev) => {
          // Зум подбирается так, чтобы сама локация оказалась в центре.
          const zoom = center
            ? clampZoom(Math.max(prev.zoom, zoomToReach(center, MAX_ZOOM)))
            : prev.zoom;

          return {
            ...prev,
            selectedLocationId: locationId,
            zoom,
            // Центр задаётся кнопками и поиском, поэтому его тоже нужно ограничить.
            center: center ? clampCenter(center, zoom) : prev.center,
          };
        });
      },

      setZoom(zoom) {
        setState((prev) => {
          const nextZoom = clampZoom(zoom);

          return { ...prev, zoom: nextZoom, center: clampCenter(prev.center, nextZoom) };
        });
      },

      zoomIn() {
        setState((prev) => {
          const zoom = clampZoom(prev.zoom + ZOOM_STEP);

          return { ...prev, zoom, center: clampCenter(prev.center, zoom) };
        });
      },

      zoomOut() {
        setState((prev) => {
          const zoom = clampZoom(prev.zoom - ZOOM_STEP);

          return { ...prev, zoom, center: clampCenter(prev.center, zoom) };
        });
      },

      setCenter(center) {
        setState((prev) => ({ ...prev, center: clampCenter(center, prev.zoom) }));
      },

      setSearchQuery(value) {
        setState((prev) => ({ ...prev, searchQuery: value }));
      },

      setContinent(continent) {
        setState((prev) => ({ ...prev, selectedContinent: continent }));
      },

      toggleCapitalOnly() {
        setState((prev) => ({ ...prev, withCapitalOnly: !prev.withCapitalOnly }));
      },

      toggleDescriptionOnly() {
        setState((prev) => ({ ...prev, withDescriptionOnly: !prev.withDescriptionOnly }));
      },

      setLocationType(type) {
        setState((prev) => ({ ...prev, selectedLocationType: type }));
      },

      resetMap() {
        setState((prev) => ({
          ...prev,
          selectedCountryId: null,
          selectedLocationId: null,
          zoom: DEFAULT_ZOOM,
          center: DEFAULT_CENTER,
        }));
      },

      clearFilters() {
        setState((prev) => ({
          ...prev,
          searchQuery: "",
          selectedContinent: null,
          withCapitalOnly: false,
          withDescriptionOnly: false,
          selectedLocationType: null,
        }));
      },
    }),
    [],
  );

  return { state, actions };
}
