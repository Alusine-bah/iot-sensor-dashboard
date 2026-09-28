// ─────────────────────────────────────────────────────────────
// IoT Sensor Dashboard — Simulation Engine
// ─────────────────────────────────────────────────────────────
// Generates realistic sensor readings based on:
//   - Time of day (diurnal cycles)
//   - Physical correlations (e.g., humidity vs temperature)
//   - Random events (rainfall, cloud cover)
//   - Battery drain/charge cycles
// ─────────────────────────────────────────────────────────────

class SensorSimulator {
  constructor(config, sensorDefs, cropProfiles) {
    this.config = config;
    this.sensors = sensorDefs;
    this.crops = cropProfiles;

    // Simulation clock — starts at 06:00 (dawn)
    this.hour = 6.0;
    this.tickCount = 0;

    // State for each sensor (current reading)
    this.state = {
      temperature: 24,
      humidity: 75,
      soil: 65,
      light: 10000,
      ph: 6.8,
      tds: 700,
      do: 7.5,
      turbidity: 8,
      waterlevel: 55,
      rainfall: 0,
      battery: 12.6,
    };

    // Persistent state for physics
    this.cloudiness = 0.2;          // 0 = clear, 1 = heavy cloud
    this.rainEvent = 0;             // 0 = dry, >0 = rain intensity
    this.rainRemaining = 0;         // ticks until rain stops
    this.irrigationRemaining = 0;   // ticks of simulated irrigation

    this.currentCrop = config.location.defaultCrop;
  }

  setCrop(cropKey) {
    if (this.crops[cropKey]) {
      this.currentCrop = cropKey;
    }
  }

  // ── Advance simulation by one tick ─────────────────────────
  tick(speedMultiplier = 1) {
    const dt = (this.config.updateIntervalMs / 1000) * speedMultiplier;
    this.tickCount++;

    // Advance simulated clock (1 real second = 1 simulated minute)
    this.hour += (dt * 1) / 60;
    if (this.hour >= 24) this.hour -= 24;

    const daylight = this._daylightFactor();
    this._updateWeather();

    // ── Temperature (follows daily sine + weather effects) ──
    const tempBase = 20 + 10 * Math.sin(((this.hour - 6) / 24) * 2 * Math.PI);
    const tempWeather = this.cloudiness * -2;
    this.state.temperature = this._clamp(
      tempBase + tempWeather + this._noise(1.5),
      10, 45
    );

    // ── Humidity (inverse of temperature, plus rain boost) ──
    const humidityBase = 90 - (this.state.temperature - 20) * 1.5;
    const humidityRain = this.rainEvent * 15;
    this.state.humidity = this._clamp(
      humidityBase + humidityRain + this._noise(3),
      20, 100
    );

    // ── Light intensity (daylight curve, reduced by clouds) ──
    const maxLux = 90000;
    this.state.light = this._clamp(
      maxLux * daylight * (1 - this.cloudiness * 0.7) + this._noise(500),
      0, 100000
    );

    // ── Soil moisture (evaporation + irrigation + rain) ─────
    const evaporation = 0.15 * (1 + daylight * 0.5);
    const rainAdd = this.rainEvent * 0.8;
    const irrigationAdd = this.irrigationRemaining > 0 ? 2.0 : 0;
    if (this.irrigationRemaining > 0) this.irrigationRemaining--;

    this.state.soil = this._clamp(
      this.state.soil - evaporation + rainAdd + irrigationAdd + this._noise(0.3),
      0, 100
    );

    // Auto-irrigate when soil drops below 40%
    if (this.state.soil < 40 && this.irrigationRemaining === 0) {
      this.irrigationRemaining = 15;
    }

    // ── pH (slow drift around crop's optimal midpoint) ──────
    const phTarget = this._optimalMidpoint("ph");
    this.state.ph = this._clamp(
      this.state.ph + (phTarget - this.state.ph) * 0.05 + this._noise(0.02),
      3, 10
    );

    // ── TDS (nutrient concentration, drifts with rain dilution) ──
    const tdsTarget = 800;
    const rainDilution = this.rainEvent * -30;
    this.state.tds = this._clamp(
      this.state.tds + (tdsTarget - this.state.tds) * 0.03 + rainDilution + this._noise(15),
      0, 2000
    );

    // ── Dissolved oxygen (inverse to temperature, drops at night) ──
    const doBase = 10 - (this.state.temperature - 20) * 0.2;
    const doNight = (1 - daylight) * 1.5;
    this.state.do = this._clamp(
      doBase - doNight + this._noise(0.2),
      0, 12
    );

    // ── Turbidity (spikes during rain, settles otherwise) ───
    const turbidityTarget = 5 + this.rainEvent * 20;
    this.state.turbidity = this._clamp(
      this.state.turbidity + (turbidityTarget - this.state.turbidity) * 0.1 + this._noise(0.5),
      0, 100
    );

    // ── Water level (drops from evaporation, rises from rain) ──
    const waterEvap = 0.05 * (1 + this.state.temperature / 30);
    const waterRain = this.rainEvent * 0.4;
    this.state.waterlevel = this._clamp(
      this.state.waterlevel - waterEvap + waterRain + this._noise(0.2),
      0, 100
    );

    // ── Rainfall (only during rain events) ──────────────────
    this.state.rainfall = this.rainEvent > 0
      ? this._clamp(this.rainEvent * 20 + this._noise(2), 0, 50)
      : 0;

    // ── Battery (drains at night, charges in daylight) ──────
    if (daylight > 0.1 && this.state.battery < 13.8) {
      this.state.battery = this._clamp(
        this.state.battery + this.config.batteryChargePerTick * daylight,
        10, 14.5
      );
    } else {
      this.state.battery = this._clamp(
        this.state.battery - this.config.batteryDrainPerTick,
        10, 14.5
      );
    }

    // Round each value to its declared precision
    const rounded = {};
    for (const s of this.sensors) {
      const v = this.state[s.id] ?? 0;
      rounded[s.id] = +v.toFixed(s.decimals);
    }
    return rounded;
  }

