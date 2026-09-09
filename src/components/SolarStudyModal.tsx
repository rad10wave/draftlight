import React from 'react';
import {
  X,
  Sun,
  Compass,
  Clock,
  MapPin,
  Calendar,
  Check,
  Flame,
  CloudSun,
} from 'lucide-react';
import { DesignTab, SolarSettings } from '../types';
import {
  calculateSolarPosition,
  evaluateRoomsSunlight,
} from '../utils/solarCalculator';

interface SolarStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DesignTab;
  onUpdateSolarSettings: (settings: SolarSettings) => void;
}

const CITY_PRESETS = [
  { name: 'London, UK', lat: 51.5 },
  { name: 'New York, US', lat: 40.7 },
  { name: 'San Francisco, US', lat: 37.8 },
  { name: 'Tokyo, Japan', lat: 35.7 },
  { name: 'Sydney, Australia', lat: -33.9 },
  { name: 'Singapore', lat: 1.3 },
];

export const SolarStudyModal: React.FC<SolarStudyModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onUpdateSolarSettings,
}) => {
  const currentSettings: SolarSettings = activeTab.solarSettings || {
    northAngle: 0,
    latitude: 40.7,
    season: 'summer',
    timeOfDay: 14.0,
    showCompass: true,
    showShadows: false,
  };

  const solarPos = calculateSolarPosition(currentSettings);
  const roomExposures = evaluateRoomsSunlight(activeTab.rooms, currentSettings);

  const formatHour = (hourDecimal: number) => {
    const hours = Math.floor(hourDecimal);
    const minutes = Math.round((hourDecimal - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (!isOpen) return null;

  return (
    <div
      id="solar-study-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-lg">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Solar Orientation & Shadow Study
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulate daylight angle, seasonal sun paths, and passive solar orientation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real-time Solar Angle Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Solar Altitude</div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {solarPos.altitude.toFixed(1)}°
              </div>
              <div className="text-[10px] text-slate-500">Elevation above horizon</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Solar Azimuth</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {solarPos.azimuth.toFixed(1)}°
              </div>
              <div className="text-[10px] text-slate-500">Angle from True North</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Simulated Time</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
                {formatHour(currentSettings.timeOfDay)}
              </div>
              <div className="text-[10px] text-slate-500">Sun position</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Daylight Status</div>
              <div className="text-sm font-semibold flex items-center gap-1.5 mt-1">
                {solarPos.isDaylight ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CloudSun className="w-4 h-4" /> Daylight Active
                  </span>
                ) : (
                  <span className="text-slate-400">Night / Dawn</span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Sliders & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time of Day Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> Time of Day
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                  {formatHour(currentSettings.timeOfDay)}
                </span>
              </div>
              <input
                type="range"
                min="6.0"
                max="18.0"
                step="0.25"
                value={currentSettings.timeOfDay}
                onChange={(e) =>
                  onUpdateSolarSettings({
                    ...currentSettings,
                    timeOfDay: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>6:00 AM (Sunrise)</span>
                <span>12:00 PM (Solar Noon)</span>
                <span>6:00 PM (Sunset)</span>
              </div>
            </div>

            {/* True North Orientation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-500" /> Project True North
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                  {currentSettings.northAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={currentSettings.northAngle}
                onChange={(e) =>
                  onUpdateSolarSettings({
                    ...currentSettings,
                    northAngle: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0° (Up)</span>
                <span>90° (East)</span>
                <span>180° (South)</span>
                <span>270° (West)</span>
              </div>
            </div>
          </div>

          {/* Season Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> Season / Solar Declination
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'summer', label: 'Summer Solstice', desc: 'Highest sun arc (+23.4°)' },
                { id: 'equinox', label: 'Spring / Autumn Equinox', desc: 'Moderate sun (0°)' },
                { id: 'winter', label: 'Winter Solstice', desc: 'Lowest sun arc (-23.4°)' },
              ].map((season) => (
                <button
                  key={season.id}
                  onClick={() =>
                    onUpdateSolarSettings({
                      ...currentSettings,
                      season: season.id as any,
                    })
                  }
                  className={`p-3 rounded-xl border text-left transition-all ${
                    currentSettings.season === season.id
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{season.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{season.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Geographic Location & Latitude */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" /> Geographic Latitude ({currentSettings.latitude.toFixed(1)}°)
            </span>
            <div className="flex flex-wrap gap-2">
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.name}
                  onClick={() =>
                    onUpdateSolarSettings({
                      ...currentSettings,
                      latitude: city.lat,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    Math.abs(currentSettings.latitude - city.lat) < 0.1
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Overlays Toggles */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={currentSettings.showCompass}
                onChange={(e) =>
                  onUpdateSolarSettings({
                    ...currentSettings,
                    showCompass: e.target.checked,
                  })
                }
                className="rounded accent-amber-500"
              />
              <span>Show Solar Compass on Drafting Canvas</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={currentSettings.showShadows}
                onChange={(e) =>
                  onUpdateSolarSettings({
                    ...currentSettings,
                    showShadows: e.target.checked,
                  })
                }
                className="rounded accent-amber-500"
              />
              <span>Cast Live Solar Shadows on 2D Plan</span>
            </label>
          </div>

          {/* Room Exposure Analysis Table */}
          {roomExposures.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Room Daylight & Exposure Assessment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roomExposures.map((exp) => (
                  <div
                    key={exp.roomId}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>{exp.roomName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {exp.exposureRating}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {exp.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
