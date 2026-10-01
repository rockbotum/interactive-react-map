import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComposableMap } from "react-simple-maps";
import { CountryLayer } from "./CountryLayer";
import { MapMarkers } from "./MapMarkers";
import { DEFAULT_ZOOM } from "../../features/countries/selectors";
import type { CountryFeature } from "../../hooks/useWorldMapData";

/** Прямоугольник в географических координатах — форма тут неважна. */
function box(lon: number, lat: number, id: string, name: string): CountryFeature {
  return {
    type: "Feature",
    id,
    properties: { name },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lon, lat],
          [lon + 8, lat],
          [lon + 8, lat + 6],
          [lon, lat + 6],
          [lon, lat],
        ],
      ],
    },
  };
}

const FEATURES: CountryFeature[] = [
  box(-8, 50, "826", "United Kingdom"),
  box(70, 20, "356", "India"),
  box(0, 45, "250", "France"),
];

function renderLayer(props: Partial<React.ComponentProps<typeof CountryLayer>> = {}) {
  return render(
    <ComposableMap width={1000} height={560} projection="geoEqualEarth">
      <CountryLayer
        features={FEATURES}
        matchedCountryIds={new Set()}
        isFiltered={false}
        selectedCountryId={null}
        zoom={DEFAULT_ZOOM}
        onCountryClick={vi.fn()}
        onCountryHover={vi.fn()}
        {...props}
      />
    </ComposableMap>,
  );
}

describe("CountryLayer", () => {
  it("помечает имперские владения отдельным классом", () => {
    const { container } = renderLayer();

    const empire = container.querySelectorAll('.rsm-geography[class*="empire"]');

    // Метрополия и Индия — владения империи, Франция — нет.
    expect(empire).toHaveLength(2);
  });

  it("подписывает метрополию и доминион, но не чужие страны", () => {
    renderLayer();

    expect(screen.getByText("Великобритания (United Kingdom)")).toBeInTheDocument();
    expect(screen.getByText("Британская Индия (British India)")).toBeInTheDocument();
    expect(screen.queryByText(/Франция/)).not.toBeInTheDocument();
  });

  it("держит размер подписи на экране при приближении", () => {
    const { container, rerender } = renderLayer();

    const scaleOf = () =>
      container
        .querySelector('[class*="labels"] g')
        ?.getAttribute("transform")
        ?.replace(/^translate\([^)]+\)\s*/, "");

    const atDefault = scaleOf();

    rerender(
      <ComposableMap width={1000} height={560} projection="geoEqualEarth">
        <CountryLayer
          features={FEATURES}
          matchedCountryIds={new Set()}
          isFiltered={false}
          selectedCountryId={null}
          zoom={8}
          onCountryClick={vi.fn()}
          onCountryHover={vi.fn()}
        />
      </ComposableMap>,
    );

    expect(scaleOf()).toBe(`scale(${1 / 8})`);
    expect(atDefault).toBe(`scale(${1 / DEFAULT_ZOOM})`);
  });

  it("не рисует подписи, если их выключили", () => {
    renderLayer({ showLabels: false });

    expect(screen.queryByText("Великобритания (United Kingdom)")).not.toBeInTheDocument();
  });
});

describe("MapMarkers", () => {
  const locations = [
    {
      id: "bombay",
      name: "Бомбей",
      type: "city" as const,
      countryId: "ind",
      continent: "asia" as const,
      coordinates: { longitude: 72.88, latitude: 19.08 },
      description: "Крупный порт Британской Индии.",
      tags: ["индия"],
    },
  ];

  it("не увеличивает точку при приближении карты", () => {
    const { container } = render(
      <ComposableMap width={1000} height={560} projection="geoEqualEarth">
        <MapMarkers
          locations={locations}
          selectedLocationId={null}
          zoom={DEFAULT_ZOOM}
          onLocationClick={vi.fn()}
        />
      </ComposableMap>,
    );

    const marker = container.querySelector(".rsm-marker > g");

    expect(marker?.getAttribute("transform")).toBe(`scale(${1 / DEFAULT_ZOOM})`);
  });

  it("оставляет точку мелкой: радиус задаётся в CSS", () => {
    const { container } = render(
      <ComposableMap width={1000} height={560} projection="geoEqualEarth">
        <MapMarkers
          locations={locations}
          selectedLocationId={null}
          zoom={1}
          onLocationClick={vi.fn()}
        />
      </ComposableMap>,
    );

    const dot = container.querySelector('[class*="dot"]');

    expect(dot?.getAttribute("r")).toBe("2.2");
  });
});