  // ── Helpers ─────────────────────────────────────────────────

  _daylightFactor() {
    // Returns 0 at night, 1 at solar noon, smooth sine between
    const { sunrise, sunset } = this.config.location;
    if (this.hour < sunrise || this.hour > sunset) return 0;
    const progress = (this.hour - sunrise) / (sunset - sunrise); // 0..1
    return Math.sin(progress * Math.PI);
  }

  _updateWeather() {
    // Rain events occur randomly with low probability
    if (this.rainRemaining > 0) {
      this.rainRemaining--;
      if (this.rainRemaining === 0) this.rainEvent = 0;
    } else if (Math.random() < 0.004) {
      // Start a new rain event (~0.4% chance per tick)
      this.rainEvent = 0.3 + Math.random() * 0.7;
      this.rainRemaining = 20 + Math.floor(Math.random() * 40);
    }

    // Cloudiness drifts slowly
    this.cloudiness = this._clamp(
      this.cloudiness + this._noise(0.05),
      0, 0.9
    );
    // Clouds thin when no rain
    if (this.rainEvent === 0) {
      this.cloudiness = Math.max(0, this.cloudiness - 0.01);
    }
  }

  _optimalMidpoint(sensorId) {
    const profile = this.crops[this.currentCrop] || this.crops.default;
    const range = profile.thresholds[sensorId]?.optimal;
    if (!range) return 0;
    return (range[0] + range[1]) / 2;
  }

  _clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  _noise(amplitude) {
    return (Math.random() - 0.5) * 2 * amplitude * this.config.noiseLevel;
  }
}

// ── Status evaluation (used by dashboard.js) ─────────────────
function evaluateStatus(sensorId, value, cropKey, cropProfiles) {
  const profile = cropProfiles[cropKey] || cropProfiles.default;
  const t = profile.thresholds[sensorId];
  if (!t) return "optimal";

  const [optMin, optMax] = t.optimal;
  const [warnMin, warnMax] = t.warning;

  if (value >= optMin && value <= optMax) return "optimal";
  if (value >= warnMin && value <= warnMax) return "warning";
  return "critical";
}