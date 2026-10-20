
import { useEffect, useState } from "react";
import "./MyBookings.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function MyBookings() {
  const [email, setEmail] = useState(
    localStorage.getItem("eventoraEmail") || ""
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function fetchBookings(searchEmail) {
    const normalizedEmail = searchEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your booking email.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings?email=${encodeURIComponent(
          normalizedEmail
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch bookings.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from the server.");
      }

      setBookings(data);
      localStorage.setItem("eventoraEmail", normalizedEmail);
    } catch (err) {
      setBookings([]);
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedEmail = localStorage.getItem("eventoraEmail");
    if (savedEmail) {
      fetchBookings(savedEmail);
    }
  }, []);

  const formatMoney = (amount) => {
    if (amount === undefined || amount === null || amount === "") {
      return "Not recorded";
    }

    const value = Number(amount);

    return Number.isFinite(value)
      ? `₹${value.toLocaleString("en-IN")}`
      : "Not recorded";
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "Not available"
      : parsed.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const getTicketType = (booking) =>
    String(booking.ticketType || "Gold").toUpperCase();

  const getQuantity = (booking) => {
    const quantity = Number(booking.quantity);
    return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  };

  const getPrice = (booking) => {
    if (
      booking.pricePerTicket !== undefined &&
      booking.pricePerTicket !== null &&
      booking.pricePerTicket !== ""
    ) {
      const value = Number(booking.pricePerTicket);
      return Number.isFinite(value) ? value : null;
    }

    // Fallback for older bookings that have no saved price.
    const fallbackPrices = {
      GOLD: 500,
      PREMIUM: 1000,
      ROYAL: 2000,
    };

    return fallbackPrices[getTicketType(booking)] ?? null;
  };

  const getTotal = (booking) => {
    if (
      booking.totalPrice !== undefined &&
      booking.totalPrice !== null &&
      booking.totalPrice !== ""
    ) {
      const value = Number(booking.totalPrice);
      return Number.isFinite(value) ? value : null;
    }

    const price = getPrice(booking);
    return price === null ? null : price * getQuantity(booking);
  };

  const getBookingStatus = (booking) =>
    String(booking.bookingStatus || "confirmed").toLowerCase();

  const getPaymentStatus = (booking) =>
    String(booking.paymentStatus || "pending").toLowerCase();

  function handleSubmit(event) {
    event.preventDefault();
    fetchBookings(email);
  }

  // Only show records with a populated, identifiable event.
  const validBookings = bookings.filter(
    (booking) =>
      booking &&
      booking.event &&
      typeof booking.event === "object" &&
      (booking.event._id || booking.event.id)
  );

  return (
    <main className="my-bookings-page">
      <section className="my-bookings-container">
        <header className="my-bookings-header">
          <span className="bookings-eyebrow">YOUR EVENTORA TICKETS</span>
          <h1>My Bookings</h1>
          <p>View your event reservations, ticket details and amounts.</p>
        </header>

        <form className="booking-search-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter the email used for booking"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Find Bookings"}
          </button>
        </form>

        {error && <p className="bookings-error">{error}</p>}

        {loading && (
          <p className="bookings-message">Loading your bookings...</p>
        )}

        {!loading &&
          searched &&
          !error &&
          validBookings.length === 0 && (
            <div className="bookings-empty">
              <h2>No bookings found</h2>
              <p>
                No valid event bookings were found for this email.
                Check the email address you used when booking.
              </p>
            </div>
          )}

        {!loading && validBookings.length > 0 && (
          <>
            <div className="bookings-summary">
              <span>Your reservations</span>
              <strong>{validBookings.length}</strong>
            </div>

            <div className="booking-cards">
              {validBookings.map((booking) => {
                const event = booking.event;
                const quantity = getQuantity(booking);
                const price = getPrice(booking);
                const total = getTotal(booking);
                const bookingStatus = getBookingStatus(booking);
                const paymentStatus = getPaymentStatus(booking);

                const image =
                  event.image ||
                  event.imageUrl ||
                  event.poster ||
                  event.imageURL ||
                  "";

                return (
                  <article
                    className="my-booking-card"
                    key={booking._id || booking.id}
                  >
                    {image ? (
                      <img
                        className="booking-event-image"
                        src={image}
                        alt={event.title || "Event"}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}

                    <div className="booking-card-content">
                      <div className="booking-title-row">
                        <div>
                          <h2>{event.title || "Untitled Event"}</h2>
                          <p className="booking-event-date">
                            {formatDate(event.date)}
                          </p>
                        </div>

                        <span
                          className={`payment-status status-${bookingStatus}`}
                        >
                          {bookingStatus === "confirmed"
                            ? "BOOKING CONFIRMED"
                            : bookingStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="booking-details-grid">
                        <div>
                          <span>Booked by</span>
                          <strong>{booking.name || "Not available"}</strong>
                        </div>

                        <div>
                          <span>Email</span>
                          <strong>{booking.email || email}</strong>
                        </div>

                        <div>
                          <span>Ticket type</span>
                          <strong>{getTicketType(booking)}</strong>
                        </div>

                        <div>
                          <span>Quantity</span>
                          <strong>{quantity} ticket(s)</strong>
                        </div>

                        <div>
                          <span>Price per ticket</span>
                          <strong>{formatMoney(price)}</strong>
                        </div>

                        <div>
                          <span>Booking date</span>
                          <strong>{formatDate(booking.createdAt)}</strong>
                        </div>
                      </div>

                      <div className="booking-total-row">
                        <div>
                          <span>Total booking amount</span>
                          <strong className="booking-total-amount">
                            {formatMoney(total)}
                          </strong>
                        </div>

                        

<div className="booking-payment-info">
  <span>💳</span>
  <strong className="payment-text status-text-success">
    Payment Done
  </strong>
</div>


                      </div>

                      <p className="booking-id">
                        Booking ID: {booking._id || booking.id || "N/A"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default MyBookings;
