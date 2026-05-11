import React, { useEffect, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const registerLink = refCode ? `/register?ref=${refCode}` : "/register";

  useEffect(() => {
    if (user && user.token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landing-page">
      <Helmet>
        <title>Sahayam — No one should face hardship alone.</title>
        <meta name="description" content="A trusted community network where people can ask for help, support others, and stay connected during difficult moments." />
      </Helmet>

      {/* HEADER */}
      <div className="landing-header-wrapper">
        <header className="landing-container landing-header">
          <Link to="/" className="landing-logo">
            <img src={logo} alt="Sahayam Logo" />
            Sahayam
          </Link>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="landing-container">
          <h1 className="hero-title">Help is closer than you think.</h1>
          <p className="hero-subtitle">
            Sahayam brings together caring people, trusted volunteers, and local communities so that support is always within reach when life feels overwhelming.
          </p>
          <div className="hero-actions">
            <Link to={registerLink} className="landing-btn landing-btn-primary landing-btn-large" style={{ backgroundColor: 'var(--theme-pine-teal)', boxShadow: 'none' }}>
              Get Started
            </Link>
            <Link to="/login" className="landing-btn landing-btn-secondary landing-btn-large">
              Sign In
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
              <h3 className="trust-title">Verified Community Members</h3>
              <p className="trust-desc">Every helper goes through identity verification to create a safer and more dependable environment for everyone.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><FaShieldAlt /></div>
              <h3 className="trust-title">Private & Secure</h3>
              <p className="trust-desc">Your personal details stay protected. You decide when and how your information is shared.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><FaRegLightbulb /></div>
              <h3 className="trust-title">Built on Trust</h3>
              <p className="trust-desc">Community reviews and transparent interactions help create a space where people can confidently support one another.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><FaHandsHelping /></div>
              <h3 className="trust-title">Support You Can Follow</h3>
              <p className="trust-desc">Stay updated throughout the process with clear communication and real-time request progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works-section">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">How Sahayam Works</h2>
            <p className="section-subtitle">A calm and simple way to ask for help or support someone nearby.</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Share Your Situation</h3>
              <p className="step-desc">Tell the community what kind of support you need, and nearby verified volunteers will be notified instantly.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Choose Who Helps</h3>
              <p className="step-desc">View volunteer profiles, community feedback, and availability before deciding who you feel most comfortable with.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Receive Support Safely</h3>
              <p className="step-desc">Stay connected through secure in-app communication and track updates until your request is completed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SCREENS */}
      <section className="product-screens-section">
        <div className="landing-container">
          <div className="screens-container">
            <div className="screens-content">
              <h3>Designed to feel simple during difficult moments.</h3>
              <p>When someone needs help, every second matters. Sahayam is designed to reduce confusion and make support feel calm, clear, and accessible.</p>
            </div>
            
            <div className="screens-list">
              <div className="screen-list-item">
                <div className="screen-list-icon-wrapper">
                  <FaMapMarkerAlt />
                </div>
                <div className="screen-list-text">
                  <h4>Nearby Support</h4>
                  <p>Quickly connect with trusted volunteers close to your location without endless searching.</p>
                </div>
              </div>
              <div className="screen-list-item">
                <div className="screen-list-icon-wrapper">
                  <FaComments />
                </div>
                <div className="screen-list-text">
                  <h4>Safe Conversations</h4>
                  <p>Chat securely inside the app without exposing personal contact information.</p>
                </div>
              </div>
              <div className="screen-list-item">
                <div className="screen-list-icon-wrapper">
                  <FaBell />
                </div>
                <div className="screen-list-text">
                  <h4>Live Updates</h4>
                  <p>Know when your request is accepted, who is responding, and when support is on the way.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="mission-section">
        <div className="landing-container">
          <h2 className="mission-title">Why We Built Sahayam</h2>
          <p className="mission-desc">
            We believe communities become stronger when people feel seen, supported, and connected. Sahayam was created to make helping one another easier, safer, and more human — especially during moments when kindness matters most.
          </p>
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
            Built with care for communities that care for each other.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;