// ─────────────────────────────────────────────────────────────
// IoT Sensor Dashboard — Data Definitions
// ─────────────────────────────────────────────────────────────
// Sensors, crop profiles, thresholds, and configuration.
// ─────────────────────────────────────────────────────────────

// ── SENSOR DEFINITIONS ───────────────────────────────────────
// Each sensor has: id, label, unit, icon, typical range for the
// simulation, and decimal precision for display.
const SENSORS = [
  { id: "temperature", label: "Temperature",      unit: "°C",   icon: "🌡️", min: 10,   max: 45,    decimals: 1 },
  { id: "humidity",    label: "Humidity",         unit: "%",    icon: "💧", min: 20,   max: 100,   decimals: 0 },
  { id: "soil",        label: "Soil Moisture",    unit: "%",    icon: "🌱", min: 0,    max: 100,   decimals: 0 },
  { id: "light",       label: "Light Intensity",  unit: "lux",  icon: "☀️", min: 0,    max: 100000, decimals: 0 },
  { id: "ph",          label: "pH",               unit: "",     icon: "⚗️", min: 3,    max: 10,    decimals: 2 },
  { id: "tds",         label: "TDS",              unit: "ppm",  icon: "🧪", min: 0,    max: 2000,  decimals: 0 },
  { id: "do",          label: "Dissolved O₂",     unit: "mg/L", icon: "🫧", min: 0,    max: 12,    decimals: 2 },
  { id: "turbidity",   label: "Turbidity",        unit: "NTU",  icon: "🌫️", min: 0,    max: 100,   decimals: 1 },
  { id: "waterlevel",  label: "Water Level",      unit: "cm",   icon: "📏", min: 0,    max: 100,   decimals: 1 },
  { id: "rainfall",    label: "Rainfall",         unit: "mm/h", icon: "🌧️", min: 0,    max: 50,    decimals: 1 },
  { id: "battery",     label: "Battery",          unit: "V",    icon: "🔋", min: 10,   max: 14,    decimals: 2 },
];

