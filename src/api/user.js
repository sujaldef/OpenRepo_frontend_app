import  api  from "./axios";

export const fetchMe = () =>
  api.get("/auth/me").then(r=>r.data);

export const updateMe = (data) =>
  api.put("/auth/me", data);
