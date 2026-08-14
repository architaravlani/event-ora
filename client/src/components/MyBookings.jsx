import { useState } from "react";

function MyBookings() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) {
      return;
    }

    try {
      setLoading(true);
      setSearched(false);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bookings?email=${encodeURIComponent(
          email.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch bookings");
      }
console.log("BOOKINGS FROM API:", data);
      setBookings(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (error) {
      console.error("BOOKINGS ERROR:", error);
      setBookings([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bookings-page">
      <div className="bookings-container">

        {/* HEADER */}
        <div className="bookings-header">
          <h1>My Bookings</h1>

          <p>
            Enter the email you used while booking to view your
            tickets.
          </p>
        </div>

        {/* SEARCH */}
        <div className="booking-search">
          <input
            type="email"
            placeholder="Enter your booking email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : "⌕ Find"}
          </button>
        </div>

        {/* RESULTS */}
        <div className="booking-results">

          {!searched ? (
            <div className="booking-empty">
              <div className="booking-empty-icon">
                🎟
              </div>

              <h3>Search your bookings</h3>

              <p>
                Enter your booking email above to find your
                tickets.
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="booking-empty">
              <div className="booking-empty-icon">
                ▱
              </div>

              <h3>No bookings found</h3>

              <p>
                We couldn't find any bookings for this email.
              </p>
            </div>
          ) : (
            <div className="booking-list">

              {bookings.map((booking) => {
                const eventTitle =
                  booking.event?.title || "Event";

                const eventDate =
                  booking.event?.date;

                const eventLocation =
                  booking.event?.location?.address ||
                  "Location not provided";

                return (
                  <div
                    className="booking-card"
                    key={booking._id}
                  >

                    {/* LEFT */}
                    <div className="booking-card-main">

                      <div className="booking-card-icon">
                        🎟
                      </div>

                      <div className="booking-card-info">

                        <h3>{eventTitle}</h3>

                        {eventDate && (
                          <p>
                            📅{" "}
                            {new Date(
                              eventDate
                            ).toLocaleString()}
                          </p>
                        )}

                        <p>
                          📍 {eventLocation}
                        </p>

                        <p>
                          Name:{" "}
                          <span>{booking.name}</span>
                        </p>

                        <p>
                          Email:{" "}
                          <span>{booking.email}</span>
                        </p>

                        <p>
                          Ticket ID:{" "}
                          <span>{booking._id}</span>
                        </p>

                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="booking-card-side">

                      <span className="booking-status active">
                        BOOKED
                      </span>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default MyBookings;