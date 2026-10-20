
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function getEventId(event) {
  return event?._id || event?.id;
}

function getEventImage(event) {
  const image =
    event?.imageUrl ||
    event?.image ||
    event?.imageURL ||
    event?.image_url ||
    event?.photo ||
    event?.poster ||
    event?.coverImage ||
    event?.banner;

  return typeof image === "string" && image.trim()
    ? image
    : "";
}

function isFeatured(event) {
  return Boolean(event?.isFeatured ?? event?.featured);
}

function getStartingPrice(event) {
  const prices = Object.values(event?.ticketPrices || {})
    .map(Number)
    .filter((price) => Number.isFinite(price) && price >= 0);

  return prices.length ? Math.min(...prices) : null;
}

function formatPrice(amount) {
  if (amount === 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTimingLabel(event) {
  if (!event?.date) return null;

  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const days = Math.round((date - today) / 86400000);

  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  return null;
}

function isEventExpired(event) {
  if (!event?.date) return false;

  const eventDate = new Date(event.date);
  if (Number.isNaN(eventDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  eventDate.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const aExpired = isEventExpired(a);
    const bExpired = isEventExpired(b);

    // Expired events always appear at the bottom.
    if (aExpired !== bExpired) return aExpired ? 1 : -1;

    // Featured upcoming events first.
    if (!aExpired && !bExpired) {
      const aFeatured = isFeatured(a);
      const bFeatured = isFeatured(b);

      if (aFeatured !== bFeatured) {
        return aFeatured ? -1 : 1;
      }
    }

    // Upcoming events: earliest first.
    // Expired events: most recently ended first.
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();

    return aExpired ? bDate - aDate : aDate - bDate;
  });
}

function EventList({
  categories = [],
  selectedCategory = "All Events",
  onCategoryChange,
  search = "",
  onSearchChange,
  onSelectEvent,
}) {
  const [events, setEvents] = useState([]);
  const gridRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchEvents(silent = false) {
    try {
      if (!silent) setError("");

      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load events."
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.events)
          ? data.events
          : [];

      setEvents(sortEvents(list));
    } catch (err) {
      if (!silent) setError(err.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();

    // Refresh the ordering periodically as dates pass.
    const timer = setInterval(() => {
      setEvents((previous) => sortEvents(previous));
    }, 30000);

    // Quietly pull in new or changed events every minute.
    const refresh = setInterval(() => fetchEvents(true), 60000);

    return () => {
      clearInterval(timer);
      clearInterval(refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matching = events.filter((event) => {
      if (
        selectedCategory !== "All Events" &&
        (event.category || "Other").toLowerCase() !==
          selectedCategory.toLowerCase()
      ) {
        return false;
      }

      const searchableText = [
        event.title,
        event.description,
        event.category,
        event.location?.address,
        typeof event.location === "string"
          ? event.location
          : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });

    return sortEvents(matching);
  }, [events, search, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { "All Events": events.length };

    events.forEach((event) => {
      const key = event.category || "Other";
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [events]);

  // Fade cards in as they scroll into view.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    const cards = grid.querySelectorAll(".event-card.reveal:not(.in-view)");

    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("in-view"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [filteredEvents, loading]);

  if (loading) {
    return (
      <div className="event-grid" aria-busy="true" aria-label="Loading events">
        {[0, 1, 2].map((item) => (
          <div key={item} className="event-card event-skeleton">
            <div className="event-image-wrapper" />
            <div className="event-card-content">
              <span className="skeleton-line short" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="event-list-section">
      <div className="event-toolbar">
        <label className="event-search-field">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="m20 20-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            className="event-search-input"
            type="search"
            placeholder="Search events, locations, categories..."
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            aria-label="Search events"
          />
        </label>

        <button
          type="button"
          className="refresh-events-button"
          onClick={() => fetchEvents()}
        >
          Refresh
        </button>
      </div>

      <div className="category-pills" role="tablist" aria-label="Event categories">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={selectedCategory === category}
            className={`category-pill ${
              selectedCategory === category ? "active" : ""
            }`}
            onClick={() => onCategoryChange?.(category)}
          >
            {category}
            <span className="category-count">
              {categoryCounts[category] || 0}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="event-error" role="alert">
          {error}
          <button type="button" onClick={() => fetchEvents()}>
            Try again
          </button>
        </div>
      )}

      {!error && filteredEvents.length === 0 && (
        <div className="event-message">
          No events found. Try a different search or category.
        </div>
      )}

      <div className="event-grid" ref={gridRef}>
        {filteredEvents.map((event, index) => {
          const expired = isEventExpired(event);
          const image = getEventImage(event);
          const id = getEventId(event);
          const price = getStartingPrice(event);
          const timing = expired ? null : getTimingLabel(event);
          const date = event.date ? new Date(event.date) : null;
          const validDate = date && !Number.isNaN(date.getTime());

          return (
            <article
              key={id}
              className={`event-card reveal ${expired ? "expired-event" : ""}`}
              style={{ "--i": index % 3 }}
            >
              <div className="event-image-wrapper">
                {image ? (
                  <img
                    className="event-card-image"
                    src={image}
                    alt={event.title || "Event"}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback =
                        e.currentTarget.parentElement?.querySelector(
                          ".event-image-placeholder"
                        );
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}

                <div
                  className="event-image-placeholder"
                  style={{ display: image ? "none" : "flex" }}
                >
                  <span>EVENTORA</span>
                </div>

                <span className="event-image-shade" aria-hidden="true" />

                {expired && (
                  <div className="event-unavailable-overlay">
                    <span>EVENT ENDED</span>
                  </div>
                )}

                {!expired && isFeatured(event) && (
                  <span className="featured-event-badge">★ FEATURED</span>
                )}

                {timing && (
                  <span className="event-soon-badge">
                    <span className="soon-dot" />
                    {timing}
                  </span>
                )}

                {validDate && (
                  <span className="event-date-tile" aria-hidden="true">
                    <strong>{date.getDate()}</strong>
                    <small>
                      {date.toLocaleDateString(undefined, { month: "short" })}
                    </small>
                  </span>
                )}
              </div>

              <div className="event-card-content">
                <div className="event-card-meta">
                  {event.category && (
                    <span className="event-category-badge">
                      {event.category}
                    </span>
                  )}

                  {expired && (
                    <span className="event-status-badge">EXPIRED</span>
                  )}
                </div>

                <h3>{event.title || "Untitled Event"}</h3>

                <p className="event-description">
                  {event.description || "Discover this event on Eventora."}
                </p>

                <p className="event-location">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                    <path
                      d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="9.5"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>
                    {event.location?.address ||
                      (typeof event.location === "string"
                        ? event.location
                        : "Location not specified")}
                  </span>
                </p>

                <p className="event-date">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M3 10h18M8 3v4M16 3v4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>
                    {validDate
                      ? date.toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date not specified"}
                  </span>
                </p>

                <div className="event-card-footer">
                  <div className="event-price">
                    {price !== null && !expired ? (
                      <>
                        <small>From</small>
                        <strong>{formatPrice(price)}</strong>
                      </>
                    ) : (
                      <small>{expired ? "Event ended" : ""}</small>
                    )}
                  </div>

                  <button
                    type="button"
                    className="view-event-button"
                    onClick={() => onSelectEvent?.(id, event)}
                    disabled={!id}
                  >
                    {expired ? "View Past Event" : "View Event"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default EventList;
