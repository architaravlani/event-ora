
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const eventIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationSelector({ onLocationSelected }) {
  useMapEvents({
    click(event) {
      const position = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };

      console.log("MAP LOCATION SELECTED:", position);

      onLocationSelected(position);
    },
  });

  return null;
}

function EventMap({
  setLocation,
  enableLocationSelection = false,
}) {
  const [events, setEvents] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/events`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();

        setEvents(data);
      } catch (error) {
        console.error("FETCH EVENTS ERROR:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleLocationSelected = (position) => {
    setSelectedPosition([position.lat, position.lng]);

    if (setLocation) {
      setLocation(position);
    }
  };

  return (
    <div className="event-map">
      <MapContainer
        center={[23.2599, 77.4126]}
        zoom={13}
        style={{
          width: "100%",
          height: "500px",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* CLICK-TO-SELECT MODE */}
        {enableLocationSelection && (
          <LocationSelector
            onLocationSelected={handleLocationSelected}
          />
        )}

        {/* BLUE SELECTED MARKER */}
        {enableLocationSelection && selectedPosition && (
          <Marker
            position={selectedPosition}
            icon={selectedIcon}
          >
            <Popup>
              <strong>Selected Event Location</strong>
              <br />
              This location will be used for your new event.
            </Popup>
          </Marker>
        )}

        {/* EXISTING EVENT MARKERS */}
        {events.map((event) => {
          const latitude = Number(event.location?.latitude);
          const longitude = Number(event.location?.longitude);

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            return null;
          }

          return (
            <Marker
              key={event._id}
              position={[latitude, longitude]}
              icon={eventIcon}
            >
              <Popup>
                <strong>{event.title}</strong>

                {event.description && (
                  <>
                    <br />
                    {event.description}
                  </>
                )}

                <br />

                📍{" "}
                {event.location?.address ||
                  "Location not provided"}

                {event.date && (
                  <>
                    <br />
                    <strong>Date:</strong>{" "}
                    {new Date(event.date).toLocaleString()}
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default EventMap;

