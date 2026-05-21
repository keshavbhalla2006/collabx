import { createContext, useContext, useState, useEffect } from 'react';
//createContext → creates global state, useContext → access that state anywhere, useState → store user/token/loading, useEffect → run side effects (like API calls), axios → for HTTP requests.
import axios from 'axios';

const AuthContext = createContext(); //global container for authentication data.

// Base URL for all API calls — change this once when deploying
axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => { //This wraps the app and provides authentication data to all components.
  const [user, setUser] = useState(null); //logged in user info
  const [token, setToken] = useState(localStorage.getItem('collabx_token')); //JWT token
  const [loading, setLoading] = useState(true); //whether app is still checking auth

  // Set Authorization header on every request automatically
  useEffect(() => {
    if (token) {// whenever token changes, If token exists → attach it to all requests, If not → remove it
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // On app load, if token exists, fetch the user profile
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data.user);
        } catch {
          // Token is invalid or expired — clear everything
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = (userData, userToken) => {
    localStorage.setItem('collabx_token', userToken);
    setToken(userToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
  };
  /*
When user logs in:
Save token in localStorage
Update React state
Set Axios header
*/

  const logout = () => {
    localStorage.removeItem('collabx_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };
/*
Clears everything:
Remove token from storage
Reset state
Remove auth header
*/

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — any component can call useAuth() to get user/login/logout
export const useAuth = () => useContext(AuthContext);


//This file is React Authentication context using Context API + Axios. It centralizes login state so any component can access user info without prop drilling.
//createContext creates a global store. AuthProvider wraps the whole app and shares user, login, and logout. Any component anywhere in the tree can call useAuth() to access these — no prop drilling needed.