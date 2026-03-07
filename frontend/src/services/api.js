import axios from "axios";

const API = axios.create({
  baseURL: `http://localhost:5001/api`,
  timeout: 100000,
});

// Interceptor for consistent error handling
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message || error.message || "Network Error";
    return Promise.reject(new Error(message));
  },
);

export const fetchAttendance = () => API.get("/attendance");
export const updateAttendance = (payload) =>
  API.post("/attendance/update", payload);
export const fetchPrediction = () => API.get("/attendance/predict");
export const fetchProjection = () => API.get("/attendance/projection");
export const fetchDayTimetable = (date) =>
  API.get("/attendance/day-timetable", { params: { date } });
export const seedSubjects = (overwrite) =>
  API.post("/attendance/seed-subjects", { overwrite });
export const seedTimetable = () => API.post("/attendance/seed-timetable");
export const resetDatabase = () => API.post("/attendance/reset-db");

// Subject Management CRUD
export const createSubject = (payload) => API.post("/subjects", payload);
export const updateSubject = (id, payload) =>
  API.put(`/subjects/${id}`, payload);
export const deleteSubject = (id) => API.delete(`/subjects/${id}`);
export const bulkSaveSubjects = (subjectsArray) =>
  API.post("/subjects/bulk", { subjects: subjectsArray });

// Timetable Management
export const fetchAllTimetables = () => API.get("/timetable-manage");
export const bulkSaveTimetable = (timetablesArray) =>
  API.post("/timetable-manage/bulk", { timetables: timetablesArray });

export default API;
