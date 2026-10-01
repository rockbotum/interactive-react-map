import { useId } from "react";
import styles from "./SearchPanel.module.css";

export interface SearchPanelProps {
  value: string;
  matchCount: number;
  totalCount: number;
  onChange: (value: string) => void;
}

export function SearchPanel({ value, matchCount, totalCount, onChange }: SearchPanelProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  return (
    <div className={styles.panel}>
      <label className={styles.label} htmlFor={inputId}>
        Поиск страны
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="search"
        value={value}
        placeholder="Название, столица, город, континент, тег"
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={hintId} className={styles.hint} aria-live="polite">
        {value.trim().length === 0
          ? `Доступно стран с описанием: ${totalCount}`
          : `Найдено стран: ${matchCount} из ${totalCount}`}
      </p>
    </div>
  );
}