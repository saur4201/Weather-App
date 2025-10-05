/* ---------------------------
   Weather App - script.js
   ---------------------------
   Replace API_KEY with your OpenWeatherMap key
*/
const API_KEY = "eba1d4d96a5bc612c019fad36c28eb3d"; // <-- replace this

// DOM elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const unitBtn = document.getElementById("unitBtn");
const messageEl = document.getElementById("message");

const currentCard = document.getElementById("currentWeather");
const weatherIcon = document.getElementById("weatherIcon");
const cityNameEl = document.getElementById("cityName");
const descriptionEl = document.getElementById("description");
const tempEl = document.getElementById("temp");
const unitLabelEl = document.getElementById("unitLabel");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const forecastSection = document.getElementById("forecast");
const forecastList = document.getElementById("forecastList");

// App state in memory
let units = localStorage.getItem("weather_units") || "metric"; // "metric" or "imperial"
let lastCity = localStorage.getItem("weather_last_city") || null;

// Utility: format temperature value
function formatTemp(val) {
  // round to 1 decimal if needed
  return Math.round(val * 10) / 10;
}

// Utility: show messages (loading / errors)
function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#b91c1c" : "#374151";
  if (!text) messageEl.style.color = "#374151";
}

// Show/hide element helpers
function showElement(el) { el.classList.remove("hidden"); }
function hideElement(el) { el.classList.add("hidden"); }

// Build current weather UI
function displayCurrent(data) {
  const { name } = data;
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;
  const temp = data.main.temp;
  const feels = data.main.feels_like;
  const humidity = data.main.humidity;
  const wind = data.wind.speed;
  const country = data.sys?.country || "";

  cityNameEl.textContent = `${name}${country ? ", " + country : ""}`;
  descriptionEl.textContent = desc[0].toUpperCase() + desc.slice(1);
  tempEl.textContent = formatTemp(temp);
  unitLabelEl.textContent = units === "metric" ? "°C" : "°F";
  feelsEl.textContent = `${formatTemp(feels)}${units === "metric" ? "°C" : "°F"}`;
  humidityEl.textContent = humidity;
  windEl.textContent = (units === "metric") ? `${wind} m/s` : `${wind} mph`;

  weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  weatherIcon.alt = data.weather[0].description;

  showElement(currentCard);
}

// Build forecast UI - choose midday entries
function displayForecast(forecastData) {
  // forecastData.list is an array of 3-hour entries
  // choose entries with time "12:00:00" (midday) for the next days
  const list = forecastData.list || [];
  const middayItems = list.filter(item => item.dt_txt.includes("12:00:00"));

  // sometimes the API response timezone may mean first day lacks 12:00 entry
  // safeguard: if fewer than 5 midday entries, pick next available distinct days
  let items = middayItems.slice(0, 5);
  if (items.length < 5) {
    // pick by unique date
    const byDate = {};
    for (const it of list) {
      const date = it.dt_txt.split(" ")[0];
      if (!byDate[date]) byDate[date] = it;
    }
    items = Object.values(byDate).slice(0, 5);
  }

  // clear old
  forecastList.innerHTML = "";

  // create cards
  items.forEach(item => {
    const dt = new Date(item.dt_txt);
    const dayName = dt.toLocaleDateString(undefined, { weekday: "short" }); // e.g., Mon, Tue
    const icon = item.weather[0].icon;
    const temp = item.main.temp;

    const card = document.createElement("div");
    card.className = "forecast-item";
    card.innerHTML = `
      <div class="day">${dayName}</div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${item.weather[0].description}" />
      <div class="temp">${formatTemp(temp)} ${units === "metric" ? "°C" : "°F"}</div>
      <div class="desc">${item.weather[0].main}</div>
    `;
    forecastList.appendChild(card);
  });

  showElement(forecastSection);
}

/* ----------------------------
   Fetch functions
   ---------------------------- */

// Generic fetch helper: returns parsed JSON or throws
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${errText}`);
  }
  return res.json();
}

// Current weather by city name
async function getWeatherByCity(city) {
  showMessage("Loading...");
  hideElement(currentCard);
  hideElement(forecastSection);

  try {
    const cwUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;
    const currentData = await fetchJson(cwUrl);
    displayCurrent(currentData);

    // fetch forecast by coords for better accuracy
    const { coord } = currentData;
    if (coord) {
      const fcUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coord.lat}&lon=${coord.lon}&units=${units}&appid=${API_KEY}`;
      const forecastData = await fetchJson(fcUrl);
      displayForecast(forecastData);
    } else {
      hideElement(forecastSection);
    }

    showMessage("");
    lastCity = city;
    localStorage.setItem("weather_last_city", lastCity);
  } catch (err) {
    console.error(err);
    showMessage("Could not fetch weather. Please check city name or your API key.", true);
    hideElement(currentCard);
    hideElement(forecastSection);
  }
}

// Weather by geographic coordinates (geolocation)
async function getWeatherByCoords(lat, lon) {
  showMessage("Loading...");
  hideElement(currentCard);
  hideElement(forecastSection);

  try {
    const cwUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const currentData = await fetchJson(cwUrl);
    displayCurrent(currentData);

    const fcUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const forecastData = await fetchJson(fcUrl);
    displayForecast(forecastData);

    showMessage("");
    // store the returned city name for later convenience
    lastCity = currentData.name;
    localStorage.setItem("weather_last_city", lastCity);
  } catch (err) {
    console.error(err);
    showMessage("Could not fetch weather for your location. Try searching instead.", true);
    hideElement(currentCard);
    hideElement(forecastSection);
  }
}

/* ----------------------------
   Event handlers
   ---------------------------- */

searchBtn.addEventListener("click", () => {
  const q = cityInput.value.trim();
  if (!q) {
    showMessage("Please type a city name.", true);
    return;
  }
  getWeatherByCity(q);
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("Geolocation not supported by your browser.", true);
    return;
  }
  showMessage("Getting your location...");
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      getWeatherByCoords(latitude, longitude);
    },
    err => {
      console.error(err);
      showMessage("Location permission denied or unavailable.", true);
    },
    { timeout: 10000 }
  );
});

// Toggle units (Celsius / Fahrenheit)
unitBtn.addEventListener("click", () => {
  units = (units === "metric") ? "imperial" : "metric";
  unitBtn.textContent = units === "metric" ? "°C" : "°F";
  localStorage.setItem("weather_units", units);

  // reload last city if present
  if (lastCity) {
    getWeatherByCity(lastCity);
  }
});

/* ----------------------------
   Initialization
   ---------------------------- */

function initUI() {
  unitBtn.textContent = units === "metric" ? "°C" : "°F";
  if (lastCity) cityInput.value = lastCity;
}

async function init() {
  if (API_KEY === "PASTE_YOUR_OPENWEATHERMAP_API_KEY_HERE") {
    showMessage("Please set your OpenWeatherMap API key in script.js", true);
    return;
  }
  initUI();

  // Load last city weather on startup, otherwise show example or remain empty
  if (lastCity) {
    await getWeatherByCity(lastCity);
  } else {
    showMessage("Type a city and press Search, or use My Location.");
  }
}

init();
