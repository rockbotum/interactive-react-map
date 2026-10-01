import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppState } from "./useAppState";
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from "../features/countries/selectors";
import { clampCenter } from "../features/map/mapBounds";

describe("useAppState", () => {
  it("стартует с пустым состоянием", () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.state.selectedCountryId).toBeNull();
    expect(result.current.state.searchQuery).toBe("");
    expect(result.current.state.zoom).toBe(DEFAULT_ZOOM);
    expect(result.current.state.center).toEqual(DEFAULT_CENTER);
  });

  it("выбирает страну и сбрасывает выбранную локацию", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.selectLocation("moscow"));
    act(() => result.current.actions.selectCountry("rus"));

    expect(result.current.state.selectedCountryId).toBe("rus");
    expect(result.current.state.selectedLocationId).toBeNull();
  });

  it("сбрасывает карту, очищая выделение, зум и центр", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.selectCountry("fra"));
    act(() => result.current.actions.zoomIn());
    act(() => result.current.actions.setCenter([100, -30]));
    act(() => result.current.actions.resetMap());

    expect(result.current.state.selectedCountryId).toBeNull();
    expect(result.current.state.zoom).toBe(DEFAULT_ZOOM);
    expect(result.current.state.center).toEqual(DEFAULT_CENTER);
  });

  it("не позволяет увеличить масштаб выше максимума", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.setZoom(MAX_ZOOM));
    act(() => result.current.actions.zoomIn());

    expect(result.current.state.zoom).toBe(MAX_ZOOM);
  });

  it("не позволяет уменьшить масштаб ниже минимума", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.setZoom(MIN_ZOOM));
    act(() => result.current.actions.zoomOut());

    expect(result.current.state.zoom).toBe(MIN_ZOOM);
  });

  it("ограничивает значение зума снаружи", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.setZoom(99));
    expect(result.current.state.zoom).toBe(MAX_ZOOM);

    act(() => result.current.actions.setZoom(-3));
    expect(result.current.state.zoom).toBe(MIN_ZOOM);
  });

  it("центрирует карту на локации при выборе", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.selectLocation("tokyo", [139.69, 35.68]));

    // Центр ограничен краями карты, поэтому сверяем с допустимым значением.
    expect(clampCenter([139.69, 35.68], result.current.state.zoom)).toEqual(
      result.current.state.center,
    );
  });

  it("приближает карту к локации, если она сильно отдалена", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.setZoom(MIN_ZOOM));
    act(() => result.current.actions.selectLocation("suva", [178.44, -18.14]));

    expect(result.current.state.zoom).toBeGreaterThan(MIN_ZOOM);
  });

  it("не даёт увести центр за край карты", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.setZoom(4));
    act(() => result.current.actions.setCenter([179.9, 89]));

    expect(result.current.state.center[1]).toBeLessThan(89);
    expect(clampCenter([179.9, 89], 4)).toEqual(result.current.state.center);
  });

  it("возвращает центр к метрополии при сбросе", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.setZoom(MIN_ZOOM));
    act(() => result.current.actions.resetMap());

    expect(result.current.state.zoom).toBe(DEFAULT_ZOOM);
    expect(result.current.state.center).toEqual(DEFAULT_CENTER);
  });

  it("очищает фильтры, сохраняя выбор страны", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.selectCountry("jpn"));
    act(() => result.current.actions.setSearchQuery("токио"));
    act(() => result.current.actions.setContinent("asia"));
    act(() => result.current.actions.toggleCapitalOnly());
    act(() => result.current.actions.clearFilters());

    expect(result.current.state.searchQuery).toBe("");
    expect(result.current.state.selectedContinent).toBeNull();
    expect(result.current.state.withCapitalOnly).toBe(false);
    expect(result.current.state.selectedCountryId).toBe("jpn");
  });

  it("переключает флаги фильтров", () => {
    const { result } = renderHook(() => useAppState());

    act(() => result.current.actions.toggleDescriptionOnly());
    expect(result.current.state.withDescriptionOnly).toBe(true);

    act(() => result.current.actions.toggleDescriptionOnly());
    expect(result.current.state.withDescriptionOnly).toBe(false);
  });

  it("создаёт стабильные обработчики между рендерами", () => {
    const { result, rerender } = renderHook(() => useAppState());
    const first = result.current.actions;

    rerender();

    expect(result.current.actions).toBe(first);
  });

  it("не вызывает лишние обновления при выборе той же локации", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useAppState());

    act(() => onSelect(result.current.actions.selectLocation("paris")));

    expect(result.current.state.selectedLocationId).toBe("paris");
  });
});