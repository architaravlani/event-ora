import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://eventora-server-i6mg.onrender.com";

function CreateEvent({ location, setLocation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImage("");
      return;
    }

    // Maximum image size: 2 MB
    if (file.size > 1 * 1024 * 1024)  {
     setError("Image size must be less than 1 MB.");
     
      e.target.value = "";
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!location) {
      setError("Please select the event location on the map.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter the event address.");
      return;
    }

    if (!date) {
      setError("Please select the event date and time.");
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

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create event. Please try again."
        );
      }

      setMessage("Event created successfully! 🎉");

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("Other");
      setAddress("");
      setDate("");
      setImage("");

      if (setLocation) {
        setLocation(null);
      }

      // Reset file input
      const fileInput = document.getElementById("event-image");

      if (fileInput) {
        fileInput.value = "";
      }
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
            Add the details below to publish your event on Eventora.
          </p>
        </div>
      </div>

      {message && (
        <div className="success-message">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          ✕ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-event-form">
        {/* TITLE */}
        <div className="form-group">
          <label htmlFor="event-title">
            Event Title
          </label>

          <input
            id="event-title"
            type="text"
            placeholder="Enter event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label htmlFor="event-description">
            Description
          </label>

          <textarea
            id="event-description"
            placeholder="Describe your event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            disabled={loading}
          />
        </div>

        {/* CATEGORY */}
        <div className="form-group">
          <label htmlFor="event-category">
            Event Category
          </label>

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

        {/* ADDRESS */}
        <div className="form-group">
          <label htmlFor="event-address">
            Event Address
          </label>

          <input
            id="event-address"
            type="text"
            placeholder="Enter event address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* DATE */}
        <div className="form-group">
          <label htmlFor="event-date">
            Date & Time
          </label>

          <input
            id="event-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* IMAGE */}
        <div className="form-group">
          <label htmlFor="event-image">
            Event Image
          </label>

          <input
            id="event-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />

          <small>
            Upload a JPG, PNG or other image. Maximum size: 2 MB.
          </small>

          {image && (
            <div className="image-preview">
              <img
                src={image}
                alt="Event preview"
              />
            </div>
          )}
        </div>

        {/* LOCATION STATUS */}
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

              <p>
                Click on the map above to choose the event location.
              </p>
            </>
          )}
        </div>

        {/* SUBMIT */}
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