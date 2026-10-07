import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
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

const DEFAULT_CENTER = [23.2599, 77.4126];

/* =========================
   MOVE MAP
========================= */

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        duration: 1.2,
      });
    }
  }, [position, map]);

  return null;
}

/* =========================
   CLICK LOCATION
========================= */

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

/* =========================
   EVENT MAP
========================= */

function EventMap({
  setLocation,
  enableLocationSelection = false,
}) {
  const [events, setEvents] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // SEARCH STATES
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  /* =========================
     FETCH EVENTS
  ========================= */

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

  /* =========================
     SELECT LOCATION
  ========================= */

  const handleLocationSelected = (position) => {
    setSelectedPosition([position.lat, position.lng]);

    if (setLocation) {
      setLocation(position);
    }
  };

  /* =========================
     SEARCH LOCATION
  ========================= */

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError("");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText
        )}&limit=5&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data = await response.json();

      setSearchResults(data);

      if (data.length === 0) {
        setSearchError("No locations found.");
      }
    } catch (error) {
      console.error("LOCATION SEARCH ERROR:", error);
      setSearchError("Unable to search location.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  /* =========================
     SELECT SEARCH RESULT
  ========================= */

  const handleSearchResult = (result) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    const position = {
      lat,
      lng,
    };

    console.log("SEARCH LOCATION SELECTED:", position);

    setSelectedPosition([lat, lng]);

    if (setLocation) {
      setLocation(position);
    }

    setSearchText(result.display_name);
    setSearchResults([]);
    setSearchError("");
  };

  return (
    <div className="event-map-wrapper">

      {/* =========================
          LOCATION SEARCH
      ========================= */}

      {enableLocationSelection && (
        <div className="location-search">

          <div className="location-search-row">

            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSearchError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search for a city, address or place..."
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>

          </div>

          {/* SEARCH RESULTS */}

          {searchResults.length > 0 && (
            <div className="location-search-results">

              {searchResults.map((result) => (
                <button
                  type="button"
                  key={result.place_id}
                  className="location-result"
                  onClick={() => handleSearchResult(result)}
                >
                  📍 {result.display_name}
                </button>
              ))}

            </div>
          )}

          {searchError && (
            <div className="location-search-error">
              {searchError}
            </div>
          )}

          <p className="location-search-help">
            Search for a location or click directly on the map.
          </p>

        </div>
      )}

      {/* =========================
          MAP
      ========================= */}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "500px",
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {enableLocationSelection && (
          <LocationSelector
            onLocationSelected={handleLocationSelected}
          />
        )}

        <MapController
          position={selectedPosition}
        />

        {/* SELECTED LOCATION */}

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

        {/* EXISTING EVENTS */}

        {events.map((event) => {
          const latitude = Number(
            event.location?.latitude
          );

          const longitude = Number(
            event.location?.longitude
          );

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
                    {new Date(
                      event.date
                    ).toLocaleString()}
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