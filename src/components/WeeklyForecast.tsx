import { Calendar, Droplets, Wind, Sun } from "lucide-react";
import { ConsolidatedWeather, Language, TempUnit } from "../types";
import { getTranslation, translateCondition, formatPercent } from "../locales";
import { getWeatherIcon } from "../utils/weatherHelpers";

interface WeeklyForecastProps {
  weather: ConsolidatedWeather;
  lang: Language;
  unit: TempUnit;
}

export default function WeeklyForecast({ weather, lang, unit }: WeeklyForecastProps) {
  const { forecast } = weather;

  return (
    <div 
      className="rounded-[32px] bg-white/10 border border-white/20 p-6 shadow-2xl flex flex-col gap-4 backdrop-blur-xl"
      id="weekly-forecast-card"
    >
      <div className="flex items-center gap-2 mb-2 px-1" id="weekly-header">
        <Calendar className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-lg text-white">
          {getTranslation(lang, "weeklyForecast")}
        </h3>
      </div>

      <div className="flex flex-col gap-3" id="weekly-days-list">
        {forecast.map((day, index) => {
          // Resolve condition styles and icon
          const dayName = lang === "ar" ? day.dayNameAr : day.dayNameEn;
          const WeatherIconComponent = getWeatherIcon(day.uv > 0 ? 0 : 3, true); // Resolve generic icon
          
          const maxTemp = unit === "C" ? `${day.tempMaxC}°` : `${day.tempMaxF}°`;
          const minTemp = unit === "C" ? `${day.tempMinC}°` : `${day.tempMinF}°`;
          const conditionText = lang === "ar" ? day.conditionTextAr : day.conditionTextEn;
          const translatedConditionText = translateCondition(conditionText, lang);

          // Render high-contrast bars indicating temp spreads
          const minC = Math.min(...forecast.map(d => d.tempMinC));
          const maxC = Math.max(...forecast.map(d => d.tempMaxC));
          const totalSpread = maxC - minC || 1;
          const minPercent = ((day.tempMinC - minC) / totalSpread) * 100;
          const widthPercent = ((day.tempMaxC - day.tempMinC) / totalSpread) * 100;

          return (
            <div
              key={day.date}
              id={`weekly-day-${index}`}
              className="flex items-center justify-between p-4 rounded-[20px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-x-1 rtl:hover:-translate-x-1 backdrop-blur-md"
            >
              {/* Day name & date */}
              <div className="flex flex-col w-28 sm:w-32" id={`weekly-day-name-box-${index}`}>
                <span className="text-sm font-semibold text-white tracking-wide">
                  {dayName}
                </span>
                <span className="text-[10px] text-white/50 font-mono">
                  {day.date}
                </span>
              </div>

              {/* Icon and text */}
              <div className="flex items-center gap-2.5 w-32 sm:w-40" id={`weekly-day-condition-box-${index}`}>
                <div className="p-1.5 rounded-xl bg-white/5 text-amber-400" id={`weekly-day-icon-${index}`}>
                  <WeatherIconComponent className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white/80 line-clamp-1">
                  {translatedConditionText}
                </span>
              </div>

              {/* Temperature spread visually */}
              <div className="hidden md:flex items-center flex-grow mx-4 gap-2" id={`weekly-day-spread-box-${index}`}>
                <span className="text-xs text-white/50 font-semibold w-6 text-right">
                  {minTemp}
                </span>
                <div className="relative h-2 flex-grow bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400"
                    style={{ left: `${minPercent}%`, width: `${Math.max(15, widthPercent)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-white font-bold w-6">
                  {maxTemp}
                </span>
              </div>

              {/* Mobile temperature display */}
              <div className="flex md:hidden items-center gap-1.5 text-right font-mono text-xs w-16 justify-end" id={`weekly-day-temp-mobile-${index}`}>
                <span className="text-white/50">{minTemp}</span>
                <span className="text-white/50">/</span>
                <span className="text-white font-bold">{maxTemp}</span>
              </div>

              {/* Stats parameters: rain chance, wind max */}
              <div className="flex items-center gap-3 w-16 sm:w-20 justify-end text-xs text-white/80" id={`weekly-day-stats-box-${index}`}>
                {day.rainChance > 0 ? (
                  <span className="flex items-center gap-0.5 text-cyan-300 font-bold animate-pulse" id={`weekly-day-rain-${index}`}>
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    {formatPercent(day.rainChance, lang)}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-white/40" id={`weekly-day-rain-none-${index}`}>
                    <Sun className="w-3.5 h-3.5 text-amber-500/50" />
                    {formatPercent(0, lang)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
