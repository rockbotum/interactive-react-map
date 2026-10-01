import { useId } from "react";
import { continents } from "../../data/continents";
import { LOCATION_TYPE_LABELS } from "../../types/geography";
import type { ContinentId, LocationType } from "../../types/geography";
import styles from "./FilterPanel.module.css";

const LOCATION_TYPES = Object.keys(LOCATION_TYPE_LABELS) as LocationType[];

export interface FilterPanelProps {
  selectedContinent: ContinentId | null;
  selectedLocationType: LocationType | null;
  withCapitalOnly: boolean;
  withDescriptionOnly: boolean;
  matchCount: number;
  hasActiveFilters: boolean;
  onContinentChange: (continent: ContinentId | null) => void;
  onLocationTypeChange: (type: LocationType | null) => void;
  onToggleCapitalOnly: () => void;
  onToggleDescriptionOnly: () => void;
  onClear: () => void;
}

export function FilterPanel({
  selectedContinent,
  selectedLocationType,
  withCapitalOnly,
  withDescriptionOnly,
  matchCount,
  hasActiveFilters,
  onContinentChange,
  onLocationTypeChange,
  onToggleCapitalOnly,
  onToggleDescriptionOnly,
  onClear,
}: FilterPanelProps) {
  const continentId = useId();
  const typeId = useId();

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={continentId}>
          Континент
        </label>
        <select
          id={continentId}
          className={styles.select}
          value={selectedContinent ?? ""}
          onChange={(event) =>
            onContinentChange(event.target.value === "" ? null : (event.target.value as ContinentId))
          }
        >
          <option value="">Все континенты</option>
          {continents.map((continent) => (
            <option key={continent.id} value={continent.id}>
              {continent.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={typeId}>
          Тип объекта
        </label>
        <select
          id={typeId}
          className={styles.select}
          value={selectedLocationType ?? ""}
          onChange={(event) =>
            onLocationTypeChange(
              event.target.value === "" ? null : (event.target.value as LocationType),
            )
          }
        >
          <option value="">Любой тип</option>
          {LOCATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {LOCATION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Дополнительно</legend>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={withCapitalOnly}
            onChange={onToggleCapitalOnly}
          />
          Только страны со столицей
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={withDescriptionOnly}
            onChange={onToggleDescriptionOnly}
          />
          Только с подробным описанием
        </label>
      </fieldset>

      <p className={styles.status} aria-live="polite">
        {hasActiveFilters ? `Подходящих стран: ${matchCount}` : "Фильтры не применены"}
      </p>

      <button
        type="button"
        className={styles.clear}
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        Сбросить фильтры
      </button>
    </div>
  );
}