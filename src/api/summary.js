// src/api/summary.js

import api from "./axios";

export const fetchSummary = (repoId) =>
  api.get(`/summary/${repoId}`)
     .then(r => r.data);