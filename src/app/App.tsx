import { useMemo } from "react";
import { CountryPanel } from "../components/country/CountryPanel";
import { FilterPanel } from "../components/filters/FilterPanel";
import { SearchPanel } from "../components/search/SearchPanel";
import { WorldMap } from "../components/map/WorldMap";
import { EMPIRE_NAME, EMPIRE_YEAR, SMALL_POSSESSIONS } from "../data/empire";
import { countries } from "../data/countries";
import { locationsByCountry } from "../data/cities";
import { hasActiveFilters } from "../features/countries/countryFilters";
import { useAppState } from "../hooks/useAppState";
import {
  countryById,
  selectVisibleCountries,
  selectVisibleCountryIds,
  selectVisibleLocations,
} from "../features/countries/selectors";
import type { Location } from "../types/geography";
import styles from "./App.module.css";

export function App() {
  const { state, actions } = useAppState();

  const visibleCountries = useMemo(() => selectVisibleCountries(state), [state]);
  const matchedCountryIds = useMemo(() => selectVisibleCountryIds(state), [state]);
  const visibleLocations = useMemo(() => selectVisibleLocations(state), [state]);

  const selectedCountry = state.selectedCountryId
    ? (countryById(state.selectedCountryId) ?? null)
    : null;

  const selectedCountryLocations = useMemo(
    () => (selectedCountry ? locationsByCountry(selectedCountry.id) : []),
    [selectedCountry],
  );

  const filtersActive = hasActiveFilters({
    continent: state.selectedContinent,
    query: state.searchQuery,
    withCapitalOnly: state.withCapitalOnly,
    withDescriptionOnly: state.withDescriptionOnly,
    locationType: state.selectedLocationType,
  });

  function handleLocationSelect(location: Location) {
    if (state.selectedLocationId === location.id) {
      actions.selectLocation(null);
      return;
    }

    actions.selectLocation(location.id, [
      location.coordinates.longitude,
      location.coordinates.latitude,
    ]);
  }

  function handleCountrySelect(countryId: string) {
    actions.selectCountry(countryId);
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>{EMPIRE_NAME}, {EMPIRE_YEAR}</h1>
        <p className={styles.subtitle}>
          Владения, доминионы и протектораты Британии — {EMPIRE_YEAR} год, вершина империи
        </p>
      </header>

      <div className={styles.toolbar}>
        <SearchPanel
          value={state.searchQuery}
          matchCount={visibleCountries.length}
          totalCount={countries.length}
          onChange={actions.setSearchQuery}
        />
      </div>

      <main className={styles.main}>
        <div className={styles.mapArea}>
          <WorldMap
            zoom={state.zoom}
            center={state.center}
            matchedCountryIds={matchedCountryIds}
            isFiltered={filtersActive}
            selectedCountryId={state.selectedCountryId}
            locations={visibleLocations}
            selectedLocationId={state.selectedLocationId}
            onCountryClick={handleCountrySelect}
            onCountryHover={() => undefined}
            onLocationClick={handleLocationSelect}
            onZoomChange={actions.setZoom}
            onCenterChange={actions.setCenter}
            onZoomIn={actions.zoomIn}
            onZoomOut={actions.zoomOut}
            onReset={actions.resetMap}
          />

          <section className={styles.filters} aria-label="Фильтры">
            <FilterPanel
              selectedContinent={state.selectedContinent}
              selectedLocationType={state.selectedLocationType}
              withCapitalOnly={state.withCapitalOnly}
              withDescriptionOnly={state.withDescriptionOnly}
              matchCount={visibleCountries.length}
              hasActiveFilters={filtersActive}
              onContinentChange={actions.setContinent}
              onLocationTypeChange={actions.setLocationType}
              onToggleCapitalOnly={actions.toggleCapitalOnly}
              onToggleDescriptionOnly={actions.toggleDescriptionOnly}
              onClear={actions.clearFilters}
            />
          </section>
        </div>

        <div className={styles.side}>
          <CountryPanel
            country={selectedCountry}
            locations={selectedCountryLocations}
            selectedLocationId={state.selectedLocationId}
            onClose={actions.resetMap}
            onLocationSelect={handleLocationSelect}
          />
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Границы: Natural Earth 1:110m (public domain) в формате TopoJSON (world-atlas).
          Заливка показывает принадлежность к империи на {EMPIRE_YEAR} год по современным
          границам — исторические очертания колоний не воспроизводятся.
        </p>
        <p>Без отдельной геометрии: {SMALL_POSSESSIONS.join(", ")}.</p>
      </footer>
    </div>
  );
}