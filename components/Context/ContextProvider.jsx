
'use client';

import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { clearAuthStorage } from "../../utils/auth";

export const AppContext = createContext();

export const ContextProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleClick = () => {
    setIsModalVisible(true);
  };

  const userLogin = (token) => {
    setIsAuth(true);
    setToken(token);
  };

  const userLogout = () => {
    setIsAuth(false);
    setToken(null);
  };

  // Logout function for API interceptor
  const handleLogout = useCallback(() => {
    clearAuthStorage();
    userLogout();
    setIsModalVisible(true);
    window.dispatchEvent(new Event('userLoggedOut'));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.logoutUser = handleLogout;
    }
  }, [handleLogout]);

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener("authUnauthorized", handleUnauthorized);

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      window.removeEventListener("authUnauthorized", handleUnauthorized);
      axios.interceptors.response.eject(interceptorId);
    };
  }, [handleLogout]);

  return (
    <AppContext.Provider value={{ isModalVisible, setIsModalVisible, isAuth, userLogin, setIsAuth, userLogout, email, password, setEmail, setPassword, handleClick }}>
      {children}
    </AppContext.Provider>
  );
};

