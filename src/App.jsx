import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./App.css";

const places = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Kolhapur: { lat: 16.705, lng: 74.2433 },
  Sangli: { lat: 16.8524, lng: 74.5815 },
  Satara: { lat: 17.6805, lng: 74.0183 },
  Solapur: { lat: 17.6599, lng: 75.9064 },
  Aurangabad: { lat: 19.8762, lng: 75.3433 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Goa: { lat: 15.4909, lng: 73.8278 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Indore: { lat: 22.7196, lng: 75.8577 },
};

const weatherData = {
  Mumbai: ["🌧️ Rainy", "High", 28],
  Pune: ["☀️ Clear", "Low", 30],
  Kolhapur: ["🌤️ Partly Cloudy", "Low", 27],
  Sangli: ["☀️ Clear", "Low", 29],
  Satara: ["🌥️ Cloudy", "Medium", 26],
  Solapur: ["☀️ Clear", "Low", 31],
  Aurangabad: ["🌤️ Clear", "Low", 30],
  Nashik: ["🌦️ Light Rain", "Medium", 25],
  Nagpur: ["☀️ Clear", "Low", 32],
  Goa: ["🌧️ Rainy", "High", 27],
  Bengaluru: ["🌦️ Light Rain", "Medium", 25],
  Hyderabad: ["☀️ Clear", "Low", 31],
  Ahmedabad: ["☀️ Clear", "Low", 33],
  Indore: ["🌤️ Clear", "Low", 29],
};

function distanceKm(a, b) {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * y;
}

function createRoute(start, end, routeNumber) {
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;

  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  const offset = {
    1: 0.8,
    2: -1.0,
    3: 1.4,
  }[routeNumber];

  const bendLat = midLat + (-dx / length) * offset;
  const bendLng = midLng + (dy / length) * offset;

  return [
    [start.lat, start.lng],
    [bendLat, bendLng],
    [end.lat, end.lng],
  ];
}

function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 7, {
      duration: 1.2,
    });
  }, [center, map]);

  return null;
}

