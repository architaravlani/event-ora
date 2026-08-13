import { useEffect, useState } from "react";

function EventList({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      const response = await fetch(
        "https://eventora-server-i6mg.onrender.com/api/events"
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

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return <p>Loading events...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto" }}>
      <h2>Upcoming Events</h2>

      {events.length === 0 ? (
        <p>No events available yet.</p>
      ) : (
        events.map((event) => (
          <div
            key={event._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "15px",
            }}
          >
            <h3>{event.title}</h3>

            {event.description && <p>{event.description}</p>}

            <p>
              <strong>Address:</strong>{" "}
              {event.location?.address || "Not provided"}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {event.date
                ? new Date(event.date).toLocaleString()
                : "Not provided"}
            </p>

            <button
              onClick={() => onSelectEvent(event._id)}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              View Details
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default EventList;