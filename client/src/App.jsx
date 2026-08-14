import { useState } from "react";
import "./App.css";

import EventMap from "./components/EventMap";
import CreateEvent from "./components/CreateEvent";
import EventList from "./components/EventList";
import EventDetails from "./components/EventDetails";
import MyBookings from "./components/MyBookings";

function App() {
  const [page, setPage] = useState("discover");
  const [location, setLocation] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Open event details
  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setPage("details");
  };

  // Go back from event details
  const handleBack = () => {
    setSelectedEventId(null);
    setPage("discover");
  };

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">

        <div
          className="logo"
          onClick={() => {
            setSelectedEventId(null);
            setPage("discover");
          }}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-icon">✦</span>
          <span>Eventora</span>
        </div>

        <div className="nav-links">

          <button
            className={page === "discover" ? "active-nav" : ""}
            onClick={() => {
              setSelectedEventId(null);
              setPage("discover");
            }}
          >
            Discover
          </button>

          <button
            className={page === "bookings" ? "active-nav" : ""}
            onClick={() => {
              setSelectedEventId(null);
              setPage("bookings");
            }}
          >
            My Bookings
          </button>

          <button>
            Admin
          </button>

        </div>

        <button className="theme-button">
          ☼
        </button>

      </nav>


      {/* ================= DISCOVER ================= */}

      {page === "discover" && (
        <>
          {/* HERO */}
          <section className="hero">

            <div className="hero-badge">
              ✧ Discover unforgettable experiences
            </div>

            <h1>
              Find your next{" "}
              <span>event</span>, explore it on the map.
            </h1>

            <p>
              Discover concerts, workshops, sports and amazing
              events around you.
            </p>

            {/* SEARCH */}
            <div className="search-box">
              🔍

              <input
                type="text"
                placeholder="Search events by name or city..."
              />
            </div>

            {/* CATEGORIES */}
            <div className="categories">

              <button className="active">
                ▦ All Events
              </button>

              <button>
                ♫ Music
              </button>

              <button>
                ⚙ Tech
              </button>

              <button>
                🏆 Sports
              </button>

              <button>
                🔧 Workshops
              </button>

              <button>
                💼 Business
              </button>

            </div>

          </section>


          {/* ================= MAP ================= */}

          <section className="map-section">

            <h2>
              Explore Events Near You
            </h2>

            <p className="section-subtitle">
              Select a location on the map to create an event.
            </p>

          <EventMap
  setLocation={setLocation}
  enableLocationSelection={true}
/>

            {location && (
              <div className="selected-location">

                <strong>
                  Selected Location
                </strong>

                <p>
                  Latitude:{" "}
                  {location.lat.toFixed(6)}

                  <br />

                  Longitude:{" "}
                  {location.lng.toFixed(6)}
                </p>

              </div>
            )}

          </section>


          {/* ================= CREATE EVENT ================= */}

          <section className="create-section">

            <CreateEvent
              location={location}
            />

          </section>


          {/* ================= EVENTS ================= */}

          <section className="events-section">

            <EventList
              onSelectEvent={handleSelectEvent}
            />

          </section>

        </>
      )}


      {/* ================= MY BOOKINGS ================= */}

      {page === "bookings" && (
        <section className="bookings-section">

          <MyBookings />

        </section>
      )}


      {/* ================= EVENT DETAILS ================= */}

      {page === "details" && selectedEventId && (
        <section className="details-section">

          <EventDetails
            eventId={selectedEventId}
            onBack={handleBack}
          />

        </section>
      )}

    </div>
  );
}

export default App;