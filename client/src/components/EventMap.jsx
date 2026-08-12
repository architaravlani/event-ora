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

// 🔴 Marker for saved events
const eventIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// 🔵 Marker for newly selected location
const selectedIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Handles clicking on the map
function LocationSelector({ setLocation, setSelectedPosition }) {
  useMapEvents({
    click(e) {
      const newLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      setLocation(newLocation);
      setSelectedPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

function EventMap({ setLocation }) {
  const [events, setEvents] = useState([]);

  // 🔵 Currently selected location
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Get existing events from MongoDB
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/events`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        return response.json();
      })
      .then((data) => {
        console.log("Events received:", data);
        setEvents(data);
      })
      .catch((error) => {
        console.error("FETCH ERROR:", error);
      });
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
      }}
    >
      <MapContainer
        center={[23.2599, 77.4126]}
        zoom={13}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Click map to select a new event location */}
        <LocationSelector
          setLocation={setLocation}
          setSelectedPosition={setSelectedPosition}
        />

        {/* 🔵 Selected location marker */}
        {selectedPosition && (
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

        {/* 🔴 Existing event markers from MongoDB */}
        {events.map((event) => {
          const latitude = Number(event.location?.latitude);
          const longitude = Number(event.location?.longitude);

          // Ignore invalid locations
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

                <br />

                {event.description && (
                  <>
                    {event.description}
                    <br />
                  </>
                )}

                📍 {event.location?.address}

                <br />

                <strong>Latitude:</strong> {latitude}

                <br />

                <strong>Longitude:</strong> {longitude}

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