import { buildForecastUrl, normalizeWeather } from './weather-core.mjs';

const CITIES = {
    mexico: { name: 'Ciudad de México', country: 'México', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City' },
    madrid: { name: 'Madrid', country: 'España', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid' },
    tokyo: { name: 'Tokio', country: 'Japón', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
    bogota: { name: 'Bogotá', country: 'Colombia', latitude: 4.711, longitude: -74.0721, timezone: 'America/Bogota' },
    washington: { name: 'Washington D. C.', country: 'Estados Unidos', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York' }
};

const iconParts = {
    sun: '<circle cx="50" cy="50" r="18"/><path d="M50 9v13M50 78v13M9 50h13M78 50h13M21 21l9 9M70 70l9 9M79 21l-9 9M30 70l-9 9"/>',
    moon: '<path d="M70 72A34 34 0 0 1 38 20a33 33 0 1 0 32 52Z"/>',
    cloud: '<path d="M27 70h48a18 18 0 0 0 2-36 28 28 0 0 0-53 10A14 14 0 0 0 27 70Z"/>',
    'cloud-moon': '<path d="M68 37A24 24 0 0 1 48 16a23 23 0 0 0 28 28M25 72h48a15 15 0 0 0 1-30 23 23 0 0 0-43 8 11 11 0 0 0-6 22Z"/>',
    'partly-cloudy': '<circle cx="35" cy="33" r="15"/><path d="M35 9v8M12 33h8M18 16l6 6M52 16l-6 6M27 76h49a16 16 0 0 0 1-32 24 24 0 0 0-45 9 12 12 0 0 0-5 23Z"/>',
    fog: '<path d="M22 40h56M14 52h56M26 64h60M18 76h48"/>',
    drizzle: '<path d="M27 58h48a17 17 0 0 0 2-34 26 26 0 0 0-49 10A13 13 0 0 0 27 58ZM35 71l-4 8M52 71l-4 8M69 71l-4 8"/>',
    rain: '<path d="M27 55h48a17 17 0 0 0 2-34 26 26 0 0 0-49 10A13 13 0 0 0 27 55ZM37 68l-6 13M55 68l-6 13M73 68l-6 13"/>',
    sleet: '<path d="M27 53h48a17 17 0 0 0 2-34 26 26 0 0 0-49 10A13 13 0 0 0 27 53ZM35 67l-4 9M58 66v15M52 70l12 7M64 70l-12 7"/>',
    snow: '<path d="M27 50h48a17 17 0 0 0 2-34 26 26 0 0 0-49 10A13 13 0 0 0 27 50ZM35 65v18M27 70l16 9M43 70l-16 9M66 65v18M58 70l16 9M74 70l-16 9"/>',
    storm: '<path d="M27 51h48a17 17 0 0 0 2-34 26 26 0 0 0-49 10A13 13 0 0 0 27 51ZM54 58 41 76h12l-5 15 17-22H53l1-11Z"/>'
};

const elements = {
    stage: document.querySelector('#weatherStage'),
    select: document.querySelector('#citySelect'),
    refresh: document.querySelector('#refreshButton'),
    cityName: document.querySelector('#cityName'),
    cityCountry: document.querySelector('#cityCountry'),
    weatherIcon: document.querySelector('#weatherIcon'),
    temperature: document.querySelector('#temperature span'),
    condition: document.querySelector('#condition'),
    highLow: document.querySelector('#highLow'),
    feelsLike: document.querySelector('#feelsLike'),
    humidity: document.querySelector('#humidity'),
    wind: document.querySelector('#wind'),
    sunrise: document.querySelector('#sunrise'),
    sunset: document.querySelector('#sunset'),
    timezone: document.querySelector('#timezone'),
    date: document.querySelector('#dateLabel'),
    updated: document.querySelector('#updatedLabel'),
    status: document.querySelector('#statusMessage span:last-child')
};

let activeRequest;

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderIcon(icon) {
    const paths = iconParts[icon] || iconParts.cloud;
    elements.weatherIcon.innerHTML = `
        <svg viewBox="0 0 100 100" role="img" aria-label="Icono de condición meteorológica">
            <defs>
                <linearGradient id="weather-stroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#edf7ff"/>
                    <stop offset="1" stop-color="#8fb7e7"/>
                </linearGradient>
            </defs>
            ${paths}
        </svg>`;
}

function renderCity(city) {
    elements.cityName.textContent = city.name;
    elements.cityCountry.textContent = city.country.toUpperCase();
    elements.date.textContent = capitalize(new Intl.DateTimeFormat('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: city.timezone
    }).format(new Date()));
}

function renderWeather(weather, city) {
    elements.temperature.textContent = weather.temperature;
    elements.condition.textContent = weather.condition;
    elements.highLow.textContent = `Máx. ${weather.high}° · Mín. ${weather.low}°`;
    elements.feelsLike.textContent = `${weather.apparentTemperature}°`;
    elements.humidity.textContent = `${weather.humidity}%`;
    elements.wind.innerHTML = `${weather.windSpeed} <small>km/h</small>`;
    elements.sunrise.textContent = weather.sunrise;
    elements.sunset.textContent = weather.sunset;
    elements.timezone.textContent = weather.timezone;
    elements.updated.textContent = `Observado a las ${weather.observedAt}`;
    elements.status.textContent = `${city.name}: ${weather.temperature}°, ${weather.condition}. Datos actualizados.`;
    renderIcon(weather.icon);
}

function resetWeatherFields() {
    elements.temperature.textContent = '--';
    elements.condition.textContent = 'Consultando atmósfera…';
    elements.highLow.textContent = 'Máx. --° · Mín. --°';
    elements.feelsLike.textContent = '--°';
    elements.humidity.textContent = '--%';
    elements.wind.innerHTML = '-- <small>km/h</small>';
    elements.sunrise.textContent = '--:--';
    elements.sunset.textContent = '--:--';
    elements.timezone.textContent = '---';
    elements.updated.textContent = 'Esperando datos…';
    renderIcon('cloud');
}

function renderLoading(city) {
    elements.stage.dataset.state = 'loading';
    elements.refresh.disabled = true;
    resetWeatherFields();
    elements.status.textContent = `Consultando el cielo de ${city.name}…`;
    renderCity(city);
}

function renderError() {
    elements.stage.dataset.state = 'error';
    elements.condition.textContent = 'No pudimos actualizar el clima';
    elements.updated.textContent = 'Conexión no disponible';
    elements.status.textContent = 'Revisa tu conexión y pulsa Actualizar para intentarlo de nuevo.';
    renderIcon('cloud');
}

async function loadWeather() {
    const city = CITIES[elements.select.value] || CITIES.mexico;

    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    renderLoading(city);

    try {
        const response = await fetch(buildForecastUrl(city), { signal: request.signal });
        if (!response.ok) throw new Error(`Open-Meteo respondió con ${response.status}`);

        renderWeather(normalizeWeather(await response.json()), city);
        elements.stage.dataset.state = 'ready';
    } catch (error) {
        if (error.name !== 'AbortError') renderError();
    } finally {
        if (activeRequest === request) elements.refresh.disabled = false;
    }
}

elements.select.addEventListener('change', loadWeather);
elements.refresh.addEventListener('click', loadWeather);

renderIcon('partly-cloudy');
loadWeather();
