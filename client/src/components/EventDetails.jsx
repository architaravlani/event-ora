import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// Leaflet marker fix
const eventIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function EventDetails({ eventId, onBack }) {
  const [event, setEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // =========================
  // LOAD LOGGED-IN USER
  // =========================
  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem("eventoraUser");

      if (savedUser) {
        const user = JSON.parse(savedUser);

        if (user?.name) {
          setName(user.name);
        }

        if (user?.email) {
          setEmail(user.email);
        }
      }
    } catch (err) {
      console.error(
        "Unable to load saved user:",
        err
      );
    }
  }, []);

  // =========================
  // FETCH EVENT
  // =========================
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/events`
        );

        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Server returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch events"
          );
        }

        const selectedEvent = data.find(
          (item) => item._id === eventId
        );

        if (!selectedEvent) {
          throw new Error("Event not found");
        }

        setEvent(selectedEvent);
      } catch (err) {
        console.error(
          "Event details error:",
          err
        );

        setError(
          err.message ||
            "Failed to load event."
        );
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // =========================
  // BOOK EVENT
  // =========================
  const handleBooking = async (e) => {
    e.preventDefault();

    setBookingMessage("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setBookingMessage(
        "Please enter your name and email."
      );
      return;
    }

    if (!eventId) {
      setBookingMessage(
        "Event information is missing."
      );
      return;
    }

    try {
      setBookingLoading(true);

      const response = await fetch(
        `${API_URL}/api/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: eventId,
            name: cleanName,
            email: cleanEmail,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create booking"
        );
      }

      setBookingMessage(
        "🎉 Booking created successfully!"
      );

      // Keep the user's details instead of clearing them.
      setName(cleanName);
      setEmail(cleanEmail);
    } catch (err) {
      console.error(
        "Booking error:",
        err
      );

      setBookingMessage(
        "❌ " +
          (err.message ||
            "Booking failed.")
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="event-details-page">
        <div className="event-details-container">
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <div className="event-details-page">
        <div className="event-details-container">
          <p>❌ {error}</p>

          <button
            className="back-button"
            onClick={onBack}
          >
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // EVENT LOCATION
  // =========================
  const latitude = Number(
    event.location?.latitude
  );

  const longitude = Number(
    event.location?.longitude
  );

  const hasValidCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <div className="event-details-page">
      <div className="event-details-container">

        {/* BACK BUTTON */}
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Events
        </button>

        {/* EVENT IMAGE */}
        {event.image && (
          <div className="event-details-image-wrapper">
            <img
              src={event.image}
              alt={event.title}
              className="event-details-image"
            />
          </div>
        )}

        {/* EVENT HEADER */}
        <div className="event-details-header">
          <span className="event-category">
            EVENT
          </span>

          <h1>{event.title}</h1>

          {event.description && (
            <p className="event-details-description">
              {event.description}
            </p>
          )}
        </div>

        {/* EVENT INFORMATION */}
        <div className="event-info-grid">

          <div className="event-info-card">
            <span className="event-info-icon">
              📅
            </span>

            <div>
              <small>Date</small>

              <strong>
                {event.date
                  ? new Date(
                      event.date
                    ).toLocaleString(
                      "en-IN"
                    )
                  : "Date not provided"}
              </strong>
            </div>
          </div>

          <div className="event-info-card">
            <span className="event-info-icon">
              📍
            </span>

            <div>
              <small>Location</small>

              <strong>
                {event.location?.address ||
                  "Location not provided"}
              </strong>
            </div>
          </div>

        </div>

        {/* EVENT MAP */}
        <section className="event-location-section">

          <div className="section-heading">
            <h2>Event Location</h2>

            <p>
              Find exactly where this event is
              happening.
            </p>
          </div>

          {hasValidCoordinates ? (
            <div className="event-details-map">

              <MapContainer
                center={[
                  latitude,
                  longitude,
                ]}
                zoom={15}
                scrollWheelZoom={true}
                style={{
                  width: "100%",
                  height: "400px",
                }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={[
                    latitude,
                    longitude,
                  ]}
                  icon={eventIcon}
                >
                  <Popup>
                    <strong>
                      {event.title}
                    </strong>

                    <br />

                    📍{" "}
                    {event.location?.address ||
                      "Event location"}
                  </Popup>
                </Marker>
              </MapContainer>

            </div>
          ) : (
            <div className="map-unavailable">
              <p>
                📍 Map location is not
                available for this event.
              </p>
            </div>
          )}

          {hasValidCoordinates && (
            <div className="coordinates">
              <span>
                Latitude:{" "}
                {latitude.toFixed(6)}
              </span>

              <span>
                Longitude:{" "}
                {longitude.toFixed(6)}
              </span>
            </div>
          )}

        </section>

        {/* BOOKING */}
        <section className="booking-section">

          <div className="section-heading">
            <h2>Book This Event</h2>

            <p>
              Enter your details to reserve
              your spot.
            </p>
          </div>

          <form onSubmit={handleBooking}>

            <div className="form-group">
              <label>Name</label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              className="booking-button"
              disabled={bookingLoading}
            >
              {bookingLoading
                ? "Booking..."
                : "Book Event"}
            </button>

          </form>

          {bookingMessage && (
            <p className="booking-message">
              {bookingMessage}
            </p>
          )}

        </section>
      </div>
    </div>
  );
}

export default EventDetails;