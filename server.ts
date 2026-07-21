import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// WMO Weather code mapping to readable descriptions and general conditions
function mapWmoCode(code: number): { descEn: string; descAr: string; condition: string } {
  switch (code) {
    case 0:
      return { descEn: "Clear Sky", descAr: "سماء صافية", condition: "sunny" };
    case 1:
    case 2:
    case 3:
      return { descEn: "Partly Cloudy", descAr: "غائم جزئياً", condition: "cloudy" };
    case 45:
    case 48:
      return { descEn: "Foggy", descAr: "ضبابي", condition: "fog" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { descEn: "Drizzle", descAr: "رذاذ مطر", condition: "rain" };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { descEn: "Rainy", descAr: "ممطر", condition: "rain" };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { descEn: "Snowy", descAr: "ثلجي", condition: "snow" };
    case 95:
    case 96:
    case 99:
      return { descEn: "Thunderstorm", descAr: "عاصفة رعدية", condition: "storm" };
    default:
      return { descEn: "Clear Sky", descAr: "صافي", condition: "sunny" };
  }
}

// Map US EPA Index (from WeatherAPI) to standard level descriptions
function getAqiDescription(index: number) {
  const levels = [
    { labelEn: "Good", labelAr: "جيد", color: "#22C55E", val: 1 },
    { labelEn: "Moderate", labelAr: "معتدل", color: "#F59E0B", val: 2 },
    { labelEn: "Unhealthy for Sensitive Groups", labelAr: "غير صحي للفئات الحساسة", color: "#F97316", val: 3 },
    { labelEn: "Unhealthy", labelAr: "غير صحي", color: "#EF4444", val: 4 },
    { labelEn: "Very Unhealthy", labelAr: "غير صحي جداً", color: "#7C3AED", val: 5 },
    { labelEn: "Hazardous", labelAr: "خطير جداً", color: "#7F1D1D", val: 6 }
  ];
  return levels[(index - 1) >= 0 && (index - 1) < 6 ? (index - 1) : 0];
}

const popularCities = [
  { name: "London", region: "England", country: "United Kingdom", lat: 51.5074, lon: -0.1278 },
  { name: "Dubai", region: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { name: "Tokyo", region: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Oslo", region: "Oslo", country: "Norway", lat: 59.9139, lon: 10.7522 },
  { name: "Cairo", region: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357 },
  { name: "New York", region: "New York", country: "United States", lat: 40.7128, lon: -74.0060 },
  { name: "Paris", region: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney", region: "New South Wales", country: "Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Riyadh", region: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lon: 46.6753 },
  { name: "Rome", region: "Lazio", country: "Italy", lat: 41.9028, lon: 12.4964 },
  { name: "Berlin", region: "Berlin", country: "Germany", lat: 52.5200, lon: 13.4050 },
  { name: "Moscow", region: "Moscow", country: "Russia", lat: 55.7558, lon: 37.6173 },
  { name: "Toronto", region: "Ontario", country: "Canada", lat: 43.6532, lon: -79.3832 },
  { name: "Singapore", region: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Mumbai", region: "Maharashtra", country: "India", lat: 19.0760, lon: 72.8777 }
];

function generateFallbackWeather(q: string | undefined, latStr?: string, lonStr?: string) {
  let name = q || "Local Area";
  let region = "";
  let country = "Earth";
  let lat = latStr ? parseFloat(latStr) : 51.5074;
  let lon = lonStr ? parseFloat(lonStr) : -0.1278;

  // If name is lat/lon coords, make it cleaner
  if (name.includes(",") && !isNaN(parseFloat(name.split(",")[0]))) {
    const parts = name.split(",");
    lat = parseFloat(parts[0]);
    lon = parseFloat(parts[1]);
    name = `Coords: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } else {
    const lowerName = name.toLowerCase().trim();
    const found = popularCities.find(c => c.name.toLowerCase() === lowerName);
    if (found) {
      name = found.name;
      region = found.region;
      country = found.country;
      lat = found.lat;
      lon = found.lon;
    }
  }

  // Capitalize name
  name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Create a seed based on the name length or sum of chars to make it consistent but varied
  const seed = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const conditions = [
    { textEn: "Mostly Sunny", textAr: "مشمس غالباً", code: 113, tempBase: 25, hum: 40, wind: 12, rain: 0, uv: 7, isSunny: true },
    { textEn: "Partly Cloudy", textAr: "غائم جزئياً", code: 116, tempBase: 19, hum: 55, wind: 15, rain: 5, uv: 5, isCloudy: true },
    { textEn: "Patchy Light Rain", textAr: "مطر خفيف متقطع", code: 263, tempBase: 14, hum: 80, wind: 18, rain: 60, uv: 2, isRainy: true },
    { textEn: "Moderate Rain", textAr: "مطر معتدل", code: 296, tempBase: 12, hum: 88, wind: 22, rain: 85, uv: 1, isRainy: true },
    { textEn: "Heavy Rain", textAr: "مطر غزير", code: 302, tempBase: 11, hum: 92, wind: 28, rain: 95, uv: 1, isRainy: true },
    { textEn: "Thundery Outbreaks", textAr: "عواصف رعدية متفرقة", code: 386, tempBase: 15, hum: 85, wind: 35, rain: 90, uv: 2, isStormy: true },
    { textEn: "Heavy Snow", textAr: "ثلوج غزيرة", code: 338, tempBase: -2, hum: 85, wind: 25, rain: 40, uv: 1, isSnowy: true },
    { textEn: "Foggy", textAr: "ضبابي", code: 248, tempBase: 8, hum: 95, wind: 5, rain: 10, uv: 1, isFoggy: true }
  ];

  // Pick condition based on seed
  const cond = conditions[seed % conditions.length];

  // Modify base temperature with some random offset based on current month/time
  const hour = new Date().getHours();
  const diurnalRange = 6 * Math.sin(((hour - 6) / 24) * 2 * Math.PI);
  const tempC = Math.round(cond.tempBase + diurnalRange);
  const tempF = Math.round(tempC * 1.8 + 32);

  // Hourly forecast
  const hourly: any[] = [];
  for (let i = 0; i < 24; i++) {
    const hr = (hour + i) % 24;
    const timeLabel = `${hr.toString().padStart(2, "0")}:00`;
    const tempOffset = 4 * Math.sin(((hr - 6) / 24) * 2 * Math.PI);
    const hTempC = Math.round(cond.tempBase + tempOffset);
    hourly.push({
      time: timeLabel,
      tempC: hTempC,
      tempF: Math.round(hTempC * 1.8 + 32),
      conditionCode: cond.code,
      conditionTextEn: cond.textEn,
      conditionIcon: "",
      rainChance: Math.max(0, cond.rain + Math.round(tempOffset * 3)),
      windKph: Math.round(cond.wind + Math.random() * 6 - 3)
    });
  }

  // 7-Day forecast
  const forecast: any[] = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysOfWeekAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const now = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNameEn = daysOfWeek[d.getDay()];
    const dayNameAr = daysOfWeekAr[d.getDay()];
    
    // Slight fluctuation
    const dSeed = seed + i;
    const dCond = conditions[dSeed % conditions.length];
    const dMaxC = Math.round(dCond.tempBase + 4 + (dSeed % 3));
    const dMinC = Math.round(dCond.tempBase - 3 - (dSeed % 3));

    forecast.push({
      date: dateStr,
      dayNameEn,
      dayNameAr,
      tempMaxC: dMaxC,
      tempMinC: dMinC,
      tempMaxF: Math.round(dMaxC * 1.8 + 32),
      tempMinF: Math.round(dMinC * 1.8 + 32),
      conditionTextEn: dCond.textEn,
      conditionTextAr: dCond.textAr,
      conditionIcon: "",
      humidity: dCond.hum,
      rainChance: dCond.rain,
      windKph: dCond.wind,
      uv: dCond.uv
    });
  }

  const epaIndex = Math.min(6, Math.max(1, Math.floor((cond.uv || 1) / 2) + 1));
  const aqiInfo = getAqiDescription(epaIndex);

  return {
    location: {
      name,
      region,
      country,
      lat,
      lon,
      localTime: new Date().toISOString().replace("T", " ").substring(0, 16)
    },
    current: {
      tempC,
      tempF,
      feelsLikeC: tempC - 1,
      feelsLikeF: tempF - 2,
      conditionTextEn: cond.textEn,
      conditionTextAr: cond.textAr,
      conditionIcon: "",
      conditionCode: cond.code,
      humidity: cond.hum,
      pressureMb: 1013,
      windKph: cond.wind,
      windDir: "N",
      windDegree: 0,
      visibilityKm: 10,
      cloudCover: cond.isSunny ? 10 : (cond.isCloudy ? 60 : 90),
      uvIndex: cond.uv,
      sunrise: "06:12 AM",
      sunset: "07:44 PM",
      moonPhase: "Waxing Gibbous",
      aqi: {
        index: epaIndex,
        labelEn: aqiInfo.labelEn,
        labelAr: aqiInfo.labelAr,
        color: aqiInfo.color
      }
    },
    hourly,
    forecast,
    dataSource: "Offline Weather Simulator"
  };
}

// 1. Search endpoint for autocompletion
app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const apiKey = process.env.WEATHER_API_KEY || process.env.WEATHER_API_KEY_FREE;

    if (apiKey) {
      // Use WeatherAPI search endpoint
      try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          const results = data.map((item: any) => ({
            name: item.name,
            region: item.region || "",
            country: item.country,
            lat: item.lat,
            lon: item.lon,
            id: `${item.lat},${item.lon}`
          }));
          return res.json(results);
        }
      } catch (e) {
        console.warn("WeatherAPI search failed, trying Open-Meteo...");
      }
    }

    // Fallback: Open-Meteo Geocoding API (free, keyless)
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData.results && Array.isArray(geoData.results)) {
          const results = geoData.results.map((item: any) => ({
            name: item.name,
            region: item.admin1 || "",
            country: item.country,
            lat: item.latitude,
            lon: item.longitude,
            id: `${item.latitude},${item.longitude}`
          }));
          return res.json(results);
        }
      }
    } catch (e) {
      console.warn("Open-Meteo search failed, trying local matching database...");
    }

    // Fallback 2: Local popular cities filtering
    const matched = popularCities.filter(c => 
      c.name.toLowerCase().includes(q.toLowerCase()) || 
      c.country.toLowerCase().includes(q.toLowerCase())
    ).map(c => ({
      name: c.name,
      region: c.region,
      country: c.country,
      lat: c.lat,
      lon: c.lon,
      id: `${c.lat},${c.lon}`
    }));

    return res.json(matched);
  } catch (error) {
    console.error("Search error:", error);
    return res.json([]);
  }
});

// 2. Main Weather details endpoint
app.get("/api/weather", async (req, res) => {
  const q = req.query.q as string;
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;

  try {
    if (!q && (!lat || !lon)) {
      return res.status(400).json({ error: "Location query or coordinates are required" });
    }

    const apiKey = process.env.WEATHER_API_KEY;

    if (apiKey) {
      // WeatherAPI structure has everything in one call
      try {
        const query = q ? q : `${lat},${lon}`;
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=7&aqi=yes`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          // Map WeatherAPI response to consolidated format
          const current = data.current;
          const location = data.location;
          const forecastDays = data.forecast.forecastday;
          const usEpaIndex = current.air_quality ? current.air_quality["us-epa-index"] : 1;
          const aqiInfo = getAqiDescription(usEpaIndex);

          const currentHour = new Date().getHours();
          // Consolidate hourly forecast for 24 hours (mix of today and tomorrow)
          let hourlyCombined: any[] = [];
          const todayHours = forecastDays[0]?.hour || [];
          const tomorrowHours = forecastDays[1]?.hour || [];
          const allHours = [...todayHours, ...tomorrowHours];
          
          // Find indices near current hour
          const startIndex = todayHours.length > currentHour ? currentHour : 0;
          hourlyCombined = allHours.slice(startIndex, startIndex + 24).map((h: any) => ({
            time: h.time.split(" ")[1], // HH:MM
            tempC: Math.round(h.temp_c),
            tempF: Math.round(h.temp_f),
            conditionCode: h.condition.code,
            conditionTextEn: h.condition.text,
            conditionIcon: h.condition.icon,
            rainChance: h.chance_of_rain || 0,
            windKph: h.wind_kph
          }));

          // 7-day forecast mapping
          const dailyForecast = forecastDays.map((fd: any) => {
            const date = new Date(fd.date);
            const dayNameEn = date.toLocaleDateString("en-US", { weekday: "long" });
            const dayNameAr = date.toLocaleDateString("ar-EG", { weekday: "long" });
            return {
              date: fd.date,
              dayNameEn,
              dayNameAr,
              tempMaxC: Math.round(fd.day.maxtemp_c),
              tempMinC: Math.round(fd.day.mintemp_c),
              tempMaxF: Math.round(fd.day.maxtemp_f),
              tempMinF: Math.round(fd.day.mintemp_f),
              conditionTextEn: fd.day.condition.text,
              conditionIcon: fd.day.condition.icon,
              humidity: fd.day.avghumidity,
              rainChance: fd.day.daily_chance_of_rain || 0,
              windKph: fd.day.maxwind_kph,
              uv: fd.day.uv
            };
          });

          const consolidated = {
            location: {
              name: location.name,
              region: location.region,
              country: location.country,
              lat: location.lat,
              lon: location.lon,
              localTime: location.localtime
            },
            current: {
              tempC: Math.round(current.temp_c),
              tempF: Math.round(current.temp_f),
              feelsLikeC: Math.round(current.feelslike_c),
              feelsLikeF: Math.round(current.feelslike_f),
              conditionTextEn: current.condition.text,
              conditionTextAr: current.condition.text, // Will translate client-side or use API
              conditionIcon: current.condition.icon,
              conditionCode: current.condition.code,
              humidity: current.humidity,
              pressureMb: current.pressure_mb,
              windKph: current.wind_kph,
              windDir: current.wind_dir,
              windDegree: current.wind_degree,
              visibilityKm: current.vis_km,
              cloudCover: current.cloud,
              uvIndex: current.uv,
              sunrise: forecastDays[0]?.astro?.sunrise || "06:00 AM",
              sunset: forecastDays[0]?.astro?.sunset || "06:00 PM",
              moonPhase: forecastDays[0]?.astro?.moon_phase || "New Moon",
              aqi: {
                index: usEpaIndex,
                labelEn: aqiInfo.labelEn,
                labelAr: aqiInfo.labelAr,
                color: aqiInfo.color
              }
            },
            hourly: hourlyCombined,
            forecast: dailyForecast,
            dataSource: "WeatherAPI"
          };

          return res.json(consolidated);
        } else {
          await response.json().catch(() => ({}));
          console.log("WeatherAPI non-ok status, using fallback API.");
        }
      } catch (e) {
        console.log("WeatherAPI connection issue, falling back to Open-Meteo...");
      }
    }

    // Fallback: Use free Open-Meteo API
    let targetLat = lat;
    let targetLon = lon;
    let cityName = q;
    let countryName = "";
    let regionName = "";

    if (q) {
      // Find coordinates first using Geocoding
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results[0]) {
            targetLat = geoData.results[0].latitude;
            targetLon = geoData.results[0].longitude;
            cityName = geoData.results[0].name;
            countryName = geoData.results[0].country || "";
            regionName = geoData.results[0].admin1 || "";
          } else {
            // Check local popular cities
            const cleanQ = q.trim().toLowerCase();
            const localMatch = popularCities.find(c => c.name.toLowerCase() === cleanQ);
            if (localMatch) {
              targetLat = String(localMatch.lat);
              targetLon = String(localMatch.lon);
              cityName = localMatch.name;
              countryName = localMatch.country;
              regionName = localMatch.region;
            } else {
              console.warn(`City "${q}" not found, generating simulated weather`);
              return res.json(generateFallbackWeather(q, lat, lon));
            }
          }
        } else {
          // Check local popular cities
          const cleanQ = q.trim().toLowerCase();
          const localMatch = popularCities.find(c => c.name.toLowerCase() === cleanQ);
          if (localMatch) {
            targetLat = String(localMatch.lat);
            targetLon = String(localMatch.lon);
            cityName = localMatch.name;
            countryName = localMatch.country;
            regionName = localMatch.region;
          } else {
            console.warn("Geocoding failed and no local match found, using fallback simulator");
            return res.json(generateFallbackWeather(q, lat, lon));
          }
        }
      } catch (e) {
        console.warn("Geocoding failed with error, checking local popular cities...");
        const cleanQ = q.trim().toLowerCase();
        const localMatch = popularCities.find(c => c.name.toLowerCase() === cleanQ);
        if (localMatch) {
          targetLat = String(localMatch.lat);
          targetLon = String(localMatch.lon);
          cityName = localMatch.name;
          countryName = localMatch.country;
          regionName = localMatch.region;
        } else {
          return res.json(generateFallbackWeather(q, lat, lon));
        }
      }
    } else {
      cityName = `Coords: ${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)}`;
    }

    // Call Open-Meteo forecast API
    try {
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const weatherRes = await fetch(forecastUrl);
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        
        const current = weatherData.current;
        const hourly = weatherData.hourly;
        const daily = weatherData.daily;

        // Map current condition code
        const currentMapping = mapWmoCode(current.weather_code);

        // Create hourly forecast
        const hourlyList: any[] = [];
        const currentHourIdx = new Date().getHours();
        for (let i = currentHourIdx; i < currentHourIdx + 24; i++) {
          if (hourly.time[i]) {
            const hourTime = hourly.time[i].split("T")[1]; // HH:MM
            hourlyList.push({
              time: hourTime,
              tempC: Math.round(hourly.temperature_2m[i]),
              tempF: Math.round(hourly.temperature_2m[i] * 1.8 + 32),
              conditionCode: hourly.weather_code[i],
              conditionTextEn: mapWmoCode(hourly.weather_code[i]).descEn,
              conditionIcon: "", // Determined dynamically in React
              rainChance: hourly.precipitation_probability[i] || 0,
              windKph: Math.round(hourly.wind_speed_10m[i])
            });
          }
        }

        // Create 7-day forecast
        const dailyList = daily.time.map((timeStr: string, index: number) => {
          const date = new Date(timeStr);
          const dayNameEn = date.toLocaleDateString("en-US", { weekday: "long" });
          const dayNameAr = date.toLocaleDateString("ar-EG", { weekday: "long" });
          const wmoMap = mapWmoCode(daily.weather_code[index]);
          return {
            date: timeStr,
            dayNameEn,
            dayNameAr,
            tempMaxC: Math.round(daily.temperature_2m_max[index]),
            tempMinC: Math.round(daily.temperature_2m_min[index]),
            tempMaxF: Math.round(daily.temperature_2m_max[index] * 1.8 + 32),
            tempMinF: Math.round(daily.temperature_2m_min[index] * 1.8 + 32),
            conditionTextEn: wmoMap.descEn,
            conditionTextAr: wmoMap.descAr,
            conditionIcon: "", // Determined dynamically in React
            humidity: 65, // default
            rainChance: daily.precipitation_probability_max[index] || 0,
            windKph: Math.round(daily.wind_speed_10m_max[index]),
            uv: daily.uv_index_max[index]
          };
        });

        const epaIndex = Math.min(6, Math.max(1, Math.floor((current.uv_index || 1) / 2) + 1));
        const aqiInfo = getAqiDescription(epaIndex);

        const consolidated = {
          location: {
            name: cityName,
            region: regionName,
            country: countryName || "Unknown",
            lat: parseFloat(targetLat as string),
            lon: parseFloat(targetLon as string),
            localTime: new Date().toLocaleTimeString("en-US", { hour12: false })
          },
          current: {
            tempC: Math.round(current.temperature_2m),
            tempF: Math.round(current.temperature_2m * 1.8 + 32),
            feelsLikeC: Math.round(current.apparent_temperature),
            feelsLikeF: Math.round(current.apparent_temperature * 1.8 + 32),
            conditionTextEn: currentMapping.descEn,
            conditionTextAr: currentMapping.descAr,
            conditionIcon: "",
            conditionCode: current.weather_code,
            humidity: current.relative_humidity_2m,
            pressureMb: current.pressure_msl,
            windKph: current.wind_speed_10m,
            windDir: "N",
            windDegree: current.wind_direction_10m,
            visibilityKm: (current.visibility || 10000) / 1000,
            cloudCover: current.cloud_cover,
            uvIndex: current.uv_index || 0,
            sunrise: daily.sunrise[0] ? daily.sunrise[0].split("T")[1] : "06:00",
            sunset: daily.sunset[0] ? daily.sunset[0].split("T")[1] : "18:00",
            moonPhase: "Waxing Gibbous",
            aqi: {
              index: epaIndex,
              labelEn: aqiInfo.labelEn,
              labelAr: aqiInfo.labelAr,
              color: aqiInfo.color
            }
          },
          hourly: hourlyList,
          forecast: dailyList,
          dataSource: "Open-Meteo"
        };

        return res.json(consolidated);
      } else {
        console.log("Open-Meteo status not ok, using simulated weather.");
        return res.json(generateFallbackWeather(cityName, targetLat, targetLon));
      }
    } catch (e) {
      console.log("Open-Meteo connection issue, using simulated weather.");
      return res.json(generateFallbackWeather(cityName, targetLat, targetLon));
    }

  } catch (error) {
    console.log("Weather endpoint overall exception, returning fallback.");
    return res.json(generateFallbackWeather(q, lat, lon));
  }
});

// Serve static assets and Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
