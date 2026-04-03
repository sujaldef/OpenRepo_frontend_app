// src/api/predictions.js

import api from "./axios";

export const fetchRepoRecommendations = (repoId) =>
  api.get(`/recommendations/${repoId}`)
     .then(r => r.data);