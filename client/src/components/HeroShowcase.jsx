import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const ROTATE_MS = 4500;
const MAX_POSTERS = 6;

function getId(event) {
  return event?._id || event?.id;
}

function getImage(event) {
  const image = event?.image || event?.imageUrl || event?.poster;
  return typeof image === "string" && image.trim() ? image : "";
}

function isUpcoming(event) {
  if (!event?.date) return false;
  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function formatCountdown(target, now) {
  const diff = new Date(target).getTime() - now;
  if (!Number.isFinite(diff) || diff <= 0) return "today";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}

function getSlot(rel, total) {
  if (rel === 0) return "center";
  if (total === 2 && rel === 1) return "right";
  if (total >= 3) {
    if (rel === 1) return "right";
    if (rel === total - 1) return "left";
  }
  return "hidden";
}

/**
 * Right-hand side of the hero: real upcoming events that rotate
 * automatically, plus a live countdown to the next event.
 */
function HeroShowcase({ onSelectEvent, onStats }) {
  const [events, setEvents] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Load events (and refresh quietly every minute).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${API_URL}/api/events`);
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.events)
            ? data.events
            : [];

        if (cancelled) return;

        const upcoming = list.filter(isUpcoming).sort((a, b) => {
          const aFeat = Boolean(a.isFeatured ?? a.featured);
          const bFeat = Boolean(b.isFeatured ?? b.featured);
          if (aFeat !== bFeat) return aFeat ? -1 : 1;
          return new Date(a.date) - new Date(b.date);
        });

        setEvents(upcoming);
        onStats?.({
          upcoming: upcoming.length,
          categories: new Set(
            upcoming.map((event) => event.category).filter(Boolean)
          ).size,
        });
      } catch {
        /* Keep whatever is already shown. */
      }
    }

    load();
    const refresh = setInterval(load, 60000);

    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live clock for the countdown.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const showcase = events
    .filter((event) => getImage(event))
    .slice(0, MAX_POSTERS);
  const total = showcase.length;

  // Auto-rotate the posters.
  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    if (total < 3 || paused || reduceMotion) return undefined;

    const timer = setInterval(
      () => setActive((current) => (current + 1) % total),
      ROTATE_MS
    );
    return () => clearInterval(timer);
  }, [total, paused]);

  const nextEvent = events.length
    ? events.reduce((soonest, event) =>
        new Date(event.date) < new Date(soonest.date) ? event : soonest
      )
    : null;

  if (total === 0) {
    return (
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-orb-fallback">
          <span>✦</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="hero-visual"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-visual-glow" aria-hidden="true" />

      {showcase.map((event, index) => {
        const rel = (index - (active % total) + total) % total;
        const slot = getSlot(rel, total);
        const hidden = slot === "hidden";

        return (
          <button
            key={getId(event)}
            type="button"
            className={`showcase-card showcase-${slot}`}
            onClick={() => onSelectEvent?.(getId(event), event)}
            aria-label={`View ${event.title}`}
            aria-hidden={hidden}
            tabIndex={hidden ? -1 : 0}
          >
            <img src={getImage(event)} alt="" loading="lazy" />
            <span className="showcase-shade" />
            <span className="showcase-info">
              {event.category && (
                <span className="showcase-category">{event.category}</span>
              )}
              <strong>{event.title}</strong>
              <small>{formatDate(event.date)}</small>
            </span>
          </button>
        );
      })}

      <div className="hero-chip hero-chip-top" aria-hidden="true">
        <span className="hero-chip-dot" />
        Bookings open
      </div>

      {nextEvent && (
        <div className="hero-chip hero-chip-bottom" title={nextEvent.title}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 7v5l3 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Next event in {formatCountdown(nextEvent.date, now)}
        </div>
      )}

      {total >= 3 && (
        <div className="showcase-dots" role="tablist" aria-label="Featured events">
          {showcase.map((event, index) => (
            <button
              key={getId(event)}
              type="button"
              role="tab"
              aria-selected={index === active % total}
              aria-label={`Show ${event.title}`}
              className={`showcase-dot ${
                index === active % total ? "active" : ""
              }`}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroShowcase;
