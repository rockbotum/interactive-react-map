import { EMPIRE_YEAR } from "../../data/empire";
import { countries } from "../../data/countries";
import styles from "./Legend.module.css";

const EMPIRE_COUNT = countries.filter((country) => country.empire !== undefined).length;

export function Legend() {
  return (
    <div className={styles.legend}>
      <h2 className={styles.title}>Легенда</h2>
      <ul className={styles.list}>
        <li className={styles.item}>
          <span className={`${styles.swatch} ${styles.empireCountry}`} aria-hidden="true" />
          Владение Британской империи, {EMPIRE_YEAR} ({EMPIRE_COUNT})
        </li>
        <li className={styles.item}>
          <span className={`${styles.swatch} ${styles.selectedCountry}`} aria-hidden="true" />
          Выбранная страна
        </li>
        <li className={styles.item}>
          <span className={`${styles.swatch} ${styles.mutedCountry}`} aria-hidden="true" />
          Вне империи
        </li>
        <li className={styles.item}>
          <span className={`${styles.swatch} ${styles.markerDot}`} aria-hidden="true" />
          Город или объект
        </li>
      </ul>
    </div>
  );
}
