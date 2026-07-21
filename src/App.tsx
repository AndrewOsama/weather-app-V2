import { useEffect, useState, useRef, FormEvent } from "react";
import { 
  Search, 
  Navigation, 
  Heart, 
  History, 
  RefreshCw, 
  Sun, 
  Moon, 
  Laptop, 
  Trash2, 
  Languages, 
  X, 
  AlertCircle,
  CloudSun,
  Loader2,
  ChevronRight,
  MapPin,
  HelpCircle,
  ArrowUpRight
} from "lucide-react";

import { ConsolidatedWeather, Language, Suggestion, TempUnit, ThemeMode } from "./types";
import { getTranslation, translateCondition } from "./locales";
import { getConditionStyle, getWeatherIcon } from "./utils/weatherHelpers";

// Import modular components
import WeatherDetails from "./components/WeatherDetails";
import HourlyForecast from "./components/HourlyForecast";
import WeeklyForecast from "./components/WeeklyForecast";
import WeatherMap from "./components/WeatherMap";

export default function App() {
  // --- States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState<ConsolidatedWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<TempUnit>("C");
  const [lang, setLang] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // --- Initial Mount Loaders ---
  useEffect(() => {
    // 1. Language preference
    const storedLang = localStorage.getItem("weather_lang") as Language;
    if (storedLang === "ar" || storedLang === "en") {
      setLang(storedLang);
      document.documentElement.dir = storedLang === "ar" ? "rtl" : "ltr";
    } else {
      setLang("en");
      document.documentElement.dir = "ltr";
    }

    // 2. Unit preference
    const storedUnit = localStorage.getItem("weather_unit") as TempUnit;
    if (storedUnit === "C" || storedUnit === "F") {
      setUnit(storedUnit);
    }

    // 3. Theme preference
    const storedTheme = localStorage.getItem("weather_theme") as ThemeMode;
    if (storedTheme) {
      setTheme(storedTheme);
    }

    // 4. Favorites & History
    const storedFavs = localStorage.getItem("weather_favorites");
    if (storedFavs) {
      setFavorites(JSON.parse(storedFavs));
    }
    const storedHistory = localStorage.getItem("weather_history");
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }

    // 5. Initial Weather (Try Geolocation first, then fallback to "London" or "Cairo")
    initializeInitialLocation();
  }, []);

  // --- Theme applying effect ---
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light");
    } else {
      // System
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    }
    localStorage.setItem("weather_theme", theme);
  }, [theme]);

  // Click outside autocomplete to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Autocomplete Suggestions fetching ---
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions", err);
      }
    }, 400); // 400ms debouncing

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // --- Helpers & Handlers ---
  const initializeInitialLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation rejected or failed, loading London instead:", err);
          fetchWeatherByCity("London");
        },
        { timeout: 8000 }
      );
    } else {
      fetchWeatherByCity("London");
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const response = await fetch(`/api/weather?q=${encodeURIComponent(city)}`);
      if (response.ok) {
        const data: ConsolidatedWeather = await response.json();
        setWeather(data);
        addToHistory(data.location.name);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || getTranslation(lang, "cityNotFound"));
      }
    } catch (err) {
      setError(getTranslation(lang, "networkError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (response.ok) {
        const data: ConsolidatedWeather = await response.json();
        setWeather(data);
        addToHistory(data.location.name);
      } else {
        setError(getTranslation(lang, "cityNotFound"));
      }
    } catch (err) {
      setError(getTranslation(lang, "networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeatherByCity(searchQuery.trim());
    }
  };

  const addToHistory = (cityName: string) => {
    setSearchHistory((prev) => {
      const cleaned = prev.filter((item) => item.toLowerCase() !== cityName.toLowerCase());
      const updated = [cityName, ...cleaned].slice(0, 20); // Keep max 20
      localStorage.setItem("weather_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("weather_history");
  };

  const toggleFavorite = (cityName: string) => {
    setFavorites((prev) => {
      let updated;
      if (prev.some((item) => item.toLowerCase() === cityName.toLowerCase())) {
        updated = prev.filter((item) => item.toLowerCase() !== cityName.toLowerCase());
      } else {
        updated = [...prev, cityName];
      }
      localStorage.setItem("weather_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          setError(getTranslation(lang, "geolocationError"));
          setLoading(false);
        }
      );
    } else {
      setError(getTranslation(lang, "geolocationError"));
    }
  };

  const handleLanguageToggle = () => {
    const nextLang: Language = lang === "en" ? "ar" : "en";
    setLang(nextLang);
    localStorage.setItem("weather_lang", nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  const handleUnitToggle = () => {
    const nextUnit: TempUnit = unit === "C" ? "F" : "C";
    setUnit(nextUnit);
    localStorage.setItem("weather_unit", nextUnit);
  };

  // --- Dynamic Style selection ---
  const activeStyle = weather 
    ? getConditionStyle(weather.current.conditionCode, true) // Pass standard condition code
    : getConditionStyle(0, true);

  const isFavorite = weather ? favorites.some(f => f.toLowerCase() === weather.location.name.toLowerCase()) : false;

  const WeatherIconComponent = weather ? getWeatherIcon(weather.current.conditionCode, true) : CloudSun;

  return (
    <div 
      className={`min-h-screen pb-16 transition-all duration-700 bg-gradient-to-br ${activeStyle.gradient} text-white flex flex-col font-sans overflow-x-hidden relative`}
      id="app-root"
    >
      {/* Immersive UI Background Glow Effects */}
      <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] ${activeStyle.glowTopRight} rounded-full blur-[120px] pointer-events-none z-0`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] ${activeStyle.glowBottomLeft} rounded-full blur-[120px] pointer-events-none z-0`} />

      {/* Header Bar - Elegant Glass */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between bg-white/5 backdrop-blur-xl border-b border-white/10 relative z-20" id="app-header">
        <div className="flex items-center gap-3" id="brand-logo-container">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <CloudSun className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase text-white drop-shadow">
            {getTranslation(lang, "appName")}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-20" id="header-action-controls">
          {/* Unit Switcher */}
          <button
            onClick={handleUnitToggle}
            id="unit-switch-button"
            className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-white"
            title="Celsius / Fahrenheit Toggle"
          >
            °{unit}
          </button>

          {/* Language Switch */}
          <button
            onClick={handleLanguageToggle}
            id="language-switch-button"
            className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-white"
            title="Toggle Language EN/AR"
          >
            <Languages className="w-4 h-4 text-white/80" />
            <span className="text-xs font-bold font-mono select-none">
              {lang === "en" ? "العربية" : "English"}
            </span>
          </button>

          {/* Dark/Light/System Theme */}
          <div className="flex bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-sm" id="theme-selector-group">
            <button
              onClick={() => setTheme("light")}
              id="theme-light-button"
              className={`p-1.5 rounded-full transition-all duration-300 ${theme === "light" ? "bg-white/20 text-amber-300 scale-105" : "text-white/60 hover:text-white"}`}
              title="Light Mode"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              id="theme-dark-button"
              className={`p-1.5 rounded-full transition-all duration-300 ${theme === "dark" ? "bg-indigo-600 text-white scale-105" : "text-white/60 hover:text-white"}`}
              title="Dark Mode"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme("system")}
              id="theme-system-button"
              className={`p-1.5 rounded-full transition-all duration-300 ${theme === "system" ? "bg-white/15 text-white scale-105" : "text-white/60 hover:text-white"}`}
              title="System Default"
            >
              <Laptop className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-8 mt-6 flex flex-col gap-6 relative z-10" id="app-main-content">
        
        {/* Search & Location Bar */}
        <div className="w-full flex flex-col md:flex-row gap-3.5 z-40 relative" id="search-bar-section">
          <form onSubmit={handleSearchSubmit} className="flex-grow relative" id="search-form">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={getTranslation(lang, "searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                id="search-input-field"
                className="w-full pl-12 pr-16 py-3.5 sm:py-4 bg-white/10 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-md text-sm placeholder:text-white/60 shadow-lg text-white font-medium focus:border-indigo-400 transition-all duration-300"
              />
              <Search className="absolute left-5 w-5 h-5 text-white/60" id="search-input-icon" />
              
              <div className="absolute right-3 flex items-center gap-1.5" id="search-right-buttons">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    id="search-clear-button"
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  id="search-submit-btn"
                  className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-xs sm:text-sm font-bold shadow-md transition-all duration-300 active:scale-95 cursor-pointer text-white"
                >
                  {lang === "ar" ? "بحث" : "Search"}
                </button>
              </div>
            </div>

            {/* Suggestions Dropdown panel */}
            {isSearchFocused && (suggestions.length > 0 || searchHistory.length > 0 || favorites.length > 0) && (
              <div 
                ref={autocompleteRef}
                id="search-autocomplete-panel"
                className="absolute left-0 right-0 mt-2 rounded-[24px] bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 animate-fade-in"
              >
                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="p-3 flex flex-col gap-1" id="suggestions-block">
                    <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest px-3 mb-1 block">
                      {lang === "ar" ? "المقترحات" : "Suggestions"}
                    </span>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          fetchWeatherByCity(item.name);
                          setSearchQuery("");
                          setSuggestions([]);
                        }}
                        id={`suggest-item-${item.id}`}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left rtl:text-right transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <div className="flex flex-col text-sm">
                          <span className="font-bold text-white">{item.name}</span>
                          <span className="text-xs text-white/60">{item.region ? `${item.region}, ` : ""}{item.country}</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/40 ms-auto flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Favorites in quick selection */}
                {favorites.length > 0 && (
                  <div className="p-3 flex flex-col gap-1" id="dropdown-favorites-block">
                    <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest px-3 mb-1 block">
                      {getTranslation(lang, "favorites")}
                    </span>
                    <div className="flex flex-wrap gap-1.5 px-3 py-1" id="favorites-flex-tags">
                      {favorites.map((fav) => (
                        <button
                          key={fav}
                          type="button"
                          onClick={() => {
                            fetchWeatherByCity(fav);
                            setSuggestions([]);
                            setIsSearchFocused(false);
                          }}
                          id={`fav-tag-${fav}`}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-xs font-bold text-rose-200 transition-colors cursor-pointer"
                        >
                          <Heart className="w-3 h-3 fill-current" />
                          <span>{fav}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches List */}
                {searchHistory.length > 0 && (
                  <div className="p-3 flex flex-col gap-1" id="dropdown-history-block">
                    <div className="flex items-center justify-between px-3 mb-1">
                      <span className="text-[10px] text-white/50 font-extrabold uppercase tracking-widest block">
                        {getTranslation(lang, "recentSearches")}
                      </span>
                      <button
                        type="button"
                        onClick={clearHistory}
                        id="clear-history-dropdown-btn"
                        className="text-[10px] text-rose-400 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        {getTranslation(lang, "clearHistory")}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin flex flex-col gap-1" id="history-scroller">
                      {searchHistory.map((hist, idx) => (
                        <button
                          key={`${hist}-${idx}`}
                          type="button"
                          onClick={() => {
                            fetchWeatherByCity(hist);
                            setSuggestions([]);
                            setIsSearchFocused(false);
                          }}
                          id={`history-item-${idx}`}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/5 text-left rtl:text-right transition-colors text-sm text-white/80"
                        >
                          <History className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span>{hist}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white/40 ms-auto rtl:rotate-180 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Quick buttons */}
          <div className="flex gap-2" id="search-left-utility">
            <button
              onClick={handleUseMyLocation}
              id="geo-locate-btn"
              className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-lg text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer flex-shrink-0"
              title="Locate via browser geolocation"
            >
              <Navigation className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="hidden sm:inline">{getTranslation(lang, "useMyLocation")}</span>
            </button>

            {weather && (
              <button
                onClick={() => fetchWeatherByCity(weather.location.name)}
                id="refresh-weather-btn"
                className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105 active:rotate-180 cursor-pointer flex items-center justify-center"
                title="Refresh Weather Information"
              >
                <RefreshCw className="w-5 h-5 text-indigo-300" />
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div 
            className="w-full p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-md text-rose-200 flex items-center justify-between gap-3 shadow-lg animate-fade-in"
            id="error-banner"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              id="close-error-banner"
              className="p-1 rounded-full hover:bg-rose-500/20 text-rose-300 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

        {/* --- Loading State Skeleton Loader --- */}
        {loading ? (
          <div className="w-full flex flex-col gap-6" id="skeleton-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Large Card Skeleton */}
              <div className="lg:col-span-4 rounded-3xl bg-white/10 dark:bg-slate-900/40 border border-white/10 p-6 flex flex-col gap-6 relative overflow-hidden h-[420px] shimmer-loader">
                <div className="w-1/3 h-6 bg-white/10 rounded-lg"></div>
                <div className="w-1/2 h-10 bg-white/10 rounded-lg self-center mt-6"></div>
                <div className="w-24 h-24 bg-white/10 rounded-full self-center"></div>
                <div className="w-2/3 h-12 bg-white/10 rounded-lg self-center"></div>
                <div className="flex justify-between mt-auto">
                  <div className="w-16 h-4 bg-white/10 rounded"></div>
                  <div className="w-16 h-4 bg-white/10 rounded"></div>
                </div>
              </div>

              {/* Right Map Card Skeleton */}
              <div className="lg:col-span-8 rounded-3xl bg-white/10 dark:bg-slate-900/40 border border-white/10 p-6 flex flex-col relative overflow-hidden h-[420px] shimmer-loader">
                <div className="w-1/4 h-6 bg-white/10 rounded-lg mb-4"></div>
                <div className="flex-grow bg-white/10 rounded-2xl"></div>
              </div>
            </div>

            {/* Weather Grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shimmer-loader relative overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/10 border border-white/10"></div>
              ))}
            </div>
          </div>
        ) : weather ? (
          <div className="w-full flex flex-col gap-6" id="weather-dashboard-view">
            
            {/* Top Dashboard Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-upper-row">
              
              {/* Primary Current Weather Card */}
              <div 
                className={`lg:col-span-4 rounded-[40px] border ${activeStyle.cardBg} ${activeStyle.cardBorder} p-8 flex flex-col justify-between shadow-2xl ${activeStyle.glowColor} relative overflow-hidden group transition-all duration-300 hover:shadow-2xl`}
                id="main-weather-card"
              >
                {/* Visual Glass highlights */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none rounded-[40px]"></div>

                {/* Title Section (City Name, Country, Heart Favorite) */}
                <div className="flex items-start justify-between relative z-10" id="card-header-top">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                      {weather.location.name}
                    </h2>
                    <span className="text-sm font-semibold text-white/70 tracking-wide">
                      {weather.location.region ? `${weather.location.region}, ` : ""}{weather.location.country}
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs py-1 px-3 bg-white/20 rounded-full border border-white/10 text-white font-medium">
                        {weather.location.localTime.split(" ")[0]}
                      </span>
                      <span className="text-[10px] sm:text-xs py-1 px-3 bg-white/20 rounded-full border border-white/10 text-white font-medium">
                        {weather.location.localTime.split(" ")[1] || ""}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite(weather.location.name)}
                    id="favorite-toggle-btn"
                    className={`p-2.5 rounded-full border transition-all duration-300 hover:scale-110 cursor-pointer ${
                      isFavorite 
                        ? "bg-rose-500/20 border-rose-400/40 text-rose-400" 
                        : "bg-white/5 border-white/10 text-slate-300 hover:text-rose-400"
                    }`}
                    title={isFavorite ? getTranslation(lang, "removeFromFavorites") : getTranslation(lang, "addToFavorites")}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current scale-110 animate-bounce" : ""}`} />
                  </button>
                </div>

                {/* Main Temperature & Weather Visuals */}
                <div className="my-6 relative z-10 flex flex-col justify-center" id="weather-visuals-middle">
                  <div className="absolute top-0 right-0 p-2 opacity-80 pointer-events-none">
                    <div className="relative" id="current-icon-wrapper">
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl"></div>
                      <WeatherIconComponent className="w-24 h-24 text-white relative z-10 drop-shadow-lg" />
                    </div>
                  </div>

                  <div className="flex items-baseline mt-2" id="main-temp-display">
                    <span className="text-6xl sm:text-7xl lg:text-[90px] leading-none font-bold tracking-tighter text-white drop-shadow-md">
                      {unit === "C" ? weather.current.tempC : weather.current.tempF}°
                    </span>
                    <span className="text-3xl font-light opacity-60 text-white ml-1 self-start mt-2">
                      {unit}
                    </span>
                  </div>

                  <p className="text-xl sm:text-2xl mt-2 font-medium text-white">
                    {translateCondition(weather.current.conditionTextEn, lang)}
                  </p>

                  {weather.forecast[0] && (
                    <div className="flex gap-4 mt-2 text-white/70 font-medium text-xs sm:text-sm">
                      <span>{lang === "ar" ? "عظمى" : "H"}: {unit === "C" ? `${weather.forecast[0].tempMaxC}°` : `${weather.forecast[0].tempMaxF}°`}</span>
                      <span>{lang === "ar" ? "صغرى" : "L"}: {unit === "C" ? `${weather.forecast[0].tempMinC}°` : `${weather.forecast[0].tempMinF}°`}</span>
                    </div>
                  )}
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/80 font-medium relative z-10" id="card-footer-box">
                  <div className="flex flex-col gap-0.5">
                    <span>{getTranslation(lang, "refresh")}</span>
                    <span className="font-mono text-[10px] text-white/50">
                      {weather.location.localTime}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-right font-mono text-[10px]">
                    <span className="text-white/50 uppercase tracking-widest text-[9px]">{getTranslation(lang, "dataProvidedBy")}</span>
                    <span className="font-bold text-indigo-300">{weather.dataSource}</span>
                  </div>
                </div>
              </div>

              {/* Weather Map Card */}
              <div 
                className="lg:col-span-8 rounded-[40px] bg-white/10 border border-white/20 p-8 flex flex-col shadow-2xl backdrop-blur-xl"
                id="interactive-map-card"
              >
                <WeatherMap 
                  lat={weather.location.lat} 
                  lon={weather.location.lon} 
                  cityName={weather.location.name} 
                  lang={lang} 
                />
              </div>

            </div>

            {/* Bento-Style Weather Details Grid */}
            <div id="bento-weather-details-section">
              <WeatherDetails weather={weather} lang={lang} unit={unit} />
            </div>

            {/* 24-Hour Forecast & Trend Charts */}
            <div id="hourly-forecast-chart-section">
              <HourlyForecast weather={weather} lang={lang} unit={unit} />
            </div>

            {/* 7-Day Weekly Forecast */}
            <div id="weekly-forecast-section">
              <WeeklyForecast weather={weather} lang={lang} unit={unit} />
            </div>

          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-4 bg-white/10 dark:bg-slate-900/40 rounded-3xl border border-white/10 backdrop-blur-md shadow-lg" id="empty-state-view">
            <CloudSun className="w-16 h-16 text-indigo-300 animate-bounce" />
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white">{getTranslation(lang, "noDataLoaded")}</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">{getTranslation(lang, "noDataLoadedDesc")}</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
