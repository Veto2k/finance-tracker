import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {GoogleOAuthProvider, GoogleLogin, googleLogout} from "@react-oauth/google"
import axios from "axios";
import "./Login.css"; // Ensure styles are applied

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload

    try {
      const response = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token); // Store the token
        navigate("/dashboard");
      
        setError("");
      }

      // Save JWT token in localStorage
      // localStorage.setItem("token", response.data.token);

      // Redirect to dashboard after login
      // navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed!");
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    console.log(credentialResponse)
    const response = await axios.post("http://localhost:3000/auth/google", {
      token: credentialResponse.credential, // Google token
    });
    console.log(response.data)
    localStorage.setItem("token", response.data.jwtToken);

    navigate("/dashboard");
      
    setError("");
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-heading">Login</h2>

        {error && <p className="error-message">{error}</p>}

        <div className="input-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="login-button">Login</button>

        <div className="separator">
          <span>OR</span>
        </div>

        <GoogleOAuthProvider clientId="1094210636831-r4nf7522f0osickv6qs67geh71nhedm6.apps.googleusercontent.com">
      <GoogleLogin onSuccess={handleGoogleLogin} onError={() => console.log("Login Failed")} />
    </GoogleOAuthProvider>

        <p className="signup-link">Don't have an account? <span onClick={() => navigate("/signup")}>Sign Up</span></p>
      </form>
    </div>
  );
};

export default Login;
