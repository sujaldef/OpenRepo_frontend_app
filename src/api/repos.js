// src/api/repos.js

import api from "./axios";

export const fetchRepos = () =>
  api.get("/repos").then(r => r.data);

export const createRepo = (data) =>
  api.post("/repos", null, { params: data })
     .then(r => r.data);

export const analyzeRepo = (repoId) =>
  api.post(`/repos/${repoId}/analyze`)
     .then(r => r.data);

export const deleteRepo = (repoId) =>
  api.delete(`/repos/${repoId}`)
     .then(r => r.data);