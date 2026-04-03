// src/api/predictions.js

import api from "./axios";

export const fetchPredictions = (repoId) =>
  api.get(`/predictions/${repoId}`)
     .then(r => r.data);