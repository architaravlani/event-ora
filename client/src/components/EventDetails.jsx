import { useEffect, useState } from "react";

function EventDetails({ eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(
          "https://eventora-server-i6mg.onrender.com/api/events"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch events");
        }

        const selectedEvent = data.find((item) => item._id === eventId);

        if (!selectedEvent) {
          throw new Error("Event not found");
        }

        setEvent(selectedEvent);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleBooking = async (e) => {
    e.preventDefault();

    setBookingMessage("");

    if (!name || !email) {
      setBookingMessage("Please enter your name and email.");
      return;
    }

    try {
      setBookingLoading(true);

      const response = await fetch(
        "https://eventora-server-i6mg.onrender.com/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: eventId,
            name,
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create booking");
      }

      setBookingMessage("🎉 Booking created successfully!");

      setName("");
      setEmail("");
    } catch (err) {
      console.error(err);
      setBookingMessage("❌ " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <p>Loading event...</p>;
  }

  if (error) {
    return (
      <div>
        <p>❌ {error}</p>
        <button onClick={onBack}>Back to Events</button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "30px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <button onClick={onBack}>← Back to Events</button>

      <h2>{event.title}</h2>

      {event.description && (
        <p>
          <strong>Description:</strong>
          <br />
          {event.description}
        </p>
      )}

      <p>
        <strong>Address:</strong>
        <br />
        {event.location?.address}
      </p>

      <p>
        <strong>Date:</strong>
        <br />
        {new Date(event.date).toLocaleString()}
      </p>

      <p>
        <strong>Latitude:</strong> {event.location?.latitude}
        <br />
        <strong>Longitude:</strong> {event.location?.longitude}
      </p>

      <hr />

      <h3>Book This Event</h3>

      <form onSubmit={handleBooking}>
        <div>
          <label>Name</label>
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={bookingLoading}
          style={{
            padding: "10px 20px",
            cursor: bookingLoading ? "not-allowed" : "pointer",
          }}
        >
          {bookingLoading ? "Booking..." : "Book Event"}
        </button>
      </form>

      {bookingMessage && <p>{bookingMessage}</p>}
    </div>
  );
}

export default EventDetails;