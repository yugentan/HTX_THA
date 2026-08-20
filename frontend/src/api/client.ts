import axios from "axios";

// API_BASE_URL is inlined at build time by webpack DefinePlugin,
// sourced from .env / .env.production (or the compose build arg).
const client = axios.create({
  baseURL: process.env.API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export default client;
