import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog, 
  Moon,
  LucideIcon
} from "lucide-react";

export interface ConditionStyle {
  gradient: string;
  cardBg: string;
  cardBorder: string;
  glowColor: string;
  glowTopRight: string;
  glowBottomLeft: string;
  type: string;
}

// Map any weather code (OpenWeather, WeatherAPI, Open-Meteo) to standard conditions
export function getWeatherCondition(code: number, isDay: boolean = true): string {
  // Normalize code
  // Open-Meteo WMO Codes
  if (code >= 0 && code <= 99) {
    if (code === 0) return isDay ? "sunny" : "night";
    if (code >= 1 && code <= 3) return "cloudy";
    if (code === 45 || code === 48) return "fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if (code >= 71 && code <= 77 || code === 85 || code === 86) return "snow";
    if (code >= 95 && code <= 99) return "storm";
    return isDay ? "sunny" : "night";
  }

  // WeatherAPI Codes (1000+)
  if (code >= 1000) {
    if (code === 1000) return isDay ? "sunny" : "night";
    if (code === 1003) return "cloudy"; // partly cloudy
    if (code === 1006 || code === 1009) return "cloudy"; // cloudy/overcast
    if (code === 1030 || code === 1135 || code === 1147) return "fog"; // mist/fog
    if ([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) return "rain";
    if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1261, 1264, 1069, 1072, 1204, 1207, 1237, 1249, 1252].includes(code)) return "snow";
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) return "storm";
    return isDay ? "sunny" : "night";
  }

  return "sunny";
}

// Get appropriate Lucide icon component
export function getWeatherIcon(code: number, isDay: boolean = true): LucideIcon {
  const condition = getWeatherCondition(code, isDay);
  switch (condition) {
    case "sunny":
      return Sun;
    case "night":
      return Moon;
    case "cloudy":
      return Cloud;
    case "rain":
      return CloudRain;
    case "snow":
      return Snowflake;
    case "fog":
      return CloudFog;
    case "storm":
      return CloudLightning;
    default:
      return Sun;
  }
}

// Get modern responsive Glassmorphic style configuration based on weather condition
export function getConditionStyle(code: number, isDay: boolean = true): ConditionStyle {
  const cond = getWeatherCondition(code, isDay);
  
  switch (cond) {
    case "sunny":
      return {
        gradient: "from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]",
        cardBg: "bg-white/10 backdrop-blur-2xl",
        cardBorder: "border-white/20",
        glowColor: "shadow-[0_0_50px_rgba(34,211,238,0.25)]",
        glowTopRight: "bg-cyan-400/20",
        glowBottomLeft: "bg-purple-500/20",
        type: "sunny"
      };
    case "night":
      return {
        gradient: "from-[#0f172a] via-[#1e1b4b] to-[#311042]",
        cardBg: "bg-white/5 backdrop-blur-2xl",
        cardBorder: "border-white/10",
        glowColor: "shadow-[0_0_50px_rgba(168,85,247,0.25)]",
        glowTopRight: "bg-purple-500/15",
        glowBottomLeft: "bg-indigo-500/15",
        type: "night"
      };
    case "cloudy":
      return {
        gradient: "from-[#1e293b] via-[#334155] to-[#475569]",
        cardBg: "bg-white/5 backdrop-blur-2xl",
        cardBorder: "border-white/10",
        glowColor: "shadow-[0_0_40px_rgba(203,213,225,0.15)]",
        glowTopRight: "bg-sky-400/15",
        glowBottomLeft: "bg-slate-400/15",
        type: "cloudy"
      };
    case "rain":
      return {
        gradient: "from-[#0f172a] via-[#1e293b] to-[#334155]",
        cardBg: "bg-white/5 backdrop-blur-2xl",
        cardBorder: "border-white/10",
        glowColor: "shadow-[0_0_40px_rgba(56,189,248,0.2)]",
        glowTopRight: "bg-sky-500/15",
        glowBottomLeft: "bg-teal-500/15",
        type: "rain"
      };
    case "storm":
      return {
        gradient: "from-[#020617] via-[#1e1b4b] to-[#311042]",
        cardBg: "bg-white/5 backdrop-blur-2xl",
        cardBorder: "border-white/10",
        glowColor: "shadow-[0_0_50px_rgba(168,85,247,0.3)]",
        glowTopRight: "bg-purple-600/20",
        glowBottomLeft: "bg-yellow-500/10",
        type: "storm"
      };
    case "snow":
      return {
        gradient: "from-[#0f172a] via-[#1e3a8a] to-[#3b82f6]",
        cardBg: "bg-white/10 backdrop-blur-2xl",
        cardBorder: "border-white/20",
        glowColor: "shadow-[0_0_40px_rgba(186,230,253,0.25)]",
        glowTopRight: "bg-cyan-300/20",
        glowBottomLeft: "bg-blue-400/20",
        type: "snow"
      };
    case "fog":
      return {
        gradient: "from-[#1e293b] via-[#334155] to-[#475569]",
        cardBg: "bg-white/5 backdrop-blur-2xl",
        cardBorder: "border-white/10",
        glowColor: "shadow-[0_0_30px_rgba(156,163,175,0.15)]",
        glowTopRight: "bg-zinc-400/15",
        glowBottomLeft: "bg-slate-500/15",
        type: "fog"
      };
    default:
      return {
        gradient: "from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]",
        cardBg: "bg-white/10 backdrop-blur-2xl",
        cardBorder: "border-white/20",
        glowColor: "shadow-[0_0_50px_rgba(34,211,238,0.25)]",
        glowTopRight: "bg-cyan-400/20",
        glowBottomLeft: "bg-purple-500/20",
        type: "sunny"
      };
  }
}
