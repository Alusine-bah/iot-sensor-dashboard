// ─────────────────────────────────────────────────────────────
// IoT Sensor Dashboard — Main Application
// ─────────────────────────────────────────────────────────────
// Renders sensor cards, updates live values, draws charts,
// logs alerts, and handles user controls.
// ─────────────────────────────────────────────────────────────

// ── Global state ─────────────────────────────────────────────
let simulator;
let isRunning = true;
let speedMultiplier = 1;
let uptimeSeconds = 0;
let readingsLogged = 0;
let alertLog = [];
const MAX_ALERTS = 30;

// Charts and history buffers
let charts = {};
let history = {};   // { sensorId: [values...] }
let timestamps = []; // parallel time labels for charts

// Track which sensors are currently outside optimal (to avoid duplicate alerts)
const alertState = {};

// ── Initialization ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  simulator = new SensorSimulator(SIM_CONFIG, SENSORS, CROP_PROFILES);
  initHistory();
  populateCropSelector();
  renderSensorCards();
  initCharts();
  attachControls();

  // Main loop
  setInterval(mainTick, SIM_CONFIG.updateIntervalMs);
  // Uptime counter (every 1 real second)
  setInterval(() => { if (isRunning) uptimeSeconds++; }, 1000);
});

function initHistory() {
  SENSORS.forEach(s => { history[s.id] = []; });
}

function populateCropSelector() {
  const select = document.getElementById("crop-select");
  select.innerHTML = "";
  Object.keys(CROP_PROFILES).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = CROP_PROFILES[key].name;
    if (key === SIM_CONFIG.location.defaultCrop) opt.selected = true;
    select.appendChild(opt);
  });
}

// ── Sensor cards ─────────────────────────────────────────────
function renderSensorCards() {
  const grid = document.getElementById("sensor-grid");
  grid.innerHTML = "";
  SENSORS.forEach(s => {
    const card = document.createElement("div");
    card.className = "sensor-card status-optimal";
    card.id = "card-" + s.id;
    card.innerHTML = `
      <div class="sensor-header">
        <span class="sensor-label">${s.label}</span>
        <span class="sensor-icon">${s.icon}</span>
      </div>
      <div class="sensor-value-row">
        <span class="sensor-value" id="val-${s.id}">—</span>
        <span class="sensor-unit">${s.unit}</span>
      </div>
      <div class="sensor-status optimal" id="status-${s.id}">Optimal</div>
    `;
    grid.appendChild(card);
  });
}

