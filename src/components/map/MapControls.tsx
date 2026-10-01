import styles from "./MapControls.module.css";

export interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn,
  canZoomOut,
}: MapControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Увеличить масштаб"
      >
        +
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Уменьшить масштаб"
      >
        −
      </button>
      <button type="button" className={styles.reset} onClick={onReset}>
        Сбросить карту
      </button>
      <p className={styles.zoom} aria-live="polite">
        Масштаб: {zoom.toFixed(1)}×
      </p>
    </div>
  );
}