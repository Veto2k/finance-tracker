import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css"; // Add CSS for styling

/**
 * Navbar Component
 * Displays the main navigation bar with links to different sections of the application
 */
const Navbar = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="navbar">
      {/* Application Logo */}
      <h1 className="navbar-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Finance Tracker</h1>
      
      {/* Navigation Links */}
      <ul className="nav-links">
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/transactions">Transactions</NavLink></li>
        <li><NavLink to="/budgets">Budgets</NavLink></li>
        <li><NavLink to="/profile">Profile</NavLink></li>
      </ul>
    </nav>
  );
};

export default Navbar;
