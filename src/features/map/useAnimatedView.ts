import { useEffect, useRef, useState } from "react";

export interface MapView {
  center: [number, number];
  zoom: number;
}

export interface AnimatedMapView extends MapView {
  /**
   * Зум, по которому считаются границы сдвига. Пока идёт переход, берётся
   * максимум из начального и конечного зума: иначе d3-zoom обрезает карту
   * по ещё не доехавшему зуму и движение идёт рывками.
   */
  constraintZoom: number;
}

/** Длительность перехода к цели в миллисекундах. */
export const VIEW_TRANSITION_DURATION = 620;

/** Ниже этого сдвига переход незаметен — значение проще поставить сразу. */
const ZOOM_EPSILON = 0.001;
const CENTER_EPSILON = 0.01;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Кубическая плавность: быстрый разгон и мягкое торможение. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Приводит долготу к диапазону [-180, 180], не трогая значения внутри него. */
function normalizeLon(lon: number): number {
  if (lon >= -180 && lon < 180) {
    return lon;
  }

  return (((lon + 180) % 360) + 360) % 360 - 180;
}

/** Кратчайший путь по долготе: перелёт через Атлантику в 350° не нужен. */
function shortestDeltaLon(from: number, to: number): number {
  return normalizeLon(to - from);
}

function sameView(a: MapView, b: MapView): boolean {
  return a.center[0] === b.center[0] && a.center[1] === b.center[1] && a.zoom === b.zoom;
}

function isAlmostThere(a: MapView, b: MapView): boolean {
  return (
    Math.abs(a.center[0] - b.center[0]) < CENTER_EPSILON &&
    Math.abs(a.center[1] - b.center[1]) < CENTER_EPSILON &&
    Math.abs(a.zoom - b.zoom) < ZOOM_EPSILON
  );
}

export interface UseAnimatedViewResult {
  view: AnimatedMapView;
  /**
   * Мгновенно ставит вид без перехода. Нужно после жеста мыши: карту уже
   * увеличает d3-zoom, состояние просто фиксирует результат жеста.
   */
  snap: (next: MapView) => void;
}

/**
 * Плавно доводит карту до целевого центра и зума.
 *
 * Состояние приложения меняется мгновенно, а вид карты едет по кадрам:
 * так жесты мыши остаются отзывчивыми, а переход к объекту читается как
 * перелёт, а не как скачок.
 */
export function useAnimatedView(
  target: MapView,
  duration: number = VIEW_TRANSITION_DURATION,
): UseAnimatedViewResult {
  const [frame, setFrame] = useState<AnimatedMapView>({
    center: [normalizeLon(target.center[0]), target.center[1]],
    zoom: target.zoom,
    constraintZoom: target.zoom,
  });

  const frameRef = useRef<AnimatedMapView>(frame);
  const rafRef = useRef<number | null>(null);

  const targetLon = target.center[0];
  const targetLat = target.center[1];
  const targetZoom = target.zoom;

  /** Единственная точка записи состояния вида — из эффектов и обработчиков. */
  function commit(next: AnimatedMapView) {
    frameRef.current = next;
    setFrame(next);
  }

  function stop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function snap(next: MapView) {
    stop();
    commit({
      center: [normalizeLon(next.center[0]), next.center[1]],
      zoom: next.zoom,
      constraintZoom: next.zoom,
    });
  }

  useEffect(() => {
    const current = frameRef.current;
    const goal: AnimatedMapView = {
      center: [normalizeLon(targetLon), targetLat],
      zoom: targetZoom,
      constraintZoom: targetZoom,
    };

    if (sameView(current, goal)) {
      return;
    }

    // Жест мыши уже привёл карту к цели — анимировать нечего.
    if (isAlmostThere(current, goal) || duration <= 0 || prefersReducedMotion()) {
      stop();
      commit(goal);
      return;
    }

    const from = current;
    const deltaLon = shortestDeltaLon(from.center[0], targetLon);
    const deltaLat = targetLat - from.center[1];
    const deltaZoom = targetZoom - from.zoom;
    // На всё время перехода держим просторные границы сдвига.
    const constraintZoom = Math.max(from.zoom, targetZoom);
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOutCubic(progress);
      const isLast = progress >= 1;

      // Последний кадр ставим точно в цель, без ошибок интерполяции.
      commit(
        isLast
          ? goal
          : {
              center: [from.center[0] + deltaLon * eased, from.center[1] + deltaLat * eased],
              zoom: from.zoom + deltaZoom * eased,
              constraintZoom,
            },
      );

      rafRef.current = isLast ? null : requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return stop;
  }, [targetLon, targetLat, targetZoom, duration]);

  return { view: frame, snap };
}
