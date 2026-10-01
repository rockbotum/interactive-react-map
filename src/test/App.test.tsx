import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Topology } from "topojson-specification";
import { countries } from "../data/countries";
import { DEFAULT_ZOOM } from "../features/countries/selectors";
import { createTestTopology, installFailingFetchMock, installFetchMock } from "./fixtures";
import { App } from "../app/App";

/** Ожидает отрисовки слоя стран и возвращает настроенный user-event. */
async function renderApp() {
  const user = userEvent.setup();
  const view = render(<App />);
  await screen.findByRole("button", { name: /Россия \(Russia\)/ });
  return { user, ...view };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("отрисовывает заголовок и карту", async () => {
    installFetchMock();
    await renderApp();

    expect(screen.getByRole("heading", { name: /Британская империя/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Карта Британской империи" })).toBeInTheDocument();
  });

  it("показывает интерактивную страну из карты", async () => {
    installFetchMock();
    await renderApp();

    const shape = screen.getByRole("button", { name: /Россия \(Russia\)/ });
    expect(shape).toBeInTheDocument();
  });

  it("показывает территорию без описания как неинтерактивную", async () => {
    installFetchMock();
    await renderApp();

    const label = screen.getByLabelText(/Testland/);

    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute("role", "button");
    expect(label).toHaveAttribute("tabindex", "-1");
  });

  it("открывает панель страны по клику", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.click(screen.getByRole("button", { name: /Россия \(Russia\)/ }));

    const panel = screen.getByRole("complementary", { name: /Россия/ });
    expect(within(panel).getByRole("heading", { name: "Россия" })).toBeInTheDocument();
    expect(within(panel).getByText(/Крупнейшая страна мира/)).toBeInTheDocument();
  });

  it("открывает страну по нажатию Enter", async () => {
    installFetchMock();
    const { user } = await renderApp();

    const shape = screen.getByRole("button", { name: /Россия \(Russia\)/ });
    shape.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("complementary", { name: /Россия/ }),
    ).toBeInTheDocument();
  });

  it("закрывает панель страны", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.click(screen.getByRole("button", { name: /Россия \(Russia\)/ }));
    await user.click(screen.getByRole("button", { name: "Закрыть панель страны" }));

    expect(screen.getByRole("heading", { name: "Выберите страну" })).toBeInTheDocument();
  });

  it("фильтрует страны по столице через поиск", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.type(screen.getByRole("searchbox", { name: "Поиск страны" }), "москва");

    await waitFor(() => {
      expect(
        screen.getByText(`Найдено стран: 1 из ${countries.length}`),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /Франция \(France\)/ })).not.toBeInTheDocument();
  });

  it("сообщает об отсутствии результатов поиска", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.type(
      screen.getByRole("searchbox", { name: "Поиск страны" }),
      "несуществующая страна",
    );

    await waitFor(() => {
      expect(
        screen.getByText(`Найдено стран: 0 из ${countries.length}`),
      ).toBeInTheDocument();
    });
  });

  it("фильтрует страны по континенту", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.selectOptions(screen.getByRole("combobox", { name: "Континент" }), "south-america");

    await waitFor(() => {
      expect(screen.getByText(/Подходящих стран: 5/)).toBeInTheDocument();
    });
  });

  it("сбрасывает фильтры отдельной кнопкой", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.selectOptions(screen.getByRole("combobox", { name: "Континент" }), "africa");
    await waitFor(() => {
      expect(screen.getByText(/Подходящих стран:/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Сбросить фильтры" }));

    expect(screen.getByText("Фильтры не применены")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Континент" })).toHaveValue("");
  });

  it("сбрасывает карту кнопкой на карте", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.click(screen.getByRole("button", { name: /Россия \(Russia\)/ }));
    await user.click(screen.getByRole("button", { name: "Увеличить масштаб" }));
    expect(screen.getByText(`Масштаб: ${(DEFAULT_ZOOM + 0.5).toFixed(1)}×`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сбросить карту" }));

    expect(screen.getByText(`Масштаб: ${DEFAULT_ZOOM.toFixed(1)}×`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Выберите страну" })).toBeInTheDocument();
  });

  it("не позволяет уменьшить масштаб ниже единицы", async () => {
    installFetchMock();
    const { user } = await renderApp();

    expect(screen.getByRole("button", { name: "Уменьшить масштаб" })).toBeEnabled();

    for (let i = 0; i < 12; i += 1) {
      const button = screen.getByRole("button", { name: "Уменьшить масштаб" });

      if (button.hasAttribute("disabled")) {
        break;
      }

      await user.click(button);
    }

    expect(screen.getByText("Масштаб: 1.0×")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Уменьшить масштаб" })).toBeDisabled();
  });

  it("выбирает объект из списка в панели страны", async () => {
    installFetchMock();
    const { user } = await renderApp();

    await user.click(screen.getByRole("button", { name: /Россия \(Russia\)/ }));

    const panel = screen.getByRole("complementary", { name: /Россия/ });
    await user.click(within(panel).getByRole("button", { name: /Казань/ }));

    expect(within(panel).getByRole("button", { name: /Казань/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("показывает состояние ошибки, если файл карты недоступен", async () => {
    installFailingFetchMock();

    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Не удалось загрузить файл карты/);
  });

  it("выводит все страны статических данных в заголовке приложения", async () => {
    installFetchMock();
    await renderApp();

    expect(screen.getByText(`Доступно стран с описанием: ${countries.length}`)).toBeInTheDocument();
  });

  it("отрисовывает маркеры локаций всех типов по умолчанию", async () => {
    installFetchMock();
    await renderApp();

    expect(screen.getByRole("button", { name: "Москва, Столица" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Казань, Город" })).toBeInTheDocument();
  });

  it("подсвечивает совпадения только при активном фильтре", async () => {
    installFetchMock();
    const { container, user } = await renderApp();

    const matched = () => container.querySelectorAll("path[class*='matched']").length;

    expect(matched()).toBe(0);

    await user.type(screen.getByRole("searchbox", { name: "Поиск страны" }), "москва");

    await waitFor(() => {
      expect(matched()).toBe(1);
    });
  });
});

describe("файл карты", () => {
  it("использует TopoJSON-структуру в тестовой фикстуре", () => {
    const topology = createTestTopology() as unknown as Topology & {
    objects: { countries: { geometries: unknown[] } };
  };

    expect(topology.type).toBe("Topology");
    expect(topology.objects.countries.geometries).toHaveLength(3);
  });
});