function App() {
  const [from, setFrom] = useState("Kolhapur");
  const [to, setTo] = useState("Pune");
  const [vehicle, setVehicle] = useState("Car");

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  const [searchedFrom, setSearchedFrom] = useState("Kolhapur");
  const [searchedTo, setSearchedTo] = useState("Pune");

  const start = places[searchedFrom];
  const end = places[searchedTo];

  const baseDistance = useMemo(() => {
    return distanceKm(start, end);
  }, [start, end]);

  const routes = useMemo(() => {
    const speed = {
      Car: [70, 65, 78],
      Bike: [55, 50, 62],
      Bus: [60, 55, 68],
    }[vehicle];

    const multipliers = [1.05, 1.12, 1.02];

    return [1, 2, 3].map((number) => {
      const distance = Math.round(baseDistance * multipliers[number - 1]);

      const timeHours = distance / speed[number - 1];

      const hours = Math.floor(timeHours);
      const minutes = Math.round((timeHours - hours) * 60);

      const safety = {
        1: 92,
        2: 76,
        3: 61,
      }[number];

      return {
        number,
        distance,
        hours,
        minutes,
        safety,
        points: createRoute(start, end, number),
      };
    });
  }, [baseDistance, vehicle, start, end]);

  const selectedRoute = routes[0];

  const weather = weatherData[searchedTo] || [
    "☀️ Clear",
    "Low",
    29,
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      return;
    }

    setLocationMessage("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);

        setCurrentLocation({
          lat: Number(lat),
          lng: Number(lng),
        });

        setLocationMessage(`📍 Current location: ${lat}, ${lng}`);
      },
      () => {
        setLocationMessage(
          "Unable to get location. Please allow location permission."
        );
      }
    );
  };

  const findSafeRoute = () => {
    if (from === to) {
      alert("Please select different Source and Destination.");
      return;
    }

    setSearchedFrom(from);
    setSearchedTo(to);
  };

  const center = [
    (start.lat + end.lat) / 2,
    (start.lng + end.lng) / 2,
  ];

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="logo">
          🛡️ <span>AI</span> Road Safety
        </div>

        <div className="tagline">
          Safer Roads • Smarter Journeys
        </div>

        <nav>
          <span>⌂ Home</span>
          <span>◷ History</span>
          <span>ⓘ About</span>
        </nav>
      </header>


      {/* MAIN */}
      <main>

        {/* LEFT PANEL */}
        <section className="search-panel">

          <h1>Plan Your Safe Route</h1>

          <p>
            Select your source and destination to find
            the safest available route.
          </p>

          <label>📍 From</label>

          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {Object.keys(places).map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>


          <label>📍 To</label>

          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {Object.keys(places).map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>


          <label>🚗 Vehicle Type</label>

          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            <option>Car</option>
            <option>Bike</option>
            <option>Bus</option>
          </select>


          <button
            className="find-btn"
            onClick={findSafeRoute}
          >
            🔍 Find Safe Route
          </button>


          <hr />

          <h3>Quick Options</h3>

          <button
            className="location-btn"
            onClick={getCurrentLocation}
          >
            🎯 Use Current Location
          </button>

          {locationMessage && (
            <p className="location-message">
              {locationMessage}
            </p>
          )}

          <p>◷ View Route History</p>

        </section>


        {/* MAP */}
        <section className="map-section">

          <div className="map-header">

            <button className="active-map">
              Map
            </button>

            <span>Satellite</span>

            <div className="legend">
              <span className="green-dot">● Route 1</span>
              <span className="yellow-dot">● Route 2</span>
              <span className="red-dot">● Route 3</span>
              <span>⚠️ Hazard</span>
            </div>

          </div>


          <div className="map-container">

            <MapContainer
              center={center}
              zoom={7}
              scrollWheelZoom={true}
              className="leaflet-map"
            >

              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController center={center} />


              {/* ROUTE 2 */}
              <Polyline
                positions={routes[1].points}
                pathOptions={{
                  color: "#f5b82e",
                  weight: 7,
                  opacity: 0.9,
                }}
              />


              {/* ROUTE 3 */}
              <Polyline
                positions={routes[2].points}
                pathOptions={{
                  color: "#ef476f",
                  weight: 7,
                  opacity: 0.9,
                }}
              />


              {/* ROUTE 1 */}
              <Polyline
                positions={routes[0].points}
                pathOptions={{
                  color: "#12b76a",
                  weight: 9,
                  opacity: 1,
                }}
              />


              {/* SOURCE */}
              <CircleMarker
                center={[start.lat, start.lng]}
                radius={11}
                pathOptions={{
                  color: "#087cf0",
                  fillColor: "#087cf0",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <b>📍 Source</b>
                  <br />
                  {searchedFrom}
                </Popup>
              </CircleMarker>


              {/* DESTINATION */}
              <CircleMarker
                center={[end.lat, end.lng]}
                radius={11}
                pathOptions={{
                  color: "#e63946",
                  fillColor: "#e63946",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <b>🏁 Destination</b>
                  <br />
                  {searchedTo}
                </Popup>
              </CircleMarker>


              {/* CURRENT LOCATION */}
              {currentLocation && (
                <CircleMarker
                  center={[
                    currentLocation.lat,
                    currentLocation.lng,
                  ]}
                  radius={9}
                  pathOptions={{
                    color: "#7b2cbf",
                    fillColor: "#7b2cbf",
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    📍 Your Current Location
                  </Popup>
                </CircleMarker>
              )}

            </MapContainer>


            {/* ROUTE LABELS */}
            <div className="route-label route1-label">
              🟢 Route 1 • Safest
            </div>

            <div className="route-label route2-label">
              🟡 Route 2 • Balanced
            </div>

            <div className="route-label route3-label">
              🔴 Route 3 • Fastest
            </div>

          </div>

        </section>


        {/* RIGHT PANEL */}
        <section className="safety-panel">

          <div className="score">

            <h3>🛡️ Overall Safety Score</h3>

            <strong>
              {selectedRoute.safety} / 100
            </strong>

            <span>
              {selectedRoute.safety >= 85
                ? "Very Safe"
                : selectedRoute.safety >= 70
                ? "Moderately Safe"
                : "Use Caution"}
            </span>

          </div>


          <div className="info">
            <p>🛣️ Road Condition</p>
            <b>
              {selectedRoute.safety >= 85
                ? "Good"
                : selectedRoute.safety >= 70
                ? "Moderate"
                : "Poor"}
            </b>
          </div>


          <div className="info">
            <p>🌦️ Weather</p>
            <b>{weather[0]}</b>
          </div>


          <div className="info">
            <p>🌡️ Temperature</p>
            <b>{weather[2]} °C</b>
          </div>


          <div className="info">
            <p>🚗 Traffic Condition</p>
            <b>
              {selectedRoute.safety >= 85
                ? "Low"
                : selectedRoute.safety >= 70
                ? "Moderate"
                : "High"}
            </b>
          </div>


          <div className="info">
            <p>⚠️ Construction / Hazards</p>
            <b>
              {selectedRoute.number === 1
                ? "1 found"
                : selectedRoute.number === 2
                ? "2 found"
                : "3 found"}
            </b>
          </div>


          <hr />


          <div className="time">

            ⏱️ Estimated Time

            <strong>
              {selectedRoute.hours} h{" "}
              {selectedRoute.minutes} min
            </strong>

          </div>


          <div className="time">

            📍 Distance

            <strong>
              {selectedRoute.distance} km
            </strong>

          </div>


          <div className="safe-message">

            💡 This route is selected based on
            road condition, traffic, weather,
            hazards and available route information.

          </div>

        </section>

      </main>


      {/* ROUTES */}
      <section className="routes">

        <h2>Available Routes</h2>

        <div className="route-cards">

          {/* ROUTE 1 */}
          <div className="card safest">

            <h3>🟢 Route 1 (Safest)</h3>

            <h2>
              {routes[0].safety}% Safety
            </h2>

            <p>
              📍 {routes[0].distance} km
              &nbsp; ⏱️ {routes[0].hours} h{" "}
              {routes[0].minutes} min
            </p>

            <p>🟢 Good road condition</p>
            <p>🟢 Low traffic</p>
            <p>🟢 Fewer hazards</p>

            <button>
              Recommended
            </button>

          </div>


          {/* ROUTE 2 */}
          <div className="card route2-card">

            <h3>🟡 Route 2 (Balanced)</h3>

            <h2>
              {routes[1].safety}% Safety
            </h2>

            <p>
              📍 {routes[1].distance} km
              &nbsp; ⏱️ {routes[1].hours} h{" "}
              {routes[1].minutes} min
            </p>

            <p>🟡 Moderate road condition</p>
            <p>🟡 Moderate traffic</p>
            <p>⚠️ 2 hazards</p>

          </div>


          {/* ROUTE 3 */}
          <div className="card route3-card">

            <h3>🔴 Route 3 (Fastest)</h3>

            <h2>
              {routes[2].safety}% Safety
            </h2>

            <p>
              📍 {routes[2].distance} km
              &nbsp; ⏱️ {routes[2].hours} h{" "}
              {routes[2].minutes} min
            </p>

            <p>🔴 Poor road condition</p>
            <p>🔴 Higher traffic</p>
            <p>🔴 3 hazards</p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default App;