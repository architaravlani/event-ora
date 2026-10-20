
import { useCallback, useEffect, useState } from "react";
import "./AdminEventManager.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://eventora-server-231r.onrender.com"
).replace(/\/+$/, "");
const EMPTY_FORM = {
  title: "",
  description: "",
  category: "Other",
  address: "",
  latitude: "",
  longitude: "",
  date: "",
  image: "",
  gold: 500,
  premium: 1000,
  royal: 2000,
  isFeatured: false,
};

function getForm(event) {
  return {
    title: event.title || "",
    description: event.description || "",
    category: event.category || "Other",
    address:
      typeof event.location === "string"
        ? event.location
        : event.location?.address || "",
    latitude: event.location?.latitude ?? "",
    longitude: event.location?.longitude ?? "",
    date: event.date ? new Date(event.date).toISOString().slice(0, 10) : "",
    image: event.image || event.imageUrl || "",
    gold: event.ticketPrices?.gold ?? 500,
    premium: event.ticketPrices?.premium ?? 1000,
    royal: event.ticketPrices?.royal ?? 2000,
    isFeatured: Boolean(event.isFeatured ?? event.featured),
  };
}

function getId(event) {
  return event?._id || event?.id;
}

function getRemainingTime(purgeAt, now) {
  if (!purgeAt) return 0;
  return Math.max(0, new Date(purgeAt).getTime() - now);
}

function formatRemainingTime(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (milliseconds <= 0) return "Recovery period expired";
  if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;

  return `${hours}h ${minutes}m remaining`;
}