// ── Charts ───────────────────────────────────────────────────
function initCharts() {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: {
      x: { display: false },
      y: { ticks: { font: { size: 10 } }, grid: { color: "#eef2f8" } },
    },
  };

  charts.tempHumidity = new Chart(document.getElementById("chart-temp-humidity"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Temperature (°C)", data: [], borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 0 },
        { label: "Humidity (%)",      data: [], borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 0 },
      ],
    },
    options: commonOptions,
  });

  charts.soilPh = new Chart(document.getElementById("chart-soil-ph"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Soil Moisture (%)", data: [], borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 0 },
        { label: "pH",                data: [], borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 0, yAxisID: "y1" },
      ],
    },
    options: {
      ...commonOptions,
      scales: {
        x: { display: false },
        y:  { position: "left",  ticks: { font: { size: 10 } }, grid: { color: "#eef2f8" } },
        y1: { position: "right", ticks: { font: { size: 10 } }, grid: { drawOnChartArea: false } },
      },
    },
  });

  charts.doTurbidity = new Chart(document.getElementById("chart-do-turbidity"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Dissolved O₂ (mg/L)", data: [], borderColor: "#06b6d4", backgroundColor: "rgba(6,182,212,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 0 },
        { label: "Turbidity (NTU)",     data: [], borderColor: "#a16207", backgroundColor: "rgba(161,98,7,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 0, yAxisID: "y1" },
      ],
    },
    options: {
      ...commonOptions,
      scales: {
        x: { display: false },
        y:  { position: "left",  ticks: { font: { size: 10 } }, grid: { color: "#eef2f8" } },
        y1: { position: "right", ticks: { font: { size: 10 } }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

function updateCharts() {
  const maxPoints = SIM_CONFIG.historyPoints;

  // Trim history
  SENSORS.forEach(s => {
    if (history[s.id].length > maxPoints) history[s.id].shift();
  });
  if (timestamps.length > maxPoints) timestamps.shift();

  // Update each chart
  charts.tempHumidity.data.labels = timestamps;
  charts.tempHumidity.data.datasets[0].data = history.temperature;
  charts.tempHumidity.data.datasets[1].data = history.humidity;
  charts.tempHumidity.update();

  charts.soilPh.data.labels = timestamps;
  charts.soilPh.data.datasets[0].data = history.soil;
  charts.soilPh.data.datasets[1].data = history.ph;
  charts.soilPh.update();

  charts.doTurbidity.data.labels = timestamps;
  charts.doTurbidity.data.datasets[0].data = history.do;
  charts.doTurbidity.data.datasets[1].data = history.turbidity;
  charts.doTurbidity.update();
}

// ── Main simulation tick ─────────────────────────────────────
function mainTick() {
  if (!isRunning) return;

  const reading = simulator.tick(speedMultiplier);
  readingsLogged++;

  // Append to history
  const timeLabel = formatSimTime(simulator.hour);
  timestamps.push(timeLabel);
  SENSORS.forEach(s => { history[s.id].push(reading[s.id]); });

  // Update sensor cards
  const crop = document.getElementById("crop-select").value;
  SENSORS.forEach(s => {
    const value = reading[s.id];
    const status = evaluateStatus(s.id, value, crop, CROP_PROFILES);
    updateSensorCard(s, value, status);
    maybeAlert(s, value, status);
  });

  // Update charts
  updateCharts();

  // Update status bar
  updateStatusBar(reading);
}

function updateSensorCard(sensor, value, status) {
  const valEl = document.getElementById("val-" + sensor.id);
  const statusEl = document.getElementById("status-" + sensor.id);
  const cardEl = document.getElementById("card-" + sensor.id);

  if (!valEl) return;

  valEl.textContent = formatValue(value, sensor.decimals);
  statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  statusEl.className = "sensor-status " + status;
  cardEl.className = "sensor-card status-" + status;
}

function updateStatusBar(reading) {
  document.getElementById("sim-clock").textContent = formatSimTime(simulator.hour);
  document.getElementById("stat-battery").textContent = reading.battery.toFixed(2) + " V";
  document.getElementById("stat-readings").textContent = readingsLogged.toLocaleString();
  document.getElementById("stat-uptime").textContent = formatUptime(uptimeSeconds);
}

// ── Alerts ───────────────────────────────────────────────────
function maybeAlert(sensor, value, status) {
  const prev = alertState[sensor.id];

  // Only alert on transition into warning/critical, or recovery
  if (status === prev) return;
  alertState[sensor.id] = status;

  if (status === "critical") {
    addAlert("critical", `${sensor.icon} ${sensor.label} is ${formatValue(value, sensor.decimals)} ${sensor.unit} — out of range`);
  } else if (status === "warning") {
    addAlert("warning", `${sensor.icon} ${sensor.label} entering warning zone (${formatValue(value, sensor.decimals)} ${sensor.unit})`);
  } else if (prev && prev !== "optimal") {
    addAlert("optimal", `${sensor.icon} ${sensor.label} returned to optimal range`);
  }
}

function addAlert(level, message) {
  const log = document.getElementById("alert-log");

  // Remove empty placeholder on first alert
  const empty = log.querySelector(".alert-empty");
  if (empty) empty.remove();

  const el = document.createElement("div");
  el.className = "alert-item " + level;
  el.innerHTML = `
    <span>${message}</span>
    <span class="alert-time">${formatSimTime(simulator.hour)}</span>
  `;
  log.prepend(el);

  // Keep only the latest MAX_ALERTS
  while (log.children.length > MAX_ALERTS) {
    log.removeChild(log.lastChild);
  }
}

// ── Controls ─────────────────────────────────────────────────
function attachControls() {
  document.getElementById("crop-select").addEventListener("change", e => {
    simulator.setCrop(e.target.value);
    addAlert("optimal", `📋 Crop profile changed to ${CROP_PROFILES[e.target.value].name}`);
  });

  document.getElementById("speed-select").addEventListener("change", e => {
    speedMultiplier = +e.target.value;
  });

  document.getElementById("btn-play").addEventListener("click", e => {
    isRunning = !isRunning;
    e.target.textContent = isRunning ? "⏸ Pause" : "▶ Play";
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    simulator = new SensorSimulator(SIM_CONFIG, SENSORS, CROP_PROFILES);
    initHistory();
    readingsLogged = 0;
    uptimeSeconds = 0;
    alertLog = [];
    Object.keys(alertState).forEach(k => delete alertState[k]);
    document.getElementById("alert-log").innerHTML =
      '<div class="alert-empty">No alerts yet. System is within normal parameters.</div>';
    timestamps.length = 0;
    SENSORS.forEach(s => { history[s.id] = []; });
    updateCharts();
  });

  document.getElementById("btn-export").addEventListener("click", exportCSV);
}

function exportCSV() {
  const headers = ["sim_time", ...SENSORS.map(s => s.id)];
  const rows = [headers.join(",")];

  for (let i = 0; i < timestamps.length; i++) {
    const row = [timestamps[i]];
    SENSORS.forEach(s => row.push(history[s.id][i] ?? ""));
    rows.push(row.join(","));
  }

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sensor-data-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ─────────────────────────────────────────────────
function formatValue(v, decimals) {
  if (v === undefined || v === null) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatSimTime(hour) {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function formatUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}