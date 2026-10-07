import { useEffect, useState } from "react";

function EventList({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/events`);
        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server returned an invalid response.");
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch events.");
        }

        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("FETCH EVENTS ERROR:", error);
        setError(error.message || "Unable to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="events-status">
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-status">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="events-status">
        <h3>No events available</h3>
        <p>Create an event from the Admin section.</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {events.map((event) => (
        <article className="event-card" key={event._id}>
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="event-image"
            />
          ) : (
            <div className="event-image-placeholder">
              <span>✦</span>
              <p>Eventora Event</p>
            </div>
          )}

          <div className="event-card-content">
            <div className="event-date">
              {event.date
                ? new Date(event.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Date not available"}
            </div>

            <h3>{event.title}</h3>

            <p className="event-description">
              {event.description || "Join this amazing Eventora event."}
            </p>

            {event.location?.address && (
              <p className="event-location">
                📍 {event.location.address}
              </p>
            )}

            <button
              type="button"
              className="view-event-button"
              onClick={() => onSelectEvent(event._id)}
            >
              View Details →
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default EventList;