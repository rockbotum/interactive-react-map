import { EMPIRE_STATUS_LABELS } from "../../types/geography";
import { EMPIRE_YEAR } from "../../data/empire";
import { continentName } from "../../utils/countryLookup";
import { formatArea, formatPopulation } from "../../utils/format";
import type { Country } from "../../types/geography";
import styles from "./CountrySummary.module.css";

export interface CountrySummaryProps {
  country: Country;
}

export function CountrySummary({ country }: CountrySummaryProps) {
  const { empire } = country;

  return (
    <div className={styles.summary}>
      <div className={styles.heading}>
        {country.flagEmoji ? (
          <span className={styles.flag} role="img" aria-label={`Флаг: ${country.name}`}>
            {country.flagEmoji}
          </span>
        ) : null}
        <div>
          <p className={styles.english}>{country.nameEn}</p>
          <p className={styles.codes}>
            {country.iso2} / {country.iso3}
          </p>
        </div>
      </div>

      {empire ? (
        <section className={styles.empire} aria-label="Положение в составе Британской империи">
          <p className={styles.empireYear}>Британская империя, {EMPIRE_YEAR}</p>
          <p className={styles.empireName}>{empire.historicalName}</p>
          <p className={styles.empireStatus}>{EMPIRE_STATUS_LABELS[empire.status]}</p>
          {empire.modernName ? (
            <p className={styles.empireModern}>Современное название: {empire.modernName}</p>
          ) : null}
          {empire.note ? <p className={styles.empireNote}>{empire.note}</p> : null}
        </section>
      ) : null}

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Континент</dt>
          <dd>{continentName(country.continent)}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Столица</dt>
          <dd>{country.capital ?? "нет данных"}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Население</dt>
          <dd>{formatPopulation(country.population)}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Площадь</dt>
          <dd>{formatArea(country.areaKm2)}</dd>
        </div>
      </dl>

      {country.tags.length > 0 ? (
        <ul className={styles.tags}>
          {country.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}