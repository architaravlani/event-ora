import { useEffect, useState } from "react";

function EventList({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/events`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch events");
        }

        setEvents(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <p className="events-status">Loading events...</p>;
  }

  if (error) {
    return <p className="events-status">{error}</p>;
  }

  return (
    <div className="event-list-container">
      <div className="events-heading">
        <div>
          <h2>Upcoming Events</h2>
          <p>Discover events happening around you.</p>
        </div>

        <span>{events.length} events found</span>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>No events available yet.</p>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((event, index) => (
            <article className="event-card" key={event._id}>
              <div className={`event-image event-image-${index % 4}`}>
                <span className="event-category">EVENT</span>
              </div>

              <div className="event-card-content">
                <h3>{event.title}</h3>

                <p className="event-date">
                  📅{" "}
                  {event.date
                    ? new Date(event.date).toLocaleDateString()
                    : "Date not provided"}
                </p>

                <p className="event-location">
                  📍{" "}
                  {event.location?.address || "Location not provided"}
                </p>

                {event.description && (
                  <p className="event-description">
                    {event.description}
                  </p>
                )}

                <div className="event-card-bottom">
                  <span>📍 Map location</span>

                  <button
                    type="button"
                    onClick={() => onSelectEvent(event._id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventList;