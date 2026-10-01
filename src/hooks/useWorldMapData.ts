import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const WORLD_MAP_URL = `${import.meta.env.BASE_URL}maps/world.topo.json`;

export type MapDataStatus = "loading" | "ready" | "error";

export interface CountryFeature extends Feature<Geometry> {
  /** ISO 3166-1 numeric-3, идентификатор геометрии в world.topo.json */
  id: string;
  properties: { name: string };
}

export interface UseWorldMapDataResult {
  status: MapDataStatus;
  features: CountryFeature[];
}

/**
 * Загружает локальный TopoJSON и приводит объект countries
 * к GeoJSON-фичам с идентификатором ISO 3166-1 numeric-3.
 */
export function useWorldMapData(url: string = WORLD_MAP_URL): UseWorldMapDataResult {
  const [state, setState] = useState<UseWorldMapDataResult>({
    status: "loading",
    features: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const topology = (await response.json()) as Topology;
        const normalized = countryFeatures(topology);

        if (normalized.length === 0) {
          throw new Error("Файл карты не содержит геометрий стран");
        }

        if (!cancelled) {
          setState({ status: "ready", features: normalized });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error", features: [] });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

/**
 * Преобразует TopoJSON в массив фич.
 * Фичи без идентификатора (например, дубликаты Северного Кипра в Natural Earth)
 * отбрасываются: сопоставление по названию не используется.
 */
export function countryFeatures(topology: Topology): CountryFeature[] {
  const object = topology.objects?.countries;

  if (!object) {
    return [];
  }

  const collection = feature(topology, object) as unknown as FeatureCollection<Geometry>;
  const seen = new Set<string>();

  const feats = collection.features as Array<Feature<Geometry> & { id?: string | number; properties?: Record<string, unknown> }>; return feats.flatMap((item) => {
    const rawId = item.id;

    if (rawId === undefined || rawId === null) {
      return [];
    }

    const id = String(rawId);

    if (seen.has(id)) {
      return [];
    }

    seen.add(id);

    return [
      {
        ...item,
        id,
        properties: { name: item.properties?.name ?? id },
      },
    ];
  });
}