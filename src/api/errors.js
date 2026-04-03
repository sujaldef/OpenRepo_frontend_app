// src/api/errors.js

import api from "./axios";

export const fetchRepoErrors = (repoId) =>
  api.get(`/errors/repo/${repoId}`)
     .then(r => r.data);