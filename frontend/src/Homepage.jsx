import { useNavigate } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className="navbar">
        <div className="brand">Finance<span>Tracker</span></div>
        <button 
          className="auth-button"
          onClick={() => navigate("/login")}
        >
          Log In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Simplify Your <span>Financial Life</span></h1>
            <p>An intuitive personal finance tool that helps you track expenses, manage budgets, and achieve your financial goals with confidence.</p>
            <button 
              className="cta-button"
              onClick={() => navigate("/dashboard")}
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Everything you need for <span>financial success</span></h2>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="icon expense-icon"></div>
              <h3>Track Expenses</h3>
              <p>Monitor your spending habits with detailed categorization and real-time tracking.</p>
            </div>
            
            <div className="feature-card">
              <div className="icon budget-icon"></div>
              <h3>Set Budgets</h3>
              <p>Create custom budgets for different categories and receive alerts as you approach limits.</p>
            </div>
            
            <div className="feature-card">
              <div className="icon goal-icon"></div>
              <h3>Achieve Goals</h3>
              <p>Set savings goals and track your progress with visual indicators and milestone rewards.</p>
            </div>
            
            <div className="feature-card">
              <div className="icon insight-icon"></div>
              <h3>Gain Insights</h3>
              <p>Visualize your financial health with interactive charts and personalized reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <div className="testimonial-content">
            <h2>Join thousands of satisfied users</h2>
            <div className="stats">
              <div className="stat">
                <span className="number">50K+</span>
                <span className="label">Active Users</span>
              </div>
              <div className="stat">
                <span className="number">98%</span>
                <span className="label">Satisfaction</span>
              </div>
              <div className="stat">
                <span className="number">$2M+</span>
                <span className="label">Managed Monthly</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to take control of your finances?</h2>
          <p>Start your journey to financial freedom today</p>
          <button 
            className="cta-button large"
            onClick={() => navigate("/dashboard")}
          >
            Get Started
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="brand">Finance<span>Tracker</span></div>
            <p>© 2023 FinanceTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
