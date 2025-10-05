# Weather App

## Overview
A lightweight weather web app built with HTML, CSS and vanilla JavaScript.  
Fetches current weather and a 5-day forecast using the OpenWeatherMap API. Includes search, geolocation-based weather, and units toggle (°C / °F).

## Features
- Search weather by city name
- Use browser geolocation to get local weather
- Current weather with icon, description, feels, humidity and wind
- 5-day forecast (daily midday snapshots)
- Toggle between Celsius and Fahrenheit (persisted)
- Saves last searched city in localStorage
- Responsive layout for mobile and desktop

## How to run
1. Get a free API key from [OpenWeatherMap](https://openweathermap.org).  
2. Open `script.js`. Replace `PASTE_YOUR_OPENWEATHERMAP_API_KEY_HERE` with your API key.  
3. For best results, run a local server (recommended):
   - Using Python 3: `python -m http.server 8000`
   - Or Node: `npx http-server`
   - Or use VS Code Live Server extension  
   Then open `http://localhost:8000` (or the port you used).
4. Alternatively, you can open `index.html` directly in some browsers but some features (fetch from `file://`) may be blocked.

## File structure
