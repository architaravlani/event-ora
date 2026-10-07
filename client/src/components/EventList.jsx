import { useEffect, useMemo, useState } from "react";

function EventList({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
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

  const categories = ["All", "Music", "Workshop", "Sports", "Meetup"];

  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !searchText ||
        event.title?.toLowerCase().includes(searchText) ||
        event.description?.toLowerCase().includes(searchText) ||
        event.location?.address?.toLowerCase().includes(searchText);

      const eventText = `
        ${event.title || ""}
        ${event.description || ""}
        ${event.location?.address || ""}
      `.toLowerCase();

      const matchesCategory =
        category === "All" ||
        eventText.includes(category.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [events, search, category]);

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

  return (
    <>
      {/* SEARCH + FILTERS */}
      <div className="event-discovery-tools">
        <div className="event-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search events, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="clear-search"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="category-filters">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "category-active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* RESULT COUNT */}
      <div className="event-results-info">
        <span>
          {filteredEvents.length}{" "}
          {filteredEvents.length === 1 ? "event" : "events"} found
        </span>

        {(search || category !== "All") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("All");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* EVENTS */}
      {filteredEvents.length === 0 ? (
        <div className="events-status">
          <div className="empty-event-icon">⌕</div>

          <h3>No events found</h3>

          <p>
            Try another search or select a different category.
          </p>

          <button
            type="button"
            className="view-event-button"
            onClick={() => {
              setSearch("");
              setCategory("All");
            }}
          >
            Show All Events
          </button>
        </div>
      ) : (
        <div className="event-grid">
          {filteredEvents.map((event) => (
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
                  {event.description ||
                    "Join this amazing Eventora event."}
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
      )}
    </>
  );
}

export default EventList;