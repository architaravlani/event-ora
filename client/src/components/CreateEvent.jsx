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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events`,  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

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
    <div
      style={{
        maxWidth: "500px",
        margin: "30px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h2>Create Event</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Event Title *</label>
          <br />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter event title"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your event"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <br />

        <div>
          <label>Address *</label>
          <br />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Example: Bhopal, Madhya Pradesh"
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <br />

        <div>
          <label>Date *</label>
          <br />
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <br />

        {location && (
          <div>
            <strong>Selected Location:</strong>
            <p>
              Latitude: {location.lat.toFixed(6)}
              <br />
              Longitude: {location.lng.toFixed(6)}
            </p>
          </div>
        )}

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Create Event
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}

export default CreateEvent;