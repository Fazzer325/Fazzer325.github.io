  const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_CODES = new Map([
  [0, ['Despejado', 'sun', 'moon']],
  [1, ['Mayormente despejado', 'sun', 'moon']],
  [2, ['Parcialmente nublado', 'partly-cloudy', 'cloud-moon']],
  [3, ['Cubierto', 'cloud', 'cloud-moon']],
  [45, ['Niebla', 'fog', 'fog']],
  [48, ['Niebla con escarcha', 'fog', 'fog']],
  [51, ['Llovizna ligera', 'drizzle', 'drizzle']],
  [53, ['Llovizna moderada', 'drizzle', 'drizzle']],
  [55, ['Llovizna intensa', 'rain', 'rain']],
  [56, ['Llovizna helada', 'sleet', 'sleet']],
  [57, ['Llovizna helada intensa', 'sleet', 'sleet']],
  [61, ['Lluvia ligera', 'rain', 'rain']],
  [63, ['Lluvia moderada', 'rain', 'rain']],
  [65, ['Lluvia intensa', 'rain', 'rain']],
  [66, ['Lluvia helada', 'sleet', 'sleet']],
  [67, ['Lluvia helada intensa', 'sleet', 'sleet']],
  [71, ['Nevada ligera', 'snow', 'snow']],
  [73, ['Nevada moderada', 'snow', 'snow']],
  [75, ['Nevada intensa', 'snow', 'snow']],
  [77, ['Granos de nieve', 'snow', 'snow']],
  [80, ['Chubascos ligeros', 'rain', 'rain']],
  [81, ['Chubascos moderados', 'rain', 'rain']],
  [82, ['Chubascos fuertes', 'rain', 'rain']],
  [85, ['Chubascos de nieve', 'snow', 'snow']],
  [86, ['Chubascos de nieve fuertes', 'snow', 'snow']],
  [95, ['Tormenta eléctrica', 'storm', 'storm']],
  [96, ['Tormenta con granizo', 'storm', 'storm']],
  [99, ['Tormenta con granizo fuerte', 'storm', 'storm']]
]);

export function buildForecastUrl({ latitude, longitude }) {
  const url = new URL(FORECAST_ENDPOINT);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '1'
  }).toString();
  return url.toString();
}

export function describeWeather(code, isDay) {
  const [label, dayIcon, nightIcon] = WEATHER_CODES.get(Number(code)) ?? [
    'Condición variable',
    'cloud',
    'cloud'
  ];

  return { label, icon: isDay ? dayIcon : nightIcon };
}

function localTime(isoValue) {
  if (typeof isoValue !== 'string' || !isoValue.includes('T')) return '—';
  return isoValue.split('T')[1].slice(0, 5);
}

function hasFiniteMeasurements(values) {
  return values.every((value) => typeof value === 'number' && Number.isFinite(value));
}

function hasIsoTime(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

export function normalizeWeather(response) {
  const current = response?.current;
  const daily = response?.daily;

  const measurements = current && daily ? [
    current.temperature_2m,
    current.relative_humidity_2m,
    current.apparent_temperature,
    current.is_day,
    current.weather_code,
    current.wind_speed_10m,
    daily.temperature_2m_max?.[0],
    daily.temperature_2m_min?.[0]
  ] : [];

  const times = current && daily ? [
    current.time,
    daily.sunrise?.[0],
    daily.sunset?.[0]
  ] : [];

  if (
    !current ||
    !daily ||
    measurements.length === 0 ||
    !hasFiniteMeasurements(measurements) ||
    times.length === 0 ||
    !times.every(hasIsoTime)
  ) {
    throw new Error('Respuesta meteorológica incompleta');
  }

  const condition = describeWeather(current.weather_code, Boolean(current.is_day));

  return {
    temperature: Math.round(current.temperature_2m),
    apparentTemperature: Math.round(current.apparent_temperature),
    humidity: Math.round(current.relative_humidity_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    high: Math.round(daily.temperature_2m_max[0]),
    low: Math.round(daily.temperature_2m_min[0]),
    observedAt: localTime(current.time),
    sunrise: localTime(daily.sunrise?.[0]),
    sunset: localTime(daily.sunset?.[0]),
    timezone: response.timezone_abbreviation || response.timezone || 'Hora local',
    condition: condition.label,
    icon: condition.icon
  };
}
