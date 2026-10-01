const numberFormatter = new Intl.NumberFormat("ru-RU");

export function formatPopulation(value?: number): string {
  if (value === undefined) {
    return "нет данных";
  }

  return `${numberFormatter.format(value)} чел.`;
}

export function formatArea(value?: number): string {
  if (value === undefined) {
    return "нет данных";
  }

  return `${numberFormatter.format(value)} км²`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}° ${latitude >= 0 ? "с.ш." : "ю.ш."}`;
  const lon = `${Math.abs(longitude).toFixed(2)}° ${longitude >= 0 ? "в.д." : "з.д."}`;
  return `${lat}, ${lon}`;
}