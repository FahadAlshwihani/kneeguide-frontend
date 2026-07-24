import React, { createContext, useContext, useEffect, useState } from "react";

import { getProfile, login as loginApi } from "../api/auth";
import {
  saveAuthData,
  getToken,
  getUserFromStorage,
  clearAuthData,
} from "../utils/storage";

import { ROLE_DOCTOR, ROLE_PATIENT } from "../utils/roles";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // استرجاع الجلسة من التخزين
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUserFromStorage();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // تسجيل الدخول
  const login = async (email, password) => {
    const data = await loginApi(email, password);

    const accessToken = data.access;
    const apiUser = data.user;

    saveAuthData(accessToken, apiUser);

    setToken(accessToken);
    setUser(apiUser);

    return apiUser; // مهم جداً
  };

  // تحديث بيانات البروفايل
  const refreshProfile = async () => {
    const profile = await getProfile();
    const newUser = { ...user, ...profile };

    setUser(newUser);
    saveAuthData(token, newUser);

    return newUser;
  };

  // تسجيل الخروج — بدون navigate هنا
  const logout = () => {
    clearAuthData();
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
    isDoctor: user?.role === ROLE_DOCTOR,
    isPatient: user?.role === ROLE_PATIENT,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
