
import { useEffect, useMemo, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const DEFAULT_PRICES = {
  gold: 500,
  premium: 1000,
  royal: 2000,
};

const TICKET_INFO = {
  gold: {
    name: "Gold",
    icon: "🥇",
    description: "General admission and event access",
  },
  premium: {
    name: "Premium",
    icon: "◆",
    description: "A premium event experience",
  },
  royal: {
    name: "Royal",
    icon: "♛",
    description: "An exclusive VIP experience",
  },
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem("eventoraUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isEventExpired(event) {
  if (!event?.date) return false;

  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function EventDetails({ eventId, event: initialEvent, onBack }) {
  const [event, setEvent] = useState(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [ticketType, setTicketType] = useState("gold");
  const [quantity, setQuantity] = useState(1);

  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const user = getStoredUser();

    if (user) {
      setName(user.name || user.fullName || "");
      setEmail(user.email || "");
    }
  }, []);

  useEffect(() => {
    if (initialEvent) {
      setEvent(initialEvent);
      setLoading(false);
      return;
    }

    if (!eventId) {
      setLoading(false);
      setBookingError("No event was selected.");
      return;
    }

    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setBookingError("");

      try {
        const response = await fetch(`${API_URL}/api/events`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error("Unable to load event details.");
        }

        const events = Array.isArray(data)
          ? data
          : Array.isArray(data.events)
            ? data.events
            : [];

        const found = events.find(
          (item) => String(item._id || item.id) === String(eventId)
        );

        if (!found) {
          throw new Error("Event could not be found.");
        }

        if (!cancelled) setEvent(found);
      } catch (error) {
        if (!cancelled) setBookingError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventId, initialEvent]);

  const prices = useMemo(
    () => ({
      gold: Number(event?.ticketPrices?.gold ?? DEFAULT_PRICES.gold),
      premium: Number(
        event?.ticketPrices?.premium ?? DEFAULT_PRICES.premium
      ),
      royal: Number(event?.ticketPrices?.royal ?? DEFAULT_PRICES.royal),
    }),
    [event]
  );

  const availability = useMemo(() => {
    const source =
      event?.ticketAvailability ||
      event?.availableTickets ||
      event?.ticketInventory ||
      {};

    return {
      gold: Math.max(0, Math.floor(Number(source.gold ?? 10) || 0)),
      premium: Math.max(
        0,
        Math.floor(Number(source.premium ?? 10) || 0)
      ),
      royal: Math.max(0, Math.floor(Number(source.royal ?? 10) || 0)),
    };
  }, [event]);

  const selectedPrice = prices[ticketType] ?? prices.gold;
  const ticketsAvailable = availability[ticketType] ?? 0;
  const maxQuantity = Math.min(10, ticketsAvailable);
  const total = selectedPrice * quantity;
  const expired = isEventExpired(event);

  useEffect(() => {
    setQuantity((current) => {
      if (maxQuantity < 1) return 1;
      return Math.min(current, maxQuantity);
    });
  }, [ticketType, maxQuantity]);

  function selectTicket(type) {
    setTicketType(type);
    setQuantity(1);
    setMessage("");
    setBookingError("");
    setConfirmedBooking(null);
  }

  async function handleBooking(e) {
    e.preventDefault();

    setMessage("");
    setBookingError("");
    setConfirmedBooking(null);

    const id = event?._id || event?.id || eventId;

    if (!id) {
      setBookingError("Event ID is missing. Please reopen this event.");
      return;
    }

    if (!name.trim() || !email.trim()) {
      setBookingError("Please enter your name and email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setBookingError("Please enter a valid email address.");
      return;
    }

    if (phone.trim() && !/^[+\d()\-\s]{7,20}$/.test(phone.trim())) {
      setBookingError("Please enter a valid phone number.");
      return;
    }

    if (expired) {
      setBookingError("This event has ended. Booking is closed.");
      return;
    }

    if (ticketsAvailable < 1) {
      setBookingError("This ticket category is sold out.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > maxQuantity
    ) {
      setBookingError("Please select an available ticket quantity.");
      return;
    }

    if (!Number.isFinite(selectedPrice) || selectedPrice < 0) {
      setBookingError("The selected ticket price is invalid.");
      return;
    }

    setBooking(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          ticketType,
          quantity,
          pricePerTicket: selectedPrice,
          totalPrice: total,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Booking failed. Please try again."
        );
      }

      const createdBooking = data.booking || data;
      setConfirmedBooking(createdBooking);

      if (!createdBooking._id) {
        setMessage("Booking created, but its ID was not returned.");
        return;
      }

      // This confirms a DEMO payment only.
      // Do not use this as proof of payment for a real gateway.
      const paymentResponse = await fetch(
        `${API_URL}/api/bookings/${createdBooking._id}/confirm-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const paymentData = await paymentResponse.json().catch(() => ({}));

      if (!paymentResponse.ok) {
        setMessage(
          "Booking created successfully, but payment status could not be updated."
        );
        setBookingError(
          paymentData.message ||
            "Payment confirmation failed. Contact the administrator."
        );
        return;
      }

      setConfirmedBooking(paymentData.booking || createdBooking);
      setMessage("Demo payment successful! Your booking is confirmed.");
    } catch (error) {
      setBookingError(
        `${error.message} Check your API URL and backend server if this continues.`
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return <div className="event-message">Loading event details...</div>;
  }

  if (!event) {
    return (
      <section className="event-details-page">
        <button
          className="back-button"
          onClick={onBack}
          type="button"
        >
          ← Back to events
        </button>
        <p className="event-error">
          {bookingError || "Event could not be found."}
        </p>
      </section>
    );
  }

  const image =
    event.imageUrl ||
    event.image ||
    event.imageURL ||
    event.image_url ||
    event.photo ||
    event.poster ||
    event.coverImage ||
    event.banner;

  return (
    <section className="event-details-page professional-event-page">
      <button
        type="button"
        className="back-button professional-back"
        onClick={onBack}
      >
        ← Back to events
      </button>

      <header className="booking-page-heading">
        <span className="booking-eyebrow">EVENTORA EXPERIENCE</span>
        <h1>Make it an experience.</h1>
        <p>Choose your tickets and reserve your place.</p>
      </header>

      <div className="event-details-layout professional-booking-layout">
        <main className="event-details-main professional-event-card">
          {image ? (
            <img
              className={`event-details-image professional-event-image ${
                expired ? "expired-details-image" : ""
              }`}
              src={image}
              alt={event.title || "Event"}
            />
          ) : (
            <div className="event-image-placeholder">
              <span>EVENTORA</span>
              <p>Your next great experience starts here.</p>
            </div>
          )}

          <div className="professional-event-content">
            {event.category && (
              <span className="professional-category">{event.category}</span>
            )}

            <h2>{event.title || "Event Details"}</h2>

            {expired && (
              <div className="event-ended-notice">
                This event has ended. New bookings are closed.
              </div>
            )}

            <p className="event-details-description">
              {event.description || "No description available."}
            </p>

            <div className="professional-event-meta">
              <div>
                <span className="meta-icon">◷</span>
                <div>
                  <small>DATE &amp; TIME</small>
                  <p>
                    {event.date
                      ? new Date(event.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "To be announced"}
                  </p>
                </div>
              </div>

              <div>
                <span className="meta-icon">⌖</span>
                <div>
                  <small>VENUE</small>
                  <p>
                    {event.location?.address ||
                      (typeof event.location === "string"
                        ? event.location
                        : "To be announced")}
                  </p>
                </div>
              </div>
            </div>

            <div className="ticket-section-heading">
              <div>
                <span className="booking-eyebrow">FIND YOUR SEAT</span>
                <h3>Choose your experience</h3>
              </div>
              <span className="ticket-currency">Prices in INR</span>
            </div>

            <div className="ticket-card-grid">
              {Object.entries(TICKET_INFO).map(([type, info]) => {
                const soldOut = availability[type] < 1;

                return (
                  <button
                    type="button"
                    key={type}
                    className={`ticket-choice ticket-${type} ${
                      ticketType === type ? "ticket-selected" : ""
                    }`}
                    onClick={() => selectTicket(type)}
                    disabled={soldOut || expired || booking}
                    aria-pressed={ticketType === type}
                  >
                    <span className="ticket-choice-icon">{info.icon}</span>
                    <span className="ticket-choice-name">{info.name}</span>
                    <span className="ticket-choice-description">
                      {info.description}
                    </span>
                    <span className="ticket-choice-price">
                      {formatPrice(prices[type])}
                    </span>
                    <span className="ticket-stock">
                      {soldOut
                        ? "Sold out"
                        : `${availability[type]} available`}
                    </span>
                    <span className="ticket-select-indicator">
                      {ticketType === type ? "✓ Selected" : "Select ticket"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="booking-panel professional-booking-panel">
          <div className="booking-panel-heading">
            <span className="booking-eyebrow">YOUR RESERVATION</span>
            <h2>Complete your booking</h2>
            <p>Enter your details to continue.</p>
          </div>

          {message && (
            <div className="booking-success" role="status">
              <h3>✓ Booking update</h3>
              <p>{message}</p>

              {confirmedBooking?._id && (
                <p className="booking-id">
                  <strong>Booking ID</strong>
                  <br />
                  {confirmedBooking._id}
                </p>
              )}

              <p>
                <strong>Ticket:</strong> {ticketType.toUpperCase()}
              </p>
              <p>
                <strong>Quantity:</strong> {quantity}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(total)}
              </p>
              <p>
                <strong>Payment status:</strong>{" "}
                {confirmedBooking?.paymentStatus || "pending"}
              </p>
              <p>Visit My Bookings to review your reservation.</p>
            </div>
          )}

          {bookingError && (
            <div className="booking-error" role="alert">
              {bookingError}
            </div>
          )}

          <form
            className="professional-booking-form"
            onSubmit={handleBooking}
          >
            <label htmlFor="booking-name">Full name</label>
            <input
              id="booking-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
              disabled={expired || booking}
            />

            <label htmlFor="booking-email">Email address</label>
            <input
              id="booking-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={expired || booking}
            />

            <label htmlFor="booking-phone">
              Phone number <span className="optional-label">Optional</span>
            </label>
            <input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your contact number"
              autoComplete="tel"
              disabled={expired || booking}
            />

            <label htmlFor="ticket-quantity">Number of tickets</label>
            <select
              id="ticket-quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={expired || booking || maxQuantity < 1}
            >
              {maxQuantity < 1 ? (
                <option value={1}>Sold out</option>
              ) : (
                Array.from(
                  { length: maxQuantity },
                  (_, index) => index + 1
                ).map((number) => (
                  <option key={number} value={number}>
                    {number} {number === 1 ? "ticket" : "tickets"}
                  </option>
                ))
              )}
            </select>

            <div className="professional-order-summary">
              <div className="order-summary-title">
                <span>Order summary</span>
                <span className="order-ticket-icon">▤</span>
              </div>

              <div className="order-summary-line">
                <span>{TICKET_INFO[ticketType].name} ticket</span>
                <span>{formatPrice(selectedPrice)}</span>
              </div>

              <div className="order-summary-line">
                <span>Quantity</span>
                <span>× {quantity}</span>
              </div>

              <div className="order-summary-total">
                <span>Total amount</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <p className="order-summary-note">
                Final amount for your selected tickets.
              </p>
            </div>

            <button
              type="submit"
              className="confirm-booking-button professional-confirm-button"
              disabled={expired || booking || maxQuantity < 1}
            >
              {expired
                ? "Booking closed"
                : maxQuantity < 1
                  ? "Sold out"
                  : booking
                    ? "Processing booking..."
                    : `Confirm booking · ${formatPrice(total)}`}
            </button>
          </form>

          <div className="booking-security-note">
            <span>✓</span>
            <p>Please use the same email when checking My Bookings.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default EventDetails;
