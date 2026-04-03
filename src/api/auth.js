// src/api/auth.js

import api from "./axios";

export const registerUser = (data) =>
  api.post("/auth/register", data).then(r => r.data);

export const loginUser = (data) =>
  api.post("/auth/login", data).then(r => r.data);

export const fetchMe = () =>
  api.get("/auth/me").then(r => r.data);

export const updateMe = (data) =>
  api.put("/auth/me", data).then(r => r.data);

export const logout = (navigate) => {
  localStorage.removeItem("token");
  navigate("/");
};