\# 🌾 IoT Sensor Dashboard



A live, browser-based monitoring dashboard that simulates an agricultural IoT sensor network — designed as the visualization layer for a smart-farming system in \*\*Sierra Leone\*\*.



\*\*No backend. No hardware. No install. Runs entirely in the browser.\*\*



\---



\## What It Does



The dashboard displays \*\*eleven sensors\*\* updating in real time:



| Sensor | Unit | What It Monitors |

|---|---|---|

| 🌡️ Temperature | °C | Air temperature |

| 💧 Humidity | % | Relative humidity |

| 🌱 Soil Moisture | % | Volumetric water content |

| ☀️ Light Intensity | lux | Solar irradiance at canopy level |

| ⚗️ pH | — | Water / soil acidity |

| 🧪 TDS | ppm | Total dissolved solids (nutrients) |

| 🫧 Dissolved O₂ | mg/L | Oxygen in water (critical for aquaponics) |

| 🌫️ Turbidity | NTU | Water clarity |

| 📏 Water Level | cm | Reservoir / tank level |

| 🌧️ Rainfall | mm/h | Rain rate |

| 🔋 Battery | V | Sensor node power status |



Each sensor reports a \*\*status\*\* (optimal / warning / critical) based on the currently selected \*\*crop profile\*\*.



\---



\## Why I Built This



I'm designing an IoT framework for aquaponics farming in Sub-Saharan Africa as my BSc thesis. A sensor network without a way to \*see\* the data is not useful — farmers and system operators need a dashboard that tells them, at a glance, whether conditions are healthy.



This project is the visualization and monitoring layer of that framework. It runs entirely in a browser, so it can be deployed on any device with a screen — including low-cost tablets or phones in the field.



\---



\## Crop Profiles



The dashboard ships with five crop profiles, each with its own optimal and warning thresholds for every sensor:



| Profile | Use Case |

|---|---|

| \*\*Default\*\* | Generic safe ranges |

| \*\*Rice\*\* | High water demand, warm, slightly acidic |

| \*\*Maize\*\* | Moderate water, well-drained |

| \*\*Tomato\*\* | Greenhouse-sensitive, narrow ranges |

| \*\*Aquaponics (Tilapia + Greens)\*\* | Recirculating system, critical DO, stable pH |



Switch profiles from the dropdown and every threshold updates live. This is the same mechanism a real system would use to compare sensor readings against crop-specific targets.



\---



\## How the Simulation Works



This is not random noise. Each sensor follows realistic physical behavior:



\### Diurnal cycles

Temperature, humidity, and light follow a \*\*sine curve based on simulated time-of-day\*\*. The simulation starts at 06:00 (dawn) and each real 2-second tick advances the simulated clock by one minute. Sunrise is 06:30, sunset is 18:30 — realistic for Sierra Leone.



\### Physical correlations

\- \*\*Humidity\*\* inversely tracks temperature (warmer air holds more moisture but relative humidity drops)

\- \*\*Dissolved oxygen\*\* inversely tracks temperature (warm water holds less oxygen)

\- \*\*Light intensity\*\* follows a daylight curve, reduced by cloud cover

\- \*\*Turbidity\*\* spikes during rain events, then settles



\### Slow processes

\- \*\*Soil moisture\*\* evaporates slowly, jumps when irrigation or rain occurs

\- \*\*Water level\*\* drops from evaporation and rises from rain

\- \*\*Battery\*\* drains at night and charges in daylight

\- \*\*pH and TDS\*\* drift toward the current crop's optimal midpoint



\### Random events

\- \*\*Rain events\*\* occur with \~0.4% probability per tick — when they happen, they boost humidity, soil moisture, water level, and turbidity

\- \*\*Cloud cover\*\* drifts slowly and reduces light intensity



All of this runs client-side in `simulator.js`.



\---



\## Features



\- ⏱️ \*\*Live simulation\*\* — 11 sensors update every 2 seconds

\- 📈 \*\*Three real-time charts\*\* — temperature/humidity, soil/pH, DO/turbidity

\- 🚨 \*\*Smart alerts\*\* — logs transitions in and out of warning and critical zones

\- 🌾 \*\*Five crop profiles\*\* — each with realistic thresholds

\- ⏩ \*\*Speed controls\*\* — 1×, 2×, 5×, 10× time-lapse

\- ⏸️ \*\*Pause / resume\*\* — freeze the simulation at any moment

\- ↺ \*\*Reset\*\* — start fresh from 06:00

\- ⬇️ \*\*CSV export\*\* — download all readings for offline analysis



\---



\## Tech Stack



Plain HTML, CSS, and JavaScript. No framework, no build step, no backend.



| File | Purpose |

|---|---|

| `index.html` | Layout, controls, and chart containers |

| `style.css` | Styling — matches the portfolio theme |

| `data.js` | Sensor definitions, crop profiles, thresholds |

| `simulator.js` | Physics engine — generates realistic readings |

| `dashboard.js` | UI updates, charts, alerts, CSV export |



\*\*Dependencies:\*\* \[Chart.js](https://www.chartjs.org/) (loaded from CDN for the trend charts).



\---



\## Run Locally



```bash

git clone https://github.com/Alusine-bah/iot-sensor-dashboard.git

cd iot-sensor-dashboard

```



Then open `index.html` in any modern browser.



\*\*Live demo:\*\* https://alusine-bah.github.io/iot-sensor-dashboard/



\---



\## Connecting Real Sensors



The simulator produces an object like this every tick:



```javascript

{

&#x20; temperature: 24.3,

&#x20; humidity: 72,

&#x20; soil: 58,

&#x20; light: 42000,

&#x20; ph: 6.85,

&#x20; tds: 720,

&#x20; do: 7.42,

&#x20; turbidity: 6.1,

&#x20; waterlevel: 54.8,

&#x20; rainfall: 0,

&#x20; battery: 12.61

}

```



To connect real hardware, replace `SensorSimulator.tick()` with a function that reads from your sensor node — over \*\*MQTT\*\*, \*\*HTTP\*\*, or \*\*WebSocket\*\*. Everything downstream (`dashboard.js`) works unchanged.



This is the design pattern for a production deployment: the simulation and the visualization are decoupled.



\---



\## Roadmap



\- \[ ] Real MQTT / WebSocket adapter for live sensors

\- \[ ] Historical playback (scrub through past data)

\- \[ ] Threshold editor — adjust per-crop ranges from the UI

\- \[ ] Email / SMS alerts via a service like Twilio

\- \[ ] Multi-node support (multiple sensor stations on one dashboard)

\- \[ ] Mobile app wrapper (PWA)



\---



\## Accuracy \& Limitations



\*\*All data is simulated.\*\* This dashboard does not connect to real sensors — it demonstrates the visualization and alerting layer of the framework.



\*\*Crop thresholds are typical values\*\* from agricultural references, not field-calibrated for a specific location.



\*\*The physics is plausible, not exact.\*\* The simulator captures the direction and correlation of real sensor behavior, but is not a physical plant model.



\---



\## Author



\*\*Alusine Bah\*\*

Electrical \& Electronics Engineering Student

Islamic University of Technology (IUT), OIC

\[alusine-bah.github.io](https://alusine-bah.github.io) · \[GitHub](https://github.com/Alusine-bah)



\---



\## License



MIT — free to use, modify, and distribute.

