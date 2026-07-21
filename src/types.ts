export interface LocationData {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localTime: string;
}

export interface CurrentWeatherData {
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  conditionTextEn: string;
  conditionTextAr: string;
  conditionIcon: string;
  conditionCode: number;
  humidity: number;
  pressureMb: number;
  windKph: number;
  windDir: string;
  windDegree: number;
  visibilityKm: number;
  cloudCover: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  aqi: {
    index: number;
    labelEn: string;
    labelAr: string;
    color: string;
  };
}

export interface HourlyForecastItem {
  time: string;
  tempC: number;
  tempF: number;
  conditionCode: number;
  conditionTextEn: string;
  conditionIcon: string;
  rainChance: number;
  windKph: number;
}

export interface DailyForecastItem {
  date: string;
  dayNameEn: string;
  dayNameAr: string;
  tempMaxC: number;
  tempMinC: number;
  tempMaxF: number;
  tempMinF: number;
  conditionTextEn: string;
  conditionTextAr: string;
  conditionIcon: string;
  humidity: number;
  rainChance: number;
  windKph: number;
  uv: number;
}

export interface ConsolidatedWeather {
  location: LocationData;
  current: CurrentWeatherData;
  hourly: HourlyForecastItem[];
  forecast: DailyForecastItem[];
  dataSource: string;
}

export interface Suggestion {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  id: string;
}

export type TempUnit = "C" | "F";
export type ThemeMode = "light" | "dark" | "system";
export type Language = "en" | "ar";