// ── CROP PROFILES ────────────────────────────────────────────
// For each crop: optimal range [green], warning range [yellow],
// anything outside = red. Values are realistic for the crop.
const CROP_PROFILES = {
  default: {
    name: "Default / Generic",
    description: "Generic safe ranges — use if you don't know your crop.",
    thresholds: {
      temperature: { optimal: [18, 30],  warning: [12, 38] },
      humidity:    { optimal: [50, 85],  warning: [30, 95] },
      soil:        { optimal: [40, 80],  warning: [20, 95] },
      light:       { optimal: [10000, 70000], warning: [3000, 95000] },
      ph:          { optimal: [6.0, 7.5], warning: [5.0, 8.5] },
      tds:         { optimal: [300, 1200], warning: [100, 1700] },
      do:          { optimal: [5, 9],    warning: [3, 11] },
      turbidity:   { optimal: [0, 25],   warning: [0, 50] },
      waterlevel:  { optimal: [30, 80],  warning: [15, 95] },
      rainfall:    { optimal: [0, 15],   warning: [0, 35] },
      battery:     { optimal: [11.5, 14], warning: [10.5, 14.5] },
    },
  },

  rice: {
    name: "Rice",
    description: "High water demand, warm temperatures, slightly acidic soil.",
    thresholds: {
      temperature: { optimal: [22, 32],  warning: [18, 38] },
      humidity:    { optimal: [70, 90],  warning: [55, 98] },
      soil:        { optimal: [80, 100], warning: [60, 100] },
      light:       { optimal: [15000, 80000], warning: [5000, 100000] },
      ph:          { optimal: [5.5, 6.5], warning: [4.5, 7.5] },
      tds:         { optimal: [200, 800], warning: [100, 1200] },
      do:          { optimal: [4, 8],    warning: [2, 10] },
      turbidity:   { optimal: [5, 40],   warning: [0, 70] },
      waterlevel:  { optimal: [60, 95],  warning: [40, 100] },
      rainfall:    { optimal: [0, 25],   warning: [0, 45] },
      battery:     { optimal: [11.5, 14], warning: [10.5, 14.5] },
    },
  },

  maize: {
    name: "Maize (Corn)",
    description: "Moderate water, warm, well-drained soil.",
    thresholds: {
      temperature: { optimal: [18, 32],  warning: [14, 38] },
      humidity:    { optimal: [50, 80],  warning: [35, 92] },
      soil:        { optimal: [50, 75],  warning: [30, 90] },
      light:       { optimal: [20000, 85000], warning: [8000, 100000] },
      ph:          { optimal: [5.8, 7.0], warning: [5.0, 8.0] },
      tds:         { optimal: [300, 1000], warning: [150, 1400] },
      do:          { optimal: [5, 9],    warning: [3, 11] },
      turbidity:   { optimal: [0, 20],   warning: [0, 45] },
      waterlevel:  { optimal: [25, 60],  warning: [10, 80] },
      rainfall:    { optimal: [0, 12],   warning: [0, 30] },
      battery:     { optimal: [11.5, 14], warning: [10.5, 14.5] },
    },
  },

  tomato: {
    name: "Tomato (Greenhouse)",
    description: "Sensitive crop — narrow ranges, controlled environment.",
    thresholds: {
      temperature: { optimal: [20, 27],  warning: [16, 32] },
      humidity:    { optimal: [60, 80],  warning: [45, 90] },
      soil:        { optimal: [60, 80],  warning: [40, 90] },
      light:       { optimal: [25000, 80000], warning: [10000, 95000] },
      ph:          { optimal: [6.0, 6.8], warning: [5.5, 7.5] },
      tds:         { optimal: [500, 1500], warning: [300, 2000] },
      do:          { optimal: [6, 10],   warning: [4, 11] },
      turbidity:   { optimal: [0, 15],   warning: [0, 35] },
      waterlevel:  { optimal: [35, 70],  warning: [20, 85] },
      rainfall:    { optimal: [0, 8],    warning: [0, 20] },
      battery:     { optimal: [11.5, 14], warning: [10.5, 14.5] },
    },
  },

  aquaponics: {
    name: "Aquaponics (Tilapia + Greens)",
    description: "Recirculating system — critical DO, stable pH, low turbidity.",
    thresholds: {
      temperature: { optimal: [24, 28],  warning: [20, 31] },
      humidity:    { optimal: [55, 75],  warning: [40, 88] },
      soil:        { optimal: [0, 100],  warning: [0, 100] },  // N/A in aquaponics
      light:       { optimal: [15000, 70000], warning: [5000, 90000] },
      ph:          { optimal: [6.8, 7.2], warning: [6.2, 7.8] },
      tds:         { optimal: [600, 1400], warning: [300, 1800] },
      do:          { optimal: [6, 10],   warning: [5, 11] },
      turbidity:   { optimal: [0, 10],   warning: [0, 25] },
      waterlevel:  { optimal: [50, 90],  warning: [30, 98] },
      rainfall:    { optimal: [0, 5],    warning: [0, 15] },  // greenhouse
      battery:     { optimal: [11.5, 14], warning: [10.5, 14.5] },
    },
  },
};

// ── SIMULATION CONFIGURATION ─────────────────────────────────
const SIM_CONFIG = {
  updateIntervalMs: 2000,     // 2 seconds per tick at 1x speed
  historyPoints: 90,          // keep last 90 readings per sensor (~3 min)
  batteryDrainPerTick: 0.002, // volts per tick at night
  batteryChargePerTick: 0.006,// volts per tick in daylight
  noiseLevel: 0.15,           // global noise multiplier
  // Sierra Leone context
  location: {
    name: "Sierra Leone",
    latitude: 8.48,
    timezone: "GMT",
    sunrise: 6.5,             // 06:30
    sunset: 18.5,             // 18:30
    defaultCrop: "rice",
  },
};

// ── STATUS COLORS (used by dashboard.js) ─────────────────────
const STATUS_COLORS = {
  optimal: "#22c55e",   // green
  warning: "#f59e0b",   // amber
  critical: "#ef4444",  // red
};