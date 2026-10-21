
import React from "react";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      <nav className="navbar">
        <a href="/" className="brand">
          <span className="brand-icon">✓</span>
          VoteChain
        </a>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/Registration">Register</a>
          <a href="/Results">Results</a>
          <a href="/AdminLogin">Admin</a>
        </div>

        <a href="/Voting" className="nav-button">
          Vote Now
        </a>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="trust-label">
              <span className="status-dot"></span>
              SECURE • TRANSPARENT • BLOCKCHAIN-POWERED
            </div>

            <h1>
              Your Vote.
              <br />
              Your Voice.
              <br />
              <span>Our Future.</span>
            </h1>

            <p className="hero-description">
              Experience a smarter way to vote. Our blockchain-based
              e-voting system brings transparency, security, and
              trust to every vote you cast.
            </p>

            <div className="hero-actions">
              <a href="/Voting" className="primary-button">
                Cast Your Vote <span>→</span>
              </a>
              <a href="/Registration" className="secondary-button">
                Register as Voter
              </a>
            </div>

            <div className="trust-note">
              <span>✓</span> Designed for secure digital elections
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="vote-card">
              <div className="card-top">
                <div className="mini-brand">
                  <span className="brand-icon">✓</span>
                  <span>VoteChain</span>
                </div>
                <span className="secure-tag">● SECURE VOTING</span>
              </div>

              <div className="ballot-heading">
                <span className="ballot-icon">▤</span>
                <div>
                  <h3>Digital Ballot</h3>
                  <p>Your choice matters.</p>
                </div>
              </div>

              <div className="candidate-option selected">
                <span className="candidate-avatar">A</span>
                <span className="candidate-name">Candidate A</span>
                <span className="radio-selected">✓</span>
              </div>

              <div className="candidate-option">
                <span className="candidate-avatar avatar-blue">B</span>
                <span className="candidate-name">Candidate B</span>
                <span className="radio-empty"></span>
              </div>

              <div className="candidate-option">
                <span className="candidate-avatar avatar-purple">C</span>
                <span className="candidate-name">Candidate C</span>
                <span className="radio-empty"></span>
              </div>

              <div className="ballot-footer">
                <span>🔒 Your vote deserves protection</span>
              </div>
            </div>

            <div className="floating-badge">
              <span className="badge-check">✓</span>
              <div>
                <strong>Blockchain Secured</strong>
                <p>Built for transparency</p>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="section-heading">
            <span>WHY VOTECHAIN?</span>
            <h2>Trust every vote.</h2>
            <p>Simple voting with security at its core.</p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon blue-icon">🔐</div>
              <h3>Secure Voting</h3>
              <p>Designed to protect the integrity of every vote.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon purple-icon">⛓</div>
              <h3>Blockchain Powered</h3>
              <p>Blockchain technology supports transparent records.</p>
            </article>

            <article className="feature-card">
              <div className="feature-icon green-icon">📊</div>
              <h3>Transparent Results</h3>
              <p>Access election results through a simple interface.</p>
            </article>
          </div>
        </section>

        <section className="cta-section">
          <h2>Your voice can shape tomorrow.</h2>
          <p>Take part in the digital voting experience.</p>
          <a href="/Registration" className="primary-button">
            Get Started <span>→</span>
          </a>
        </section>
      </main>

      <footer className="home-footer">
        <a href="/" className="brand">
          <span className="brand-icon">✓</span>
          VoteChain
        </a>
        <p>Blockchain-Based E-Voting System · College Project</p>
      </footer>
    </div>
  );
}

export default Home;

