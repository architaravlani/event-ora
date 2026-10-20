
import { useCallback, useEffect, useState } from "react";
import "./AdminBookings.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://eventora-server-231r.onrender.com"
).replace(/\/+$/, "");

const PAID_STATUSES = [
  "paid",
  "completed",
  "success",
  "successful",
];

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-IN");
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadBookings = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = localStorage.getItem("eventoraToken");

      if (!token) {
        throw new Error("Please log in again as an admin.");
      }

      const response = await fetch(
        `${API_URL}/api/bookings/admin/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error(
          "Your login token is invalid or expired. Log in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Admin access denied. Log in with your admin account."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Unable to load bookings (${response.status}).`
        );
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data.bookings)
          ? data.bookings
          : [];

      // Show newest bookings first.
      rows.sort((a, b) => {
        const dateA = new Date(
          a.bookedAt || a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.bookedAt || b.createdAt || 0
        ).getTime();

        return dateB - dateA;
      });

      setBookings(rows);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message || "Unable to load the booking database."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + automatic refresh every 5 seconds.
  useEffect(() => {
    loadBookings();

    const intervalId = setInterval(() => {
      loadBookings(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadBookings]);

  const totalTickets = bookings.reduce(
    (sum, booking) =>
      sum + Number(booking.tickets ?? booking.quantity ?? 0),
    0
  );

  const paidBookings = bookings.filter((booking) => {
    const status = String(
      booking.paymentStatus ?? "pending"
    ).toLowerCase();

    return PAID_STATUSES.includes(status);
  }).length;

  const totalAmount = bookings.reduce((sum, booking) => {
    const status = String(
      booking.paymentStatus ?? "pending"
    ).toLowerCase();

    if (!PAID_STATUSES.includes(status)) {
      return sum;
    }

    return sum + Number(
      booking.amount ??
        booking.totalPrice ??
        (
          Number(booking.quantity || booking.tickets || 0) *
          Number(booking.pricePerTicket || 0)
        )
    );
  }, 0);

  return (
    <section className="admin-bookings">
      <div className="admin-bookings-heading">
        <div>
          <span className="admin-db-eyebrow">
            ADMINISTRATION
          </span>

          <h2>Booking Database</h2>

          <p>
            View customer bookings and payment information.
          </p>

          <small>
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString("en-IN")}`
              : "Connecting to booking database..."}
            {" · "}
            Auto-refresh every 5 seconds
          </small>
        </div>

        <button
          className="admin-db-refresh"
          type="button"
          onClick={() => loadBookings()}
          disabled={loading || refreshing}
        >
          {loading || refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="admin-db-stats">
        <article className="admin-db-stat">
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
        </article>

        <article className="admin-db-stat">
          <span>Total Tickets</span>
          <strong>{totalTickets}</strong>
        </article>

        <article className="admin-db-stat">
          <span>Paid Bookings</span>
          <strong>{paidBookings}</strong>
        </article>

        <article className="admin-db-stat">
          <span>Confirmed Paid Amount</span>
          <strong>{formatAmount(totalAmount)}</strong>
        </article>
      </div>

      {error && (
        <div className="admin-db-error" role="alert">
          <strong>Could not load bookings</strong>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadBookings()}
          >
            Try Again
          </button>
        </div>
      )}

      {loading && bookings.length === 0 && !error && (
        <div className="admin-db-message">
          Loading booking records...
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="admin-db-message">
          <h3>No bookings found</h3>
          <p>
            New bookings will appear here automatically after
            they are saved successfully.
          </p>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="admin-db-table-wrapper">
          <table className="admin-db-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Event</th>
                <th>Ticket Type</th>
                <th>Tickets</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Booking Status</th>
                <th>Booked At</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking, index) => {
                const payment = String(
                  booking.paymentStatus ?? "pending"
                ).toLowerCase();

                const isPaid = PAID_STATUSES.includes(payment);

                const isUnpaid = [
                  "pending",
                  "unpaid",
                  "failed",
                ].includes(payment);

                const paymentLabel = isPaid
                  ? "Paid"
                  : payment.charAt(0).toUpperCase() +
                    payment.slice(1);

                const eventName =
                  typeof booking.event === "object"
                    ? booking.event?.title ||
                      booking.event?.name
                    : booking.event;

                const amount =
                  booking.amount ??
                  booking.totalPrice ??
                  (
                    Number(
                      booking.tickets ?? booking.quantity ?? 0
                    ) *
                    Number(booking.pricePerTicket || 0)
                  );

                return (
                  <tr key={booking._id || index}>
                    <td>{booking.name || "N/A"}</td>
                    <td>{booking.email || "N/A"}</td>
                    <td>{booking.phone || "N/A"}</td>
                    <td>
                      {eventName ||
                        booking.eventName ||
                        "Event unavailable"}
                    </td>
                    <td>
                      {booking.ticketType || "N/A"}
                    </td>
                    <td>
                      {booking.tickets ??
                        booking.quantity ??
                        0}
                    </td>
                    <td>{formatAmount(amount)}</td>
                    <td>
                      <span
                        className={`admin-db-payment ${
                          isPaid
                            ? "paid"
                            : isUnpaid
                              ? "unpaid"
                              : "unknown"
                        }`}
                      >
                        {paymentLabel}
                      </span>
                    </td>
                    <td>
                      {booking.bookingStatus || "confirmed"}
                    </td>
                    <td>
                      {formatDate(
                        booking.bookedAt || booking.createdAt
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
