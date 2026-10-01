import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

interface FakeSvgElement extends SVGElement {
  getScreenCTM?: () => unknown;
  getBBox?: () => unknown;
}

/**
 * jsdom не реализует часть SVG API, которые нужны d3-zoom
 * (getScreenCTM) и геометрии d3-geo (getBBox).
 */
function patchSvgPrototype(): void {
  if (typeof SVGElement === "undefined") {
    return;
  }

  const proto = SVGElement.prototype as FakeSvgElement;

  if (!proto.getScreenCTM) {
    proto.getScreenCTM = function getScreenCTM() {
      return {
        inverse: () => ({ x: 0, y: 0 }),
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      };
    };
  }

  if (!proto.getBBox) {
    proto.getBBox = function getBBox() {
      return { x: 0, y: 0, width: 1000, height: 560 };
    };
  }
}

patchSvgPrototype();

/**
 * d3-zoom при старте перетаскивания обращается к event.view.document.
 * Синтетические события user-event получают собственное свойство view = null
 * (патч прототипа UIEvent их не покрывает), из-за чего d3-drag падает.
 * Такие события отсекаются на фазе capture, чтобы d3-zoom не стартовал
 * перетаскивание в jsdom, где оно всё равно не проверяется.
 */
window.addEventListener(
  "mousedown",
  (event) => {
    if ((event as MouseEvent).view === null) {
      event.stopPropagation();
    }
  },
  true,
);

if (!window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}