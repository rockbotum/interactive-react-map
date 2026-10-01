import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { useAnimatedView } from "./useAnimatedView";
import type { MapView } from "./useAnimatedView";

function setup(target: MapView, duration?: number) {
  const views: MapView[] = [];
  const constraints: number[] = [];
  const snaps: Array<(next: MapView) => void> = [];

  function Probe({ view }: { view: MapView }) {
    const { view: animated, snap } = useAnimatedView(view, duration);

    views.push({ center: animated.center, zoom: animated.zoom });
    constraints.push(animated.constraintZoom);
    snaps.push(snap);

    return null;
  }

  const utils = render(<Probe view={target} />);

  return {
    ...utils,
    rerender: (view: MapView) => utils.rerender(<Probe view={view} />),
    views,
    constraints,
    snaps,
    last: () => views[views.length - 1],
  };
}

describe("useAnimatedView", () => {
  it("начинает с целевого вида без перехода", () => {
    const { last } = setup({ center: [-2.46, 51.57], zoom: 4.5 });

    expect(last()).toEqual({ center: [-2.46, 51.57], zoom: 4.5 });
  });

  it("доводит центр и зум до цели за несколько кадров", () => {
    vi.useFakeTimers();
    const { rerender, last, views } = setup({ center: [-2.46, 51.57], zoom: 4.5 }, 600);

    act(() => {
      rerender({ center: [139.69, 35.68], zoom: 5 });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const middle = last();

    expect(views.length).toBeGreaterThan(2);
    expect(middle.zoom).toBeLessThan(5);
    expect(middle.zoom).toBeGreaterThan(4.5);
    expect(middle.center[0]).toBeLessThan(139.69);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(last()).toEqual({ center: [139.69, 35.68], zoom: 5 });

    vi.useRealTimers();
  });

  it("разрешает границы сдвига по большему зуму на время перехода", () => {
    vi.useFakeTimers();
    const { rerender, constraints } = setup({ center: [0, 0], zoom: 1 }, 600);

    act(() => {
      rerender({ center: [0, 0], zoom: 6 });
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(constraints[constraints.length - 1]).toBe(6);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(constraints[constraints.length - 1]).toBe(6);

    vi.useRealTimers();
  });

  it("возвращает текущий зум в границы после перелёта на большой зум", () => {
    vi.useFakeTimers();
    const { rerender, constraints } = setup({ center: [0, 0], zoom: 6 }, 600);

    act(() => {
      rerender({ center: [0, 0], zoom: 1.5 });
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Иначе d3-zoom продолжил бы разрешать сдвиг по границам зума 6.
    expect(constraints[constraints.length - 1]).toBe(1.5);

    vi.useRealTimers();
  });

  it("не анимирует микросдвиг от жеста мыши", () => {
    const { rerender, views, last } = setup({ center: [0, 0], zoom: 4.5 });

    rerender({ center: [0.001, 0.001], zoom: 4.5 });

    // Один кадр на смену пропсов — перехода не было.
    expect(views.length).toBeLessThanOrEqual(3);
    expect(last().center[0]).toBe(0.001);
  });

  it("ставит значение сразу при нулевой длительности", () => {
    const { rerender, views, last } = setup({ center: [0, 0], zoom: 1 }, 0);

    rerender({ center: [120, -30], zoom: 5 });

    expect(last()).toEqual({ center: [120, -30], zoom: 5 });
    // Промежуточных кадров не было: значение прыгнуло целиком.
    expect(views.every((view) => view.center[0] === 0 || view.center[0] === 120)).toBe(true);
  });

  it("фиксирует результат жеста без перехода", () => {
    const { rerender, snaps, last } = setup({ center: [-40, 20], zoom: 5 });

    // Жест мыши приводит d3-zoom к этой точке мгновенно.
    snaps[snaps.length - 1]({ center: [-40.06, 19.98], zoom: 5 });
    rerender({ center: [-40.06, 19.98], zoom: 5 });

    expect(last()).toEqual({ center: [-40.06, 19.98], zoom: 5 });
  });

  it("переходит без анимации, если пользователь отключил движение", () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });

    vi.stubGlobal("matchMedia", matchMedia);
    window.matchMedia = matchMedia;

    const { rerender, views, last } = setup({ center: [0, 0], zoom: 1 });

    rerender({ center: [120, -30], zoom: 5 });

    expect(last()).toEqual({ center: [120, -30], zoom: 5 });
    expect(views.every((view) => view.center[0] === 0 || view.center[0] === 120)).toBe(true);

    vi.unstubAllGlobals();
  });

  it("идёт по кратчайшей долготе через полусферу", () => {
    vi.useFakeTimers();
    const { rerender, last } = setup({ center: [170, 0], zoom: 4 }, 600);

    act(() => {
      rerender({ center: [-170, 0], zoom: 4 });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 20° на запад, а не 340° на восток.
    expect(last().center[0]).toBeGreaterThan(170);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(last().center[0]).toBeCloseTo(-170, 5);

    vi.useRealTimers();
  });
});