export default function AdminEventManager() {
  const [events, setEvents] = useState([]);
  const [deletedEvents, setDeletedEvents] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const getToken = () => localStorage.getItem("eventoraToken");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/events`);
      const responseText = await response.text();

let data;
try {
  data = JSON.parse(responseText);
} catch {
  data = { message: responseText };
}

if (!response.ok) {
  throw new Error(data.message || `Request failed: ${response.status}`);
}

      if (!response.ok) {
        throw new Error(data.message || "Could not load events.");
      }

      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      setError(err.message || "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeletedEvents = useCallback(async () => {
    const token = getToken();

    if (!token) {
      throw new Error("Please log in again as an administrator.");
    }

    const response = await fetch(`${API_URL}/api/events/deleted`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load the recycle bin.");
    }

    setDeletedEvents(Array.isArray(data) ? data : data.events || []);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Refresh the visible recovery countdown every minute.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  async function refreshRecycleBin() {
    if (!showRecycleBin) return;

    try {
      await loadDeletedEvents();
    } catch (err) {
      setError(err.message || "Could not refresh recycle bin.");
    }
  }

  function startEditing(event) {
    setEditingId(getId(event));
    setForm(getForm(event));
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function changeField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }
  async function handleImageFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select a valid image file.");
    event.target.value = "";
    return;
  }

  // Keep the original image small enough for MongoDB.
  if (file.size > 2 * 1024 * 1024) {
    setError("Please choose an image smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  try {
    const imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(file);
    });

    setForm((previous) => ({
      ...previous,
      image: imageData,
    }));

    setError("");
    setMessage("Image selected. Click Save Changes to save it.");
  } catch (err) {
    setError(err.message || "Could not read image.");
  }
}

  async function saveEvent(event) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("Please log in again as an administrator.");
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      !form.title.trim() ||
      !form.address.trim() ||
      !form.date ||
      form.latitude === "" ||
      form.longitude === "" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setError("Enter a title, address, valid coordinates, and date.");
      return;
    }

    const ticketPrices = {
      gold: Number(form.gold),
      premium: Number(form.premium),
      royal: Number(form.royal),
    };

    if (
      Object.values(ticketPrices).some(
        (price) => !Number.isFinite(price) || price < 0
      )
    ) {
      setError("Enter valid, non-negative ticket prices.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/events/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description,
          category: form.category,
          location: {
            address: form.address.trim(),
            latitude,
            longitude,
          },
          date: new Date(`${form.date}T12:00:00`).toISOString(),
          image: form.image,
          ticketPrices,
          isFeatured: form.isFeatured,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update event.");
      }

      setMessage("Event updated successfully!");
      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not update event.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event) {
    const id = getId(event);
    if (!id) return;

    const confirmed = window.confirm(
      `Move "${event.title || "this event"}" to Recently Deleted? You can restore it within 24 hours.`
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setError("Please log in again as an administrator.");
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete event.");
      }

      setEvents((previous) =>
        previous.filter((item) => getId(item) !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }

      setMessage("Event moved to Recently Deleted for 24 hours.");

      if (showRecycleBin) {
        await loadDeletedEvents();
      }
    } catch (err) {
      setError(err.message || "Could not delete event.");
    } finally {
      setDeletingId(null);
    }
  }

 async function toggleRecycleBin() {
  console.log("Recycle Bin button clicked");
  setError("");
  setMessage("");

  if (showRecycleBin) {
    setShowRecycleBin(false);
    return;
  }

  try {
    console.log("Calling deleted-events API:", `${API_URL}/api/events/deleted`);

    await loadDeletedEvents();

    console.log("Deleted events loaded:", deletedEvents);
    setShowRecycleBin(true);
  } catch (err) {
    console.error("Recycle Bin error:", err);
    setError(err.message || "Could not open recycle bin.");
  }
}

  async function restoreDeletedEvent(event) {
    const id = getId(event);
    if (!id) return;

    const token = getToken();

    if (!token) {
      setError("Please log in again as an administrator.");
      return;
    }

    setRestoringId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/events/${id}/restore`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not restore event.");
      }

      setDeletedEvents((previous) =>
        previous.filter((item) => getId(item) !== id)
      );

      await loadEvents();

      setMessage(`"${event.title || "Event"}" was restored successfully.`);
    } catch (err) {
      setError(err.message || "Could not restore event.");

      // Reload the bin in case its recovery deadline passed.
      try {
        await loadDeletedEvents();
      } catch {
        // Keep the original error visible.
      }
    } finally {
      setRestoringId(null);
    }
  }

  async function permanentlyDeleteEvent(event) {
    const id = getId(event);
    if (!id) return;

    const confirmed = window.confirm(
      `Permanently delete "${event.title || "this event"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setError("Please log in again as an administrator.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/events/${id}/permanent`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not permanently delete event.");
      }

      setDeletedEvents((previous) =>
        previous.filter((item) => getId(item) !== id)
      );

      setMessage("Event permanently deleted.");
    } catch (err) {
      setError(err.message || "Could not permanently delete event.");

      try {
        await loadDeletedEvents();
      } catch {
        // Keep the original error visible.
      }
    }
  }

  return (
    <section className="admin-event-manager">
      <div className="admin-manager-heading">
        <div>
          <h2>Manage Existing Events</h2>
          <p>Edit events, move them to Recently Deleted, or restore them.</p>
        </div>

        <button
          type="button"
          className="admin-manager-refresh"
          onClick={loadEvents}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Events"}
        </button>
      </div>

      {error && (
        <p className="admin-manager-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="admin-manager-success" role="status">
          {message}
        </p>
      )}

      {editingId && (
        <form className="admin-event-edit-form" onSubmit={saveEvent}>
          <h3>Edit Event</h3>

          <label>
            Event title
            <input
              name="title"
              value={form.title}
              onChange={changeField}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={changeField}
              rows={4}
            />
          </label>

          <label>
            Category
            <select
              name="category"
              value={form.category}
              onChange={changeField}
            >
              {[
                "Music",
                "Sports",
                "Workshops",
                "Business",
                "Art",
                "Other",
              ].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Event date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={changeField}
              required
            />
          </label>

          <label>
            Location address
            <input
              name="address"
              value={form.address}
              onChange={changeField}
              required
            />
          </label>

          <div className="admin-edit-grid">
            <label>
              Latitude
              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Longitude
              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={changeField}
                required
              />
            </label>
          </div>
<div className="admin-image-field">
  <label>
    Upload poster from My Files
    <input
      type="file"
      accept="image/*"
      onChange={handleImageFile}
    />
  </label>

  <label>
    Or paste a direct Google image URL
    <input
      type="url"
      value={
        form.image.startsWith("data:image/")
          ? ""
          : form.image
      }
      onChange={(event) =>
        setForm((previous) => ({
          ...previous,
          image: event.target.value,
        }))
      }
      placeholder="https://example.com/poster.jpg"
    />
  </label>

 {form.image && (
  <div className="admin-image-preview">
    <p>Poster preview</p>

    <img
      src={form.image}
      alt="Event poster preview"
      style={{
        display: "block",
        width: "100%",
        maxWidth: "320px",
        maxHeight: "280px",
        objectFit: "contain",
        border: "1px solid #777",
        borderRadius: "8px",
      }}
      onError={(event) => {
        event.currentTarget.style.display = "none";
        setError(
          "Image could not load. Upload a local image or use a direct image URL."
        );
      }}
      onLoad={(event) => {
        event.currentTarget.style.display = "block";
        setError("");
      }}
    />

    <button
      type="button"
      onClick={() =>
        setForm((previous) => ({
          ...previous,
          image: "",
        }))
      }
    >
      Remove poster
    </button>
  </div>
)}
</div>

          <h4>Ticket prices (₹)</h4>

          <div className="admin-edit-grid">
            <label>
              Gold
              <input
                type="number"
                min="0"
                name="gold"
                value={form.gold}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Premium
              <input
                type="number"
                min="0"
                name="premium"
                value={form.premium}
                onChange={changeField}
                required
              />
            </label>

            <label>
              Royal
              <input
                type="number"
                min="0"
                name="royal"
                value={form.royal}
                onChange={changeField}
                required
              />
            </label>
          </div>

          <label className="admin-featured-checkbox">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={changeField}
            />
            Mark as featured
          </label>

          <div className="admin-edit-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={cancelEditing}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No active events available.</p>
      ) : (
        <div className="admin-manage-list">
          {events.map((event) => {
            const id = getId(event);

            return (
              <article className="admin-manage-card" key={id}>
                <div className="admin-manage-details">
                  <h3>{event.title || "Untitled event"}</h3>
                  <p>{event.category || "Other"}</p>

                  <p>
                    {event.date
                      ? new Date(event.date).toLocaleDateString()
                      : "Date not set"}
                  </p>

                  <p>
                    {event.location?.address ||
                      (typeof event.location === "string"
                        ? event.location
                        : "Location not set")}
                  </p>
                </div>

                <div className="admin-manage-actions">
                  <button
                    type="button"
                    onClick={() => startEditing(event)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    disabled={deletingId === id}
                    onClick={() => deleteEvent(event)}
                  >
                    {deletingId === id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="admin-recycle-bin">
        <div className="admin-manager-heading">
          <div>
            <h2>🗑️ Recently Deleted Events</h2>
            <p>
              Deleted events can be restored within 24 hours.
            </p>
          </div>

          <button
            type="button"
            className="admin-manager-refresh"
            onClick={toggleRecycleBin}
          >
            {showRecycleBin ? "Hide Recycle Bin" : "Open Recycle Bin"}
          </button>
        </div>

        {showRecycleBin && (
          <>
            <button
              type="button"
              className="admin-recycle-refresh"
              onClick={refreshRecycleBin}
            >
              Refresh Recycle Bin
            </button>

            {deletedEvents.length === 0 ? (
              <p className="admin-recycle-empty">
                No recently deleted events.
              </p>
            ) : (
              <div className="admin-manage-list">
                {deletedEvents.map((event) => {
                  const id = getId(event);
                  const remaining = getRemainingTime(event.purgeAt, now);
                  const expired = remaining <= 0;

                  return (
                    <article className="admin-manage-card" key={id}>
                      <div className="admin-manage-details">
                        <h3>{event.title || "Untitled event"}</h3>

                        <p>
                          Deleted:{" "}
                          {event.deletedAt
                            ? new Date(event.deletedAt).toLocaleString()
                            : "Unknown"}
                        </p>

                        <p
                          className={
                            expired
                              ? "admin-recovery-expired"
                              : "admin-recovery-time"
                          }
                        >
                          {formatRemainingTime(remaining)}
                        </p>
                      </div>

                      <div className="admin-manage-actions">
                        <button
                          type="button"
                          disabled={expired || restoringId === id}
                          onClick={() => restoreDeletedEvent(event)}
                        >
                          {restoringId === id ? "Restoring..." : "Restore"}
                        </button>

                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() => permanentlyDeleteEvent(event)}
                        >
                          Permanently Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
