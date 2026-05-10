import React, { useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FaMapMarkerAlt,
  FaShieldAlt,
  FaComments,
  FaBell,
  FaHandsHelping,
  FaUserShield,
  FaRegLightbulb,
  FaHome,
  FaInbox,
  FaUser,
  FaHeartbeat
} from "react-icons/fa";

import logo from "../assets/logo.png";
import AuthContext from "../context/AuthContext";
import "./Landing.css";

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landing-page">
      <Helmet>
        <title>Sahayam - Connect. Rescue. Survive.</title>
        <meta name="description" content="Connect with trusted local helpers and volunteers safely and instantly." />
      </Helmet>

      {/* HEADER */}
      <div className="landing-header-wrapper">
        <header className="landing-container landing-header">
          <Link to="/" className="landing-logo">
            <img src={logo} alt="Sahayam Logo" />
            Sahayam
          </Link>
          <nav className="landing-nav hidden-mobile">
            <Link to="/login" className="landing-nav-link">Sign in</Link>
            <Link to="/register" className="landing-btn landing-btn-primary">Join the Grid</Link>
          </nav>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="landing-container">
          <h1 className="hero-title">When seconds matter,<br />we respond.</h1>
          <p className="hero-subtitle">
            The world's fastest hyper-local community emergency network. Connect instantly with verified volunteers in your neighborhood.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="landing-btn landing-btn-primary landing-btn-large">
              Request Help Now
            </Link>
            <Link to="/login" className="landing-btn landing-btn-secondary landing-btn-large">
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="trust-section">
        <div className="landing-container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon"><FaUserShield /></div>
              <h3 className="trust-title">Verified Helpers</h3>
              <p className="trust-desc">Every volunteer is background-checked and identity-verified to ensure community safety.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><FaShieldAlt /></div>
              <h3 className="trust-title">Secure Requests</h3>
              <p className="trust-desc">Your personal information and location are only shared when you explicitly approve a helper.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><FaRegLightbulb /></div>
              <h3 className="trust-title">Community Moderation</h3>
              <p className="trust-desc">A transparent rating system helps maintain a high-quality, trustworthy environment for everyone.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><FaHandsHelping /></div>
              <h3 className="trust-title">Transparent Support</h3>
              <p className="trust-desc">Clear communication channels and tracking ensure you know exactly when help is arriving.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works-section">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">How Sahayam Works</h2>
            <p className="section-subtitle">A simple, effective way to get the help you need or support your community.</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Raise an Alert</h3>
              <p className="step-desc">Detail what you need help with. The system intelligently matches your request with nearby capable volunteers.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Get Connected</h3>
              <p className="step-desc">Review profiles of interested helpers. Choose someone you feel comfortable with based on their community standing.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Receive Help</h3>
              <p className="step-desc">Communicate safely through the app. Once completed, leave a review to strengthen our community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SCREENS */}
      <section className="product-screens-section">
        <div className="landing-container">
          <div className="screens-container">
            <div className="screens-content">
              <h3>Designed for speed and reliability.</h3>
              <p>In stressful situations, you need an interface that is organized and lightning fast. We've stripped away the clutter to focus on what matters most.</p>
            </div>
            
            <div className="screens-list">
              <div className="screen-list-item">
                <FaMapMarkerAlt className="screen-list-icon" />
                <div className="screen-list-text">
                  <h4>Smart Routing</h4>
                  <p>We find the closest available help instantly without manual searching.</p>
                </div>
              </div>
              <div className="screen-list-item">
                <FaComments className="screen-list-icon" />
                <div className="screen-list-text">
                  <h4>Secure Chat</h4>
                  <p>Communicate directly and safely without sharing your personal phone number.</p>
                </div>
              </div>
              <div className="screen-list-item">
                <FaBell className="screen-list-icon" />
                <div className="screen-list-text">
                  <h4>Real-time Updates</h4>
                  <p>Know exactly when your request is accepted and when your help arrives.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="mission-section">
        <div className="landing-container">
          <h2 className="mission-title">Our Mission</h2>
          <p className="mission-desc">
            We believe that communities are strongest when they help each other. 
            Sahayam was built to create a safe, organized space where local support 
            can happen naturally, securely, and efficiently.
          </p>
          <Link to="/register" className="landing-btn mission-btn landing-btn-large">
            Join the Community
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src={logo} alt="Sahayam Logo" style={{ height: '24px' }} />
              Sahayam
            </div>
            <div className="footer-links">
              <Link to="/terms" className="footer-link">Terms of Service</Link>
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              <a href="mailto:support@sahayam.com" className="footer-link">Contact</a>
            </div>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Sahayam. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;