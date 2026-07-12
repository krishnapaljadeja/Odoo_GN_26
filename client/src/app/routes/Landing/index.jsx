import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Reveal } from "../../components/animation";
import Navbar from "../../containers/Navbar";
import Footer from "../../components/Footer";
import "./index.scss";

const Landing = () => {
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.classList.add("landing-theme");
    return () => {
      document.body.classList.remove("landing-theme");
    };
  }, []);

  return (
    <div className="Landing">
      <Navbar />
      <Reveal className="landing-hero">
        <div className="landing-hero__background" aria-hidden="true">
          <span className="hero-word">assetflow</span>
        </div>

        {/* Brutalist scattered decorative icons */}
        <div className="brutalist-scatter" aria-hidden="true">
          <svg className="scatter-icon scatter--star" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9" />
          </svg>
          <svg className="scatter-icon scatter--circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="22" height="22">
            <circle cx="12" cy="12" r="9" />
          </svg>
          <svg className="scatter-icon scatter--zigzag" viewBox="0 0 32 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="36" height="14">
            <polyline points="2,10 8,2 14,10 20,2 26,10 32,2" />
          </svg>
          <svg className="scatter-icon scatter--cross" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="9" y="2" width="6" height="20" rx="1" />
            <rect x="2" y="9" width="20" height="6" rx="1" />
          </svg>
        </div>

        <div className="landing-hero__content">
          <div className="eyebrow">ASSETFLOW</div>
          <h1 className="title">Manage every asset with clarity.</h1>
          
          {/* Neo-brutalist elements */}
          <div className="brutalist-deck-container">
            {/* Speech bubble tags */}
            <div className="floating-bubble bubble--blue">
              <span>@it-admin</span>
            </div>
            <div className="floating-bubble bubble--green">
              <span>@assigned</span>
            </div>

            {/* Overlapping/fanned cards */}
            <div className="brutalist-deck">
              
              {/* Card 1 */}
              <div className="brutalist-card card--blue">
                <span className="card-badge">ASSIGNED</span>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div className="card-details">
                  <span className="card-id">#WS-291</span>
                  <span className="card-title">MacBook Pro</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="brutalist-card card--yellow">
                <span className="card-badge">MAINTENANCE</span>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div className="card-details">
                  <span className="card-id">#WR-08</span>
                  <span className="card-title">HVAC Unit</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="brutalist-card card--pink">
                <span className="card-badge">IN USE</span>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div className="card-details">
                  <span className="card-id">#CAM-104</span>
                  <span className="card-title">Sony FX3</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="brutalist-card card--green">
                <span className="card-badge">SECURED</span>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="card-details">
                  <span className="card-id">#KEY-09</span>
                  <span className="card-title">Server Rack</span>
                </div>
              </div>

              {/* Card 5 */}
              <div className="brutalist-card card--red">
                <span className="card-badge">RETURNED</span>
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </div>
                <div className="card-details">
                  <span className="card-id">#PHN-44</span>
                  <span className="card-title">iPad Pro</span>
                </div>
              </div>

            </div>
          </div>


          <div className="actions">
            {auth.isAuthenticated ? (
              <Link to="/dashboard">
                <button className="button button--primary">Open dashboard</button>
              </Link>
            ) : (
              <React.Fragment>
                <Link to="/login">
                  <button className="button button--primary">Get Started</button>
                </Link>
                <Link to="/signup">
                  <button className="button button--secondary">Create account</button>
                </Link>
              </React.Fragment>
            )}
          </div>
        </div>
      </Reveal>
      <Footer />
    </div>
  );
};

export default Landing;
