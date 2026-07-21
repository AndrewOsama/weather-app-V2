import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  Eye, 
  Cloudy, 
  SunDim, 
  Sunrise, 
  Sunset, 
  MoonStar,
  Activity,
  Compass
} from "lucide-react";
import { ConsolidatedWeather, Language, TempUnit } from "../types";
import { getTranslation, translateCondition, formatPercent } from "../locales";

interface WeatherDetailsProps {
  weather: ConsolidatedWeather;
  lang: Language;
  unit: TempUnit;
}

export default function WeatherDetails({ weather, lang, unit }: WeatherDetailsProps) {
  const { current } = weather;

  const tempVal = unit === "C" ? `${current.tempC}°C` : `${current.tempF}°F`;
  const feelsLikeVal = unit === "C" ? `${current.feelsLikeC}°C` : `${current.feelsLikeF}°F`;

  // Get UV Index localized severity
  const getUvLevel = (uv: number) => {
    if (uv <= 2) return { text: getTranslation(lang, "uvLow"), color: "text-emerald-400" };
    if (uv <= 5) return { text: getTranslation(lang, "uvModerate"), color: "text-amber-400" };
    if (uv <= 7) return { text: getTranslation(lang, "uvHigh"), color: "text-orange-400" };
    if (uv <= 10) return { text: getTranslation(lang, "uvVeryHigh"), color: "text-rose-400" };
    return { text: getTranslation(lang, "uvExtreme"), color: "text-purple-400" };
  };

  const uvLevel = getUvLevel(current.uvIndex);

  // Grid details config
  const detailsList = [
    {
      id: "feels-like",
      icon: Thermometer,
      title: getTranslation(lang, "feelsLike"),
      value: feelsLikeVal,
      subtext: null,
      color: "text-indigo-400"
    },
    {
      id: "humidity",
      icon: Droplets,
      title: getTranslation(lang, "humidity"),
      value: formatPercent(current.humidity, lang),
      subtext: null,
      color: "text-cyan-400"
    },
    {
      id: "wind",
      icon: Wind,
      title: getTranslation(lang, "windSpeed"),
      value: `${Math.round(current.windKph)} ${getTranslation(lang, "kmh")}`,
      subtext: (
        <div className="flex items-center gap-1 mt-1 text-xs text-white/70">
          <Compass className="w-3.5 h-3.5 text-indigo-300 animate-spin-slow" />
          <span>{current.windDir || "N"} ({current.windDegree}°)</span>
        </div>
      ),
      color: "text-teal-400"
    },
    {
      id: "pressure",
      icon: Gauge,
      title: getTranslation(lang, "pressure"),
      value: `${current.pressureMb} ${getTranslation(lang, "hPa")}`,
      subtext: null,
      color: "text-blue-400"
    },
    {
      id: "visibility",
      icon: Eye,
      title: getTranslation(lang, "visibility"),
      value: `${current.visibilityKm.toFixed(1)} ${getTranslation(lang, "km")}`,
      subtext: null,
      color: "text-emerald-400"
    },
    {
      id: "cloudiness",
      icon: Cloudy,
      title: getTranslation(lang, "cloudiness"),
      value: formatPercent(current.cloudCover, lang),
      subtext: null,
      color: "text-slate-300"
    },
    {
      id: "uv",
      icon: SunDim,
      title: getTranslation(lang, "uvIndex"),
      value: `${current.uvIndex}`,
      subtext: (
        <span className={`text-xs font-semibold mt-1 ${uvLevel.color}`}>
          {uvLevel.text}
        </span>
      ),
      color: "text-amber-400"
    },
    {
      id: "aqi",
      icon: Activity,
      title: getTranslation(lang, "airQuality"),
      value: `${current.aqi.index}`,
      subtext: (
        <span 
          className="text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full inline-block"
          style={{ backgroundColor: `${current.aqi.color}25`, color: current.aqi.color }}
        >
          {lang === "ar" ? current.aqi.labelAr : current.aqi.labelEn}
        </span>
      ),
      color: "text-rose-400"
    },
    {
      id: "sunrise",
      icon: Sunrise,
      title: getTranslation(lang, "sunrise"),
      value: current.sunrise,
      subtext: null,
      color: "text-orange-300"
    },
    {
      id: "sunset",
      icon: Sunset,
      title: getTranslation(lang, "sunset"),
      value: current.sunset,
      subtext: null,
      color: "text-rose-300"
    },
    {
      id: "moon",
      icon: MoonStar,
      title: getTranslation(lang, "moonPhase"),
      value: translateCondition(current.moonPhase, lang),
      subtext: null,
      color: "text-purple-300"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="weather-details-grid">
      {detailsList.map((item) => {
        const IconComponent = item.icon;
        return (
          <div 
            key={item.id}
            id={`detail-${item.id}`}
            className="group relative overflow-hidden rounded-[28px] bg-white/10 border border-white/20 p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] hover:bg-white/15 hover:shadow-xl shadow-md backdrop-blur-xl"
          >
            {/* Soft ambient hover glow */}
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-300"></div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60 font-semibold tracking-wide">
                {item.title}
              </span>
              <IconComponent className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform duration-300`} />
            </div>

            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {item.value}
              </span>
              {item.subtext && <div className="mt-1">{item.subtext}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
