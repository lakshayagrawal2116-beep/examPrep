import ThemeToggle from './ThemeToggle';

export default function LandingPage({ onSignIn, onSignUp }) {
  return (
    <div className="landing">
      {/* Background effects */}
      <div className="landing-bg">
        <div className="landing-glow landing-glow-1" />
        <div className="landing-glow landing-glow-2" />
        <div className="landing-glow landing-glow-3" />
        <div className="landing-grid" />
      </div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span>ExamPrep AI</span>
          </div>
          <div className="landing-nav-actions">
            <ThemeToggle />
            <button className="landing-btn-ghost" onClick={onSignIn}>Sign In</button>
            <button className="landing-btn-primary" onClick={onSignUp}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <h1 className="landing-headline">
          Your Study Notes,<br />
          <span className="landing-gradient-text">One Question Away</span>
        </h1>
        <p className="landing-subhead">
          Upload your PDFs and instantly get accurate, cited answers from your own study materials.
          Stop scrolling through pages — just ask.
        </p>
        <div className="landing-hero-actions">
          <button className="landing-btn-primary landing-btn-lg" onClick={onSignUp}>
            Sign Up
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button className="landing-btn-outline" onClick={onSignIn}>
            Sign In
          </button>
        </div>
      </section>

      {/* Preview/Mockup */}
      <section className="landing-preview">
        <div className="landing-preview-card">
          <div className="landing-preview-header">
            <div className="landing-preview-dots">
              <span /><span /><span />
            </div>
            <span className="landing-preview-title">ExamPrep AI</span>
          </div>
          <div className="landing-preview-body">
            <div className="landing-preview-msg landing-preview-user">
              Compare the efficiency of Diesel cycle vs Otto cycle
            </div>
            <div className="landing-preview-msg landing-preview-ai">
              <strong>Diesel Cycle vs Otto Cycle — Efficiency Comparison</strong>
              <br /><br />
              The <strong>Diesel cycle</strong> has a higher thermal efficiency than the Otto cycle
              for the same compression ratio, due to its higher expansion ratio.
              <br /><br />
              However, practical Otto engines achieve <strong>25-30%</strong> efficiency while
              Diesel engines reach <strong>35-45%</strong> because Diesel engines operate at
              much higher compression ratios (14-25 vs 8-12).
              <br /><br />
              <span className="landing-source">📄 Thermodynamics.pdf · Page 42</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="landing-section-label">Why ExamPrep AI</div>
        <h2 className="landing-section-title">Built for serious exam preparation</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3>Multi-Document Search</h3>
            <p>Upload multiple PDFs and query across all of them at once. Select specific documents or search everything.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-feature-icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>Answers From Your Notes</h3>
            <p>Unlike generic AI, every answer comes directly from your uploaded materials — no hallucinated content.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-feature-icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Page-Level Citations</h3>
            <p>Every answer includes the exact document and page number, so you can verify and dig deeper.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-feature-icon-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Streaming Responses</h3>
            <p>Answers appear word by word in real-time — no waiting for the full response to generate.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-feature-icon-rose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Conversation Memory</h3>
            <p>Ask follow-up questions naturally. The AI remembers your conversation context for deeper discussions.</p>
          </div>
          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-feature-icon-cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3>Cross-Device Access</h3>
            <p>Your documents and chat history sync to the cloud. Study on your laptop, continue on your phone.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="landing-section-label">How It Works</div>
        <h2 className="landing-section-title">Three steps to better grades</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-num">1</div>
            <h3>Upload Your PDFs</h3>
            <p>Drop your lecture notes, textbooks, or study guides. We index every page automatically.</p>
          </div>
          <div className="landing-step-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </div>
          <div className="landing-step">
            <div className="landing-step-num">2</div>
            <h3>Ask Questions</h3>
            <p>Type any question — concepts, comparisons, formulas, summaries — in plain English.</p>
          </div>
          <div className="landing-step-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </div>
          <div className="landing-step">
            <div className="landing-step-num">3</div>
            <h3>Get Cited Answers</h3>
            <p>Receive accurate answers with exact page references from your own study materials.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-card">
          <h2>Ready to transform how you study?</h2>
          <p>Stop wasting hours searching through PDFs. Let AI find the answers for you.</p>
          <div className="landing-hero-actions">
            <button className="landing-btn-primary landing-btn-lg" onClick={onSignUp}>
              Sign Up
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button className="landing-btn-outline" onClick={onSignIn}>Sign In</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>© 2026 ExamPrep AI</span>
      </footer>
    </div>
  );
}

