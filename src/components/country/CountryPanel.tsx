import { CountrySummary } from "./CountrySummary";
import { LOCATION_TYPE_LABELS } from "../../types/geography";
import { formatCoordinates } from "../../utils/format";
import type { Country, Location } from "../../types/geography";
import styles from "./CountryPanel.module.css";

export interface CountryPanelProps {
  country: Country | null;
  locations: Location[];
  selectedLocationId: string | null;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
}

export function CountryPanel({
  country,
  locations,
  selectedLocationId,
  onClose,
  onLocationSelect,
}: CountryPanelProps) {
  if (!country) {
    return (
      <aside className={styles.panel} aria-label="Информация о стране">
        <h2 className={styles.heading}>Выберите страну</h2>
        <p className={styles.empty}>
          Нажмите на страну на карте или воспользуйтесь поиском, чтобы увидеть краткую справку.
        </p>
      </aside>
    );
  }

  return (
    <aside className={styles.panel} aria-label={`Информация о стране: ${country.name}`}>
      <header className={styles.header}>
        <h2 className={styles.heading}>{country.name}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Закрыть панель страны"
        >
          ×
        </button>
      </header>

      <CountrySummary country={country} />

      <p className={styles.description}>
        {country.description ?? "Подробное описание для этой страны пока не подготовлено."}
      </p>

      <section className={styles.locations}>
        <h3 className={styles.subheading}>
          Объекты на карте ({locations.length})
        </h3>

        {locations.length === 0 ? (
          <p className={styles.empty}>Для этой страны нет объектов в статических данных.</p>
        ) : (
          <ul className={styles.locationList}>
            {locations.map((location) => (
              <li key={location.id}>
                <button
                  type="button"
                  className={`${styles.location} ${
                    location.id === selectedLocationId ? styles.locationActive : ""
                  }`}
                  aria-pressed={location.id === selectedLocationId}
                  onClick={() => onLocationSelect(location)}
                >
                  <span className={styles.locationName}>{location.name}</span>
                  <span className={styles.locationMeta}>
                    {LOCATION_TYPE_LABELS[location.type]} ·{" "}
                    {formatCoordinates(
                      location.coordinates.latitude,
                      location.coordinates.longitude,
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}