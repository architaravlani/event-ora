
import { useEffect, useState } from "react";
import "./App.css";
import "./landing.css";

import AdminEventManager from "./components/AdminEventManager";
import AdminBookings from "./components/AdminBookings";
import EventMap from "./components/EventMap";
import CreateEvent from "./components/CreateEvent";
import EventList from "./components/EventList";
import EventDetails from "./components/EventDetails";
import MyBookings from "./components/MyBookings";

import Login from "./components/login.jsx";
import Register from "./components/Register";
import HeroShowcase from "./components/HeroShowcase";
import CountUp from "./components/CountUp";

const SEARCH_HINTS = [
  "Search concerts, comedy shows...",
  "Search workshops near you...",
  "Search by artist, city or venue...",
  "Search sports and meetups...",
];

function App() {
  const [page, setPage] = useState("discover");
  const [location, setLocation] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [adminTab, setAdminTab] = useState("events");
  const [selectedCategory, setSelectedCategory] = useState("All Events");
  const [searchTerm, setSearchTerm] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [heroStats, setHeroStats] = useState(null);
  const [hintIndex, setHintIndex] = useState(0);

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

  const categories = [
    "All Events",
    "Music",
    "Sports",
    "Workshops",
    "Business",
    "Art",
    "Other",
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    document.documentElement.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  // Rotate the hero search placeholder automatically.
  useEffect(() => {
    if (page !== "discover") return undefined;

    const timer = setInterval(
      () => setHintIndex((current) => (current + 1) % SEARCH_HINTS.length),
      3200
    );
    return () => clearInterval(timer);
  }, [page]);

  const scrollToEvents = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("events")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleHeroSearch = (event) => {
    event.preventDefault();
    setSearchTerm(heroSearch.trim());
    setSelectedCategory("All Events");
    scrollToEvents();
  };

  const goToDiscover = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setPage("discover");
  };

  const goToBookings = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setPage("bookings");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToLogin = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setPage("login");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToRegister = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setPage("register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToAdmin = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);

    const token = localStorage.getItem("eventoraToken");

    if (!token) {
      goToLogin();
      return;
    }

    if (user?.role !== "admin") {
      setPage("discover");
      return;
    }

    setAdminTab("events");
    setPage("admin");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = (data) => {
    if (!data?.token) return;

    localStorage.setItem("eventoraToken", data.token);

    if (data.user) {
      localStorage.setItem("eventoraUser", JSON.stringify(data.user));
      setUser(data.user);
    }

    setIsLoggedIn(true);
    setPage(data.user?.role === "admin" ? "admin" : "discover");
    setAdminTab("events");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setPage(data.user?.role === "admin" ? "admin" : "discover");
      setAdminTab("events");
    } else {
      setPage("login");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("eventoraToken");
    localStorage.removeItem("eventoraUser");

    setIsLoggedIn(false);
    setUser(null);
    setLocation(null);
    setSelectedEventId(null);
    setSelectedEvent(null);
    setSelectedCategory("All Events");
    setPage("discover");
  };

  const handleSelectEvent = (eventOrId, eventObject) => {
    const event =
      eventObject ||
      (typeof eventOrId === "object" ? eventOrId : null);

    const id =
      typeof eventOrId === "object"
        ? eventOrId?._id || eventOrId?.id
        : eventOrId;

    if (!id) {
      console.error("Event ID is missing.");
      return;
    }

    setSelectedEventId(id);
    setSelectedEvent(event);
    setPage("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    setPage("discover");
  };

  return (
    <div className={`app ${darkMode ? "dark-mode" : "light-mode"}`}>
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
            type="button"
            className={
              page === "discover" || page === "details" ? "active-nav" : ""
            }
            onClick={goToDiscover}
          >
            Discover
          </button>

          <button
            type="button"
            className={page === "bookings" ? "active-nav" : ""}
            onClick={goToBookings}
          >
            My Bookings
          </button>

          {isLoggedIn && user?.role === "admin" && (
            <button
              type="button"
              className={page === "admin" ? "active-nav" : ""}
              onClick={goToAdmin}
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

          <button
            type="button"
            className="theme-button"
            onClick={() => setDarkMode((current) => !current)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? "☀" : "☾"}
          </button>
        </div>
      </nav>

      {page === "discover" && (
        <>
          <section className="hero">
            <div className="hero-bg" aria-hidden="true">
              <span className="hero-blob hero-blob-one" />
              <span className="hero-blob hero-blob-two" />
              <span className="hero-grid" />
            </div>

            <div className="hero-inner">
              <div className="hero-content">
                <div className="hero-badge">
                  <span className="hero-badge-dot" />
                  Your next great experience starts here
                </div>

                <h1>
                  Discover experiences
                  <br />
                  <span>worth remembering.</span>
                </h1>

                <p>
                  Concerts, comedy nights, workshops, sports and meetups —
                  find what&apos;s happening around you and book your tickets
                  in seconds.
                </p>

                <form className="hero-search" onSubmit={handleHeroSearch}>
                  <svg
                    className="hero-search-icon"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m20 20-3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="search"
                    value={heroSearch}
                    onChange={(event) => setHeroSearch(event.target.value)}
                    placeholder={SEARCH_HINTS[hintIndex]}
                    aria-label="Search events"
                  />
                  <button type="submit">Search</button>
                </form>

                <div className="hero-actions">
                  <button
                    type="button"
                    className="hero-primary-button"
                    onClick={scrollToEvents}
                  >
                    Explore Events <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="hero-secondary-button"
                    onClick={goToBookings}
                  >
                    My Bookings
                  </button>
                </div>

                {heroStats && heroStats.upcoming > 0 && (
                  <dl className="hero-stats">
                    <div>
                      <dt>
                        <CountUp value={heroStats.upcoming} />
                      </dt>
                      <dd>Upcoming events</dd>
                    </div>
                    <div>
                      <dt>
                        <CountUp value={Math.max(heroStats.categories, 1)} />
                      </dt>
                      <dd>Categories</dd>
                    </div>
                    <div>
                      <dt>3</dt>
                      <dd>Ticket tiers</dd>
                    </div>
                  </dl>
                )}
              </div>

              <HeroShowcase
                onSelectEvent={handleSelectEvent}
                onStats={setHeroStats}
              />
            </div>
          </section>

          <section id="events" className="events-section">
            <div className="section-heading discover-heading">
              <span className="section-eyebrow">What&apos;s on</span>
              <h2>Explore Events</h2>
              <p>
                {selectedCategory === "All Events"
                  ? "Find something exciting to do next."
                  : `Discover the best ${selectedCategory.toLowerCase()} events.`}
              </p>
            </div>

            <EventList
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              search={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectEvent={handleSelectEvent}
            />
          </section>
        </>
      )}

      {page === "details" && selectedEventId && (
        <section className="details-section">
          <EventDetails
            eventId={selectedEventId}
            event={selectedEvent}
            onBack={handleBack}
          />
        </section>
      )}

      {page === "bookings" && (
        <section className="bookings-section">
          <div className="bookings-header">
            <div className="hero-badge">✦ Your Events</div>
            <h1>
              My <span>Bookings</span>
            </h1>
            <p>Keep track of the events you've booked.</p>
          </div>

          <MyBookings />
        </section>
      )}

      {page === "login" && (
        <Login onLogin={handleLogin} onRegister={goToRegister} />
      )}

      {page === "register" && (
        <Register onRegister={handleRegister} onLogin={goToLogin} />
      )}

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
                  Please log in to your Eventora account before managing events.
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
                <p>Your account does not have administrator access.</p>
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
                <div className="hero-badge">✦ Eventora Admin</div>
                <h1>
                  Admin <span>Dashboard</span>
                </h1>
                <p>Manage your events and monitor customer bookings.</p>
              </section>

              <div className="admin-dashboard-tabs">
                <button
                  type="button"
                  className={`admin-tab ${
                    adminTab === "events" ? "active" : ""
                  }`}
                  onClick={() => setAdminTab("events")}
                >
                  📅 Update Events
                </button>

                <button
                  type="button"
                  className={`admin-tab ${
                    adminTab === "database" ? "active" : ""
                  }`}
                  onClick={() => setAdminTab("database")}
                >
                  🗄️ Booking Database
                </button>
              </div>

              {adminTab === "events" && (
                <div className="admin-events-section">
                  <section className="admin-location-section">
                    <div className="section-heading">
                      <h2>Choose Event Location</h2>
                      <p>
                        Search for a city or address, or click directly on the
                        map.
                      </p>
                    </div>

                    <EventMap
                      location={location}
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

                  <section className="admin-existing-events">
                    <AdminEventManager />
                  </section>
                </div>
              )}

              {adminTab === "database" && (
                <div className="admin-database-section">
                  <AdminBookings />
                </div>
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
