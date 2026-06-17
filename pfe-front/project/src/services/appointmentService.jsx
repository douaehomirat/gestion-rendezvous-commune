import axios from "axios";

const API_URL = "https://gestion-rendezvous-commune-production-b126.up.railway.app/api/appointments";

/* ================= CRUD ================= */

export const createAppointment = (data) =>
  axios.post(API_URL, data);

export const getAppointments = () =>
  axios.get(API_URL);

export const deleteAppointment = (id) =>
  axios.delete(`${API_URL}/${id}`);

export const updateAppointment = (id, data) =>
  axios.put(`${API_URL}/${id}`, data);

/* ================= ACTIONS ================= */

export const confirmAppointment = (id) =>
  axios.put(`${API_URL}/${id}/confirm`);

export const cancelAppointment = (id) =>
  axios.put(`${API_URL}/${id}/cancel`);

export const completeAppointment = (id) =>
  axios.put(`${API_URL}/${id}/complete`);