import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function MyBookings() {
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [bookings, setBookings] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get logged-in user's email
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("eventoraUser");

      if (savedUser) {
        const user = JSON.parse(savedUser);

        if (user?.email) {
          setEmail(user.email);
        }
      }
    } catch (error) {
      console.error("Unable to read saved user:", error);
    }
  }, []);

  const handleSearch = async () => {
    const searchEmail = email.trim().toLowerCase();

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
        throw new Error(
          data.message || "Failed to fetch bookings."
        );
      }

      setBookings(
        Array.isArray(data)
          ? data
          : data.bookings || []
      );
    } catch (err) {
      console.error("Bookings error:", err);

      setBookings([]);

      setError(
        err.message ||
          "Unable to load bookings. Please make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(() => {
    if (activeTab === "active") {
      return true;
    }

    return false;
  });

  return (
    <div className="my-bookings-page">
      <div className="bookings-header">
        <div className="hero-badge">
          ✦ Your Events
        </div>

        <h1>
          My <span>Bookings</span>
        </h1>

        <p>
          View all the events you have booked.
        </p>
      </div>

      <div className="booking-search-card">
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {loading
            ? "Searching..."
            : "Find My Bookings"}
        </button>
      </div>

      {error && (
        <div className="booking-error">
          {error}
        </div>
      )}

      <div className="booking-tabs">
        <button
          type="button"
          className={
            activeTab === "active"
              ? "active"
              : ""
          }
          onClick={() => setActiveTab("active")}
        >
          My Bookings
        </button>
      </div>

      {loading && (
        <div className="booking-message">
          Loading your bookings...
        </div>
      )}

      {!loading &&
        searched &&
        filteredBookings.length === 0 &&
        !error && (
          <div className="booking-empty">
            <div className="empty-icon">
              📅
            </div>

            <h3>No bookings found</h3>

            <p>
              We couldn't find any bookings for
              this email address.
            </p>
          </div>
        )}

      {!loading &&
        filteredBookings.length > 0 && (
          <div className="bookings-grid">
            {filteredBookings.map((booking) => (
              <div
                className="booking-card"
                key={
                  booking._id ||
                  booking.id
                }
              >
                <div className="booking-card-top">
                  <span className="booking-status">
                    BOOKED
                  </span>
                </div>

                <h3>
                  {booking.event?.title ||
                    booking.eventTitle ||
                    "Event Booking"}
                </h3>

                <p>
                  <strong>Name:</strong>{" "}
                  {booking.name ||
                    "Guest"}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {booking.email}
                </p>

                {booking.event?.date && (
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      booking.event.date
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                )}

                {booking.event?.location
                  ?.address && (
                  <p>
                    <strong>Location:</strong>{" "}
                    {
                      booking.event
                        .location.address
                    }
                  </p>
                )}

                {booking.createdAt && (
                  <p className="booking-date">
                    Booked on{" "}
                    {new Date(
                      booking.createdAt
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default MyBookings;