# 🌤️ Weather App - Professional Production-Ready Web Application
### *تطبيق الطقس الاحترافي المتكامل - جاهز للتسليم والإنتاج*

A highly polished, ultra-responsive, and visually distinctive **Weather App** designed to meet commercial specifications. It features a modern Glassmorphism theme, dynamic real-time backgrounds that adapt to current weather conditions, an interactive map, comprehensive 24-hour hourly trend charts, localized English & Arabic (with full RTL support), search history, and favorite cities storage.

---

## 🎨 Key Features / المميزات الرئيسية

### 🇬🇧 🇸🇦 Dual-Language Support (EN/AR with RTL) / دعم كامل للغتين العربية والإنجليزية
*   **English & Arabic translation dictionaries** are loaded dynamically from structured locale JSONs.
*   Selecting Arabic automatically changes the page layout orientation to Right-to-Left (RTL) (`dir="rtl"`) with appropriate Arabic display typography and translations.
*   حفظ اللغة المختارة في الذاكرة المحلية لضمان تجربة مستمرة.

### 🔮 Premium Glassmorphism UI/UX / واجهة مستخدم زجاجية عصرية
*   **Dynamic Adaptive Backgrounds**: Page background gradients and glow animations automatically shift depending on the weather state (Sunny, Cloudy, Rainy, Stormy, Snowy, Foggy, or Night).
*   **Smooth Animations**: Hover effects, micro-transitions, skeleton loaders, and fade-ins are implemented using optimized CSS & Tailwind utilities.
*   **Touch Targets**: Optimized with standard mobile-friendly targets larger than 44px for perfect usability on iOS and Android devices.

### 📍 Interactive Weather Maps & Localization / خرائط تفاعلية وتحديد المواقع
*   **Leaflet.js Mapping Integration**: Renders city coordinates dynamically on an elegant custom map with active zoom controls and pinpoint animation.
*   **Browser Geolocation API**: "Use My Location" button locates the current user and retrieves their active local weather instantly.

### 📊 Real-Time Analytics & Charts / رسوم بيانية ومقاييس تفصيلية
*   **Chart.js Weather Trends**: Generates interactive graphs showing daily trends for:
    1. Temperature fluctuation
    2. Humidity levels
    3. Wind Speed variations
*   **Bento-Grid Metrics**: Displays UV Index, Feels Like, Wind direction and speed, Pressure, Visibility, Sunrise, Sunset, Moon phase, and Air Quality (AQI) with colored health index levels.

### 💾 Smart Caching & Persistence / الحفظ والذاكرة الذكية
*   **Recent Searches**: Caches up to 20 past searched cities in `LocalStorage` with clear history options.
*   **Favorite Cities List**: Allows adding/removing cities to a favorites tray for quick switching.
*   **Progressive Web App (PWA)**: Full support for offline loading and app installation via `manifest.json` and `service-worker.js`.

---

## 🏗️ Project Directory Structure / هيكل المشروع

```text
weather-app/
├── public/
│   ├── manifest.json          # PWA App Manifest & metadata config
│   └── service-worker.js      # Offline asset caching service worker
├── src/
│   ├── components/
│   │   ├── WeatherDetails.tsx # Bento grid of extensive weather details (AQI, UV, Sunset)
│   │   ├── HourlyForecast.tsx # Scrollable 24h list & Chart.js dynamic metric graphs
│   │   ├── WeeklyForecast.tsx # 7-day forecast with custom range-temperature bars
│   │   └── WeatherMap.tsx     # Dynamic Leaflet.js interactive maps loader
│   ├── utils/
│   │   └── weatherHelpers.ts  # Weather condition analyzers & dynamic gradient styles
│   ├── App.tsx                # Main client driver (search bar, controls, states)
│   ├── locales.ts             # English / Arabic bidirectional dictionary translations
│   ├── types.ts               # Shared TypeScript interfaces & types
│   ├── index.css              # Global tailwind configuration & CSS micro-animations
│   └── main.tsx               # Frontend entry-point
├── server.ts                  # Secure Express.js proxy backend for API keys protection
├── package.json               # Manifest dependencies and build scripts
└── README.md                  # Comprehensive technical documentation (this file)
```

---

## 🔒 Security & API Integration / الأمان والربط بالخوادم

To preserve API keys from browser exposure, the application runs on a full-stack **Express + Vite** hybrid architecture:
1. All client requests are sent to the local proxy `/api/weather` and `/api/search`.
2. The proxy handles keys secure server-side via Node environment variables (`process.env.WEATHER_API_KEY`).
3. **Out-of-the-box Free Fallback**: If no custom `WEATHER_API_KEY` is present, the server automatically pivots to the **Open-Meteo & Open-Meteo Geocoding API** which requires *no keys*, making the preview fully functional instantly!

---

## ⚙️ Setup and Installation / طريقة التشغيل والتثبيت

### 1. Get an API Key (Optional) / الحصول على مفتاح API
1. Sign up for a free key at [WeatherAPI.com](https://www.weatherapi.com/).
2. Copy your key.

### 2. Configure Environment Variables / إعداد البيئة
Create or edit your local `.env` file in the root folder and add your key:
```env
WEATHER_API_KEY="YOUR_WEATHERAPI_KEY_HERE"
```

### 3. Run Locally / التشغيل المحلي
Install dependencies and boot up:
```bash
# Install dependencies
npm install

# Start the full-stack development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 🚀 Deployment / طريقة النشر والتسليم

### Replit (Recommended)
This codebase is already fully pre-configured for Replit with CJS server builders. Just hit **Run**, and it will build and serve instantly on port `3000`.

### Vercel / Netlify (Client-Only Mode)
For deployment on serverless platforms, simply build the static files:
```bash
npm run build
```
Vite will output highly optimized minified production assets inside the `dist/` directory, ready to be hosted!

---

*This application was engineered following clean modular code architecture, high usability standards, and optimized performance guidelines.*
*تم تصميم وتطوير هذا التطبيق باتباع أفضل المعايير الهندسية وجودة الكود لخدمة العملاء على أكمل وجه.*
