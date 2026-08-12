import { useState } from "react";
import EventMap from "./components/EventMap";
import CreateEvent from "./components/CreateEvent";

function App() {
  const [location, setLocation] = useState(null);

  return (
    <div>
      <h1>Eventora</h1>

      <h2>Select Event Location</h2>

      <EventMap setLocation={setLocation} />

      {location && (
        <div style={{ padding: "20px" }}>
          <h3>Selected Location</h3>
          <p>Latitude: {location.lat.toFixed(6)}</p>
          <p>Longitude: {location.lng.toFixed(6)}</p>
        </div>
      )}

      <CreateEvent location={location} />
    </div>
  );
}

export default App;