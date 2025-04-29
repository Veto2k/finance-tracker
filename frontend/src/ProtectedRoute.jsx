import { Navigate, Outlet } from "react-router-dom";
import { useState , useEffect } from "react";
import axios from "axios"

const ProtectedRoute = () => {
    const [isValid, setIsValid] = useState(null);
    const token = localStorage.getItem("token");
  
    useEffect(() => {
      const validateToken = async () => {
        if (!token) {
          setIsValid(false);
          return;
        }
  
        try {
          const response = await axios.get("http://localhost:3000/validate-token", {
            headers: { Authorization: `Bearer ${token}` },
          });
  
          if (response.data.valid) {
            setIsValid(true);
          } else {
            setIsValid(false);
          }
        } catch (error) {
          setIsValid(false);
        }
      };
  
      validateToken();
    }, [token]);
  
    if (isValid === null) return <p>Loading...</p>; // Wait for validation
  
    return isValid ? <Outlet /> : <Navigate to="/login" replace />;
  };

export default ProtectedRoute;
