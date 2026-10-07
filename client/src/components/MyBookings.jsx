import { useState } from "react";

function MyBookings() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("eventoraUser"));
    } catch {
      return null;
    }
  })();

  const handleSearch = async () => {
    const searchEmail = email.trim();

    if (!searchEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const response = await fetch(
        `${API_URL}/api/bookings?email=${encodeURIComponent(
          searchEmail
        )}`
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load bookings.");
      }

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("BOOKINGS ERROR:", err);
      setBookings([]);
      setError(err.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseAccountEmail = () => {
    if (savedUser?.email) {
      setEmail(savedUser.email);
    }
  };

  return (
    <div className="my-bookings-container">
      <div className="booking-search-card">
        <div className="booking-search-icon">🎟️</div>

        <div className="booking-search-content">
          <h2>Find your bookings</h2>

          <p>
            Enter the email address you used while booking your
            event.
          </p>

          <div className="booking-search-form">
            <input
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Searching..." : "Find Bookings"}
            </button>
          </div>

          {savedUser?.email && (
            <button
              type="button"
              className="use-account-email"
              onClick={handleUseAccountEmail}
            >
              Use my account email
            </button>
          )}

          {error && (
            <p className="booking-error">
              {error}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="booking-empty-state">
          <div className="booking-loading-icon">⏳</div>
          <h3>Finding your bookings...</h3>
        </div>
      )}

      {!loading && searched && bookings.length === 0 && !error && (
        <div className="booking-empty-state">
          <div className="booking-empty-icon">🎫</div>

          <h3>No bookings found</h3>

          <p>
            We couldn't find any bookings for this email address.
          </p>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="booking-results">
          <div className="booking-results-header">
            <div>
              <span className="booking-label">
                YOUR BOOKINGS
              </span>

              <h2>
                {bookings.length}{" "}
                {bookings.length === 1
                  ? "Booking"
                  : "Bookings"}
              </h2>
            </div>

            <span className="booking-email">
              {email}
            </span>
          </div>

          <div className="booking-list">
            {bookings.map((booking) => {
              const event = booking.event;

              return (
                <article
                  className="booking-card"
                  key={booking._id}
                >
                  <div className="booking-card-image">
                    {event?.image ? (
                      <img
                        src={event.image}
                        alt={event.title || "Event"}
                      />
                    ) : (
                      <div className="booking-image-placeholder">
                        ✦
                      </div>
                    )}
                  </div>

                  <div className="booking-card-info">
                    <span className="booking-status">
                      ✓ CONFIRMED
                    </span>

                    <h3>
                      {event?.title || "Eventora Event"}
                    </h3>

                    {event?.date && (
                      <p>
                        📅{" "}
                        {new Date(
                          event.date
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    )}

                    {event?.location?.address && (
                      <p>
                        📍 {event.location.address}
                      </p>
                    )}

                    <div className="booking-details">
                      <span>
                        Booking ID:{" "}
                        {booking._id.slice(-8).toUpperCase()}
                      </span>

                      <span>
                        Booked by: {booking.name}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;