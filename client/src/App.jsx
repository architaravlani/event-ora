import { useState } from "react";
import "./App.css";

import EventMap from "./components/EventMap";
import CreateEvent from "./components/CreateEvent";
import EventList from "./components/EventList";
import EventDetails from "./components/EventDetails";
import MyBookings from "./components/MyBookings";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [page, setPage] = useState("discover");
  const [location, setLocation] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [darkMode, setDarkMode] = useState(true);

  // Check existing login
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("eventoraToken"))
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("eventoraUser")) || null;
    } catch {
      return null;
    }
  });

  const goToDiscover = () => {
    setSelectedEventId(null);
    setPage("discover");
  };

  const goToBookings = () => {
    setSelectedEventId(null);
    setPage("bookings");
  };

  const goToAdmin = () => {
    setSelectedEventId(null);

    // Admin/Create Event requires login
    if (!localStorage.getItem("eventoraToken")) {
      setPage("login");
      return;
    }

    setPage("admin");
  };

  const goToLogin = () => {
    setSelectedEventId(null);
    setPage("login");
  };

  const goToRegister = () => {
    setSelectedEventId(null);
    setPage("register");
  };

  const handleLogin = (data) => {
    localStorage.setItem("eventoraToken", data.token);

    if (data.user) {
      localStorage.setItem("eventoraUser", JSON.stringify(data.user));
      setUser(data.user);
    }

    setIsLoggedIn(true);

    // After login, go directly to Admin
    setPage("admin");
  };

  const handleRegister = (data) => {
    // Register API also returns a token
    if (data?.token) {
      localStorage.setItem("eventoraToken", data.token);
    }

    if (data?.user) {
      localStorage.setItem("eventoraUser", JSON.stringify(data.user));
      setUser(data.user);
    }

    if (data?.token) {
      setIsLoggedIn(true);
      setPage("admin");
    } else {
      setPage("login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eventoraToken");
    localStorage.removeItem("eventoraUser");

    setIsLoggedIn(false);
    setUser(null);
    setLocation(null);
    setSelectedEventId(null);
    setPage("discover");
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setPage("details");
  };

  const handleBack = () => {
    setSelectedEventId(null);
    setPage("discover");
  };

  return (
    <div className={`app ${darkMode ? "dark-mode" : "light-mode"}`}>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div
          className="logo"
          onClick={goToDiscover}
          role="button"
          tabIndex={0}
        >
          <span className="logo-icon">✦</span>
          <span>Eventora</span>
        </div>

        <div className="nav-links">
          {/* DISCOVER */}
          <button
            className={page === "discover" ? "active-nav" : ""}
            onClick={goToDiscover}
          >
            Discover
          </button>

          {/* MY BOOKINGS */}
          <button
            className={page === "bookings" ? "active-nav" : ""}
            onClick={goToBookings}
          >
            My Bookings
          </button>

          {/* ADMIN */}
          {isLoggedIn && user?.role === "admin" && (
  <button
    className={page === "admin" ? "active-nav" : ""}
    onClick={goToAdmin}
  >
    Admin
  </button>
)}
        </div>

        {/* RIGHT SIDE NAV */}
        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span className="user-name">
                {user?.name ? `Hi, ${user.name}` : "Logged In"}
              </span>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className="login-nav-button"
              onClick={goToLogin}
            >
              Login
            </button>
          )}

          {/* DARK / LIGHT MODE */}
          <button
            className="theme-button"
            onClick={() => setDarkMode((current) => !current)}
            title={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            type="button"
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
      </nav>

      {/* ================= DISCOVER ================= */}
      {page === "discover" && (
        <>
          <section className="hero">
            <div className="hero-badge">
              ✦ Discover unforgettable experiences
            </div>

            <h1>
              Find your next <span>event</span>, explore it on the map.
            </h1>

            <p>
              Discover concerts, workshops, sports and amazing events
              around you.
            </p>
          </section>

          <section className="events-section">
            <EventList onSelectEvent={handleSelectEvent} />
          </section>
        </>
      )}

      {/* ================= MY BOOKINGS ================= */}
      {page === "bookings" && (
        <section className="bookings-section">
          <MyBookings />
        </section>
      )}

      {/* ================= LOGIN ================= */}
      {page === "login" && (
        <Login
          onLogin={handleLogin}
          onRegister={goToRegister}
        />
      )}

      {/* ================= REGISTER ================= */}
      {page === "register" && (
        <Register
          onRegister={handleRegister}
          onLogin={goToLogin}
        />
      )}

      {/* ================= ADMIN ================= */}
      {page === "admin" && (
        <main className="admin-page">
          {!isLoggedIn ? (
            <section className="auth-required">
              <div className="auth-card">
                <div className="hero-badge">🔐 Login Required</div>

                <h1>
                  Admin <span>Access</span>
                </h1>

                <p>
                  Please login to your Eventora account before
                  creating an event.
                </p>

                <button
                  type="button"
                  onClick={goToLogin}
                >
                  Login to Continue
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="admin-header">
                <div className="hero-badge">
                  ✦ Eventora Admin
                </div>

                <h1>
                  Create a new <span>event</span>
                </h1>

                <p>
                  Add your event details and choose its exact
                  location on the map.
                </p>
              </section>

              <section className="admin-location-section">
                <div className="section-heading">
                  <h2>Choose Event Location</h2>

                  <p>
                    Search for a city or address, or click directly
                    on the map.
                  </p>
                </div>

                <EventMap
                  setLocation={setLocation}
                  enableLocationSelection={true}
                />

                {location && (
                  <div className="selected-location">
                    <strong>✓ Location Selected</strong>

                    <p>
                      Latitude: {location.lat.toFixed(6)}
                      <br />
                      Longitude: {location.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </section>

              <section className="admin-create-section">
                <CreateEvent
                  location={location}
                  setLocation={setLocation}
                />
              </section>
            </>
          )}
        </main>
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