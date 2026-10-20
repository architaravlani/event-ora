
import { useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://eventora-server-i6mg.onrender.com"
).replace(/\/+$/, "");

function CreateEvent({ location, setLocation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState("");
  const [featured, setFeatured] = useState(false);

  // Admin sets prices for this event
  const [ticketPrices, setTicketPrices] = useState({
    gold: "500",
    premium: "1000",
    royal: "2000",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePriceChange = (type, value) => {
    setTicketPrices((previous) => ({
      ...previous,
      [type]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) {
      setImage("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      e.target.value = "";
      setImage("");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setError("Image size must be less than 1 MB.");
      e.target.value = "";
      setImage("");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      } else {
        setError("Unable to read the image. Please try another file.");
        setImage("");
      }
    };

    reader.onerror = () => {
      setError("Unable to read the image. Please try another file.");
      setImage("");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter the event address.");
      return;
    }

    if (!location) {
      setError("Please select the event location on the map.");
      return;
    }

    if (!date || new Date(date).getTime() <= Date.now()) {
      setError("Please select a future date and time.");
      return;
    }

    const prices = {
      gold: Number(ticketPrices.gold),
      premium: Number(ticketPrices.premium),
      royal: Number(ticketPrices.royal),
    };

    if (
      Object.values(prices).some(
        (price) => !Number.isFinite(price) || price < 0
      )
    ) {
      setError("Ticket prices must be valid, non-negative amounts.");
      return;
    }

    const token = localStorage.getItem("eventoraToken");

    if (!token) {
      setError("Please login before creating an event.");
      return;
    }

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      category,
      location: {
        address: address.trim(),
        latitude: location.lat,
        longitude: location.lng,
      },
      date,
      image,
      featured,
      ticketPrices: prices,
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create event. Please try again."
        );
      }

      setMessage("Event created successfully! 🎉");

      setTitle("");
      setDescription("");
      setCategory("Other");
      setAddress("");
      setDate("");
      setImage("");
      setFeatured(false);
      setTicketPrices({
        gold: "500",
        premium: "1000",
        royal: "2000",
      });

      if (setLocation) {
        setLocation(null);
      }

      const fileInput = document.getElementById("event-image");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Create event error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-card">
      <div className="create-event-header">
        <div>
          <span className="hero-badge">✦ Event Creation</span>
          <h2>
            Create a new <span>event</span>
          </h2>
          <p>
            Publish your event and configure its ticket prices.
          </p>
        </div>
      </div>

      {message && (
        <div className="success-message" role="status">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          ✕ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-event-form">
        <div className="form-group">
          <label htmlFor="event-title">Event Title</label>
          <input
            id="event-title"
            type="text"
            placeholder="Enter event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-description">Description</label>
          <textarea
            id="event-description"
            placeholder="Describe your event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-category">Event Category</label>
          <select
            id="event-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            <option value="Music">🎵 Music</option>
            <option value="Sports">🏆 Sports</option>
            <option value="Workshops">💻 Workshops</option>
            <option value="Business">💼 Business</option>
            <option value="Art">🎨 Art</option>
            <option value="Other">📌 Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="event-address">Event Address</label>
          <input
            id="event-address"
            type="text"
            placeholder="Enter event address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-date">Date &amp; Time</label>
          <input
            id="event-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="ticket-pricing-section">
          <h3>🎟️ Ticket Pricing</h3>
          <p>Set the price per ticket for this event, in Indian rupees.</p>

          <div className="form-group">
            <label htmlFor="gold-price">🥇 Gold Ticket (₹)</label>
            <input
              id="gold-price"
              type="number"
              min="0"
              step="1"
              value={ticketPrices.gold}
              onChange={(e) => handlePriceChange("gold", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="premium-price">💎 Premium Ticket (₹)</label>
            <input
              id="premium-price"
              type="number"
              min="0"
              step="1"
              value={ticketPrices.premium}
              onChange={(e) => handlePriceChange("premium", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="royal-price">👑 Royal Ticket (₹)</label>
            <input
              id="royal-price"
              type="number"
              min="0"
              step="1"
              value={ticketPrices.royal}
              onChange={(e) => handlePriceChange("royal", e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="event-image">Event Image</label>
          <input
            id="event-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />
          <small>Maximum image size: 1 MB.</small>

          {image && (
            <div className="image-preview">
              <img src={image} alt="Event preview" />
            </div>
          )}
        </div>

        <label className="featured-event-option">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            disabled={loading}
          />
          <span>
            <strong>⭐ Feature this event</strong>
            <small>Featured events can appear before other events.</small>
          </span>
        </label>

        <div className="event-location-status">
          {location ? (
            <>
              <strong>✓ Location Selected</strong>
              <p>
                Latitude: {location.lat.toFixed(6)}
                <br />
                Longitude: {location.lng.toFixed(6)}
              </p>
            </>
          ) : (
            <>
              <strong>📍 Select a location</strong>
              <p>Click on the map above to choose the event location.</p>
            </>
          )}
        </div>

        <button
          type="submit"
          className="primary-button create-event-button"
          disabled={loading}
        >
          {loading ? "Creating Event..." : "Create Event ✦"}
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
