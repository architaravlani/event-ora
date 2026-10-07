import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function CreateEvent({ location, setLocation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically get address from selected map location
  useEffect(() => {
    if (!location) return;

    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.display_name) {
          setAddress(data.display_name);
        }
      } catch (error) {
        console.error("REVERSE GEOCODING ERROR:", error);
      }
    };

    fetchAddress();
  }, [location]);

  // Image upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("❌ Please select a valid image.");
      return;
    }

    // Keep image below 2 MB
    if (file.size > 2 * 1024 * 1024) {
      setMessage("❌ Image must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setMessage("");
    };

    reader.onerror = () => {
      setMessage("❌ Failed to read image.");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!location) {
      setMessage(
        "❌ Please search for a location or click on the map first."
      );
      return;
    }

    if (!title.trim()) {
      setMessage("❌ Please enter an event title.");
      return;
    }

    if (!address.trim()) {
      setMessage("❌ Please enter an event address.");
      return;
    }

    if (!date) {
      setMessage("❌ Please select an event date.");
      return;
    }

    setLoading(true);

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      image: image || "",
      location: {
        address: address.trim(),
        latitude: location.lat,
        longitude: location.lng,
      },
      date,
    };

    try {
      console.log("Sending event to:", `${API_URL}/api/events`);

      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "eventoraToken"
          )}`,
        },
        body: JSON.stringify(eventData),
      });

      console.log("STATUS:", response.status);
      console.log("STATUS TEXT:", response.statusText);

      // IMPORTANT:
      // Read as text first instead of response.json()
      const responseText = await response.text();

      console.log("SERVER RESPONSE:", responseText);

      let data = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(
            "SERVER RETURNED NON-JSON:",
            responseText
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Server error: ${response.status} ${response.statusText}`
        );
      }

      setMessage("🎉 Event created successfully!");

      // Clear form
      setTitle("");
      setDescription("");
      setAddress("");
      setDate("");
      setImage("");

      // Clear selected location
      if (setLocation) {
        setLocation(null);
      }
    } catch (error) {
      console.error("CREATE EVENT ERROR:", error);

      setMessage(
        "❌ " +
          (error.message || "Failed to create event.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page">
      <div className="create-event-container">

        <div className="create-event-header">
          <h1>Create Event</h1>

          <p>
            Add your event details, image and exact location.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* TITLE */}
          <div className="form-group">
            <label>Event Title *</label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
            />
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe your event"
              rows="4"
            />
          </div>

          {/* IMAGE */}
          <div className="form-group">
            <label>Event Image</label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {image && (
              <div style={{ marginTop: "15px" }}>
                <img
                  src={image}
                  alt="Event preview"
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              </div>
            )}
          </div>

          {/* DATE */}
          <div className="form-group">
            <label>Date *</label>

            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* ADDRESS */}
          <div className="form-group">
            <label>Address *</label>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Event address"
            />
          </div>

          {/* SELECTED LOCATION */}
          {location && (
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                borderRadius: "8px",
                background: "rgba(50, 100, 255, 0.1)",
              }}
            >
              <strong>📍 Selected Location</strong>

              <div style={{ marginTop: "8px" }}>
                Latitude: {location.lat.toFixed(6)}
              </div>

              <div>
                Longitude: {location.lng.toFixed(6)}
              </div>
            </div>
          )}

          {/* SUBMIT */}
          <button
            className="create-event-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Event..." : "Create Event"}
          </button>

          {/* MESSAGE */}
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
    </div>
  );
}

export default CreateEvent;