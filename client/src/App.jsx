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

    if (!localStorage.getItem("eventoraToken")) {
      setPage("login");
      return;
    }

    if (user?.role !== "admin") {
      setPage("discover");
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

    // Admin goes to Admin, normal user goes to Discover
    if (data.user?.role === "admin") {
      setPage("admin");
    } else {
      setPage("discover");
    }
  };

  const handleRegister = (data) => {
    if (data?.token) {
      localStorage.setItem("eventoraToken", data.token);
    }

    if (data?.user) {
      localStorage.setItem("eventoraUser", JSON.stringify(data.user));
      setUser(data.user);
    }

    if (data?.token) {
      setIsLoggedIn(true);

      if (data.user?.role === "admin") {
        setPage("admin");
      } else {
        setPage("discover");
      }
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
      {/* NAVBAR */}
      <nav className="navbar">
       <button
  className="logo"
  onClick={goToDiscover}
  type="button"
  aria-label="Eventora Home"
>
  <img
    src="/eventora-logo.png"
    alt="Eventora"
    className="eventora-logo"
  />
</button>
        <div className="nav-links">
          <button
            className={page === "discover" ? "active-nav" : ""}
            onClick={goToDiscover}
            type="button"
          >
            Discover
          </button>

          <button
            className={page === "bookings" ? "active-nav" : ""}
            onClick={goToBookings}
            type="button"
          >
            My Bookings
          </button>

          {isLoggedIn && user?.role === "admin" && (
            <button
              className={page === "admin" ? "active-nav" : ""}
              onClick={goToAdmin}
              type="button"
            >
              Admin
            </button>
          )}
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span className="user-name">
                Hi, {user?.name || "User"}
              </span>

              <button
                className="logout-button"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="login-nav-button"
              onClick={goToLogin}
              type="button"
            >
              Login
            </button>
          )}

          <button
            className="theme-button"
            onClick={() => setDarkMode((current) => !current)}
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            type="button"
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
      </nav>

      {/* DISCOVER */}
      {page === "discover" && (
        <>
          <section className="hero">
  <div className="hero-content">

    <div className="hero-badge">
      <span className="hero-badge-dot"></span>
      Discover unforgettable experiences
    </div>

    <h1>
      Discover experiences
      <br />
      <span>worth remembering.</span>
    </h1>

    <p>
      Find concerts, workshops, sports, meetups and amazing
      events happening around you.
    </p>

    <div className="hero-actions">
      <button
        type="button"
        className="hero-primary-button"
        onClick={() => {
          document
            .querySelector(".events-section")
            ?.scrollIntoView({
              behavior: "smooth",
            });
        }}
      >
        Explore Events
        <span>→</span>
      </button>

      <button
        type="button"
        className="hero-secondary-button"
        onClick={goToBookings}
      >
        My Bookings
      </button>
    </div>

  </div>

  <div className="hero-decoration">
    <div className="hero-glow hero-glow-one"></div>
    <div className="hero-glow hero-glow-two"></div>

    <div className="floating-card floating-card-one">
      <span>🎵</span>
      <div>
        <strong>Live Music</strong>
        <small>Discover events</small>
      </div>
    </div>

    <div className="floating-card floating-card-two">
      <span>📍</span>
      <div>
        <strong>Near You</strong>
        <small>Find local events</small>
      </div>
    </div>

    <div className="hero-orb">
      <span>✦</span>
    </div>
  </div>
</section>

          <section className="events-section">
            <div className="section-heading discover-heading">
              <div>
                <h2>Explore Events</h2>
                <p>Find something exciting to do next.</p>
              </div>
            </div>

            <EventList onSelectEvent={handleSelectEvent} />
          </section>
        </>
      )}

      {/* MY BOOKINGS */}
      {page === "bookings" && (
        <section className="bookings-section">
          <div className="bookings-header">
            <div className="hero-badge">✦ Your Events</div>
            <h1>
              My <span>Bookings</span>
            </h1>
            <p>
              Keep track of the events you've booked.
            </p>
          </div>

          <MyBookings />
        </section>
      )}

      {/* LOGIN */}
      {page === "login" && (
        <Login
          onLogin={handleLogin}
          onRegister={goToRegister}
        />
      )}

      {/* REGISTER */}
      {page === "register" && (
        <Register
          onRegister={handleRegister}
          onLogin={goToLogin}
        />
      )}

      {/* ADMIN */}
      {page === "admin" && (
        <main className="admin-page">
          {!isLoggedIn ? (
            <section className="auth-required">
              <div className="auth-card">
                <div className="hero-badge">
                  🔐 Login Required
                </div>

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
                  className="primary-button"
                >
                  Login to Continue
                </button>
              </div>
            </section>
          ) : user?.role !== "admin" ? (
            <section className="auth-required">
              <div className="auth-card">
                <div className="hero-badge">🚫 Access Restricted</div>

                <h1>
                  Admin <span>Only</span>
                </h1>

                <p>
                  Your account does not have administrator access.
                </p>

                <button
                  type="button"
                  onClick={goToDiscover}
                  className="primary-button"
                >
                  Back to Discover
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

      {/* EVENT DETAILS */}
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