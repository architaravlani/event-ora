import { useState } from "react";

function CreateEvent({ location }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      setMessage("Please select a location on the map first.");
      return;
    }

    if (!title || !address || !date) {
      setMessage("Please fill all required fields.");
      return;
    }

    const eventData = {
      title,
      description,
      location: {
        address,
        latitude: location.lat,
        longitude: location.lng,
      },
      date,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("eventoraToken")}`,
          },
          body: JSON.stringify(eventData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create event");
      }

      setMessage("🎉 Event created successfully!");

      setTitle("");
      setDescription("");
      setAddress("");
      setDate("");
    } catch (error) {
      console.error(error);
      setMessage("❌ " + error.message);
    }
  };

  return (
    <div className="create-event-card">
      <div className="create-event-title">
        <h2>Create Event</h2>
        <p>
          Create and publish an event for your community.
        </p>
      </div>

      <form className="create-event-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="event-title">Event Title *</label>

          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-description">Description</label>

          <textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-address">Address *</label>

          <input
            id="event-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Example: Bhopal, Madhya Pradesh"
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-date">Date & Time *</label>

          <input
            id="event-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {location && (
          <div className="selected-location">
            <div className="selected-location-title">
              📍 Selected Location
            </div>

            <div className="coordinates">
              <span>
                Latitude: {location.lat.toFixed(6)}
              </span>

              <span>
                Longitude: {location.lng.toFixed(6)}
              </span>
            </div>
          </div>
        )}

        <button className="create-event-button" type="submit">
          Create Event
        </button>

        {message && (
          <div
            className={`create-event-message ${
              message.includes("successfully")
                ? "success"
                : "error"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CreateEvent;