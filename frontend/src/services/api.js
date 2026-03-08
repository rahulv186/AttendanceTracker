import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 100000,
});

// Attach JWT to every request if present
const setAuthHeader = () => {
  const token = localStorage.getItem("token");
  API.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : "";
};
setAuthHeader();

// Re-apply token when localStorage may have changed (e.g. after login)
export const setToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
  setAuthHeader();
};

// Interceptor for consistent error handling and 401 redirect
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthHeader();
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }

    let message;

    if (status >= 500) {
      // Hide technical server errors / stack traces
      message = "Something went wrong. Please try again.";
    } else if (
      status === 400 &&
      backendMessage &&
      /required|validation/i.test(backendMessage)
    ) {
      message = "Please fill all required fields";
    } else if (backendMessage) {
      message = backendMessage;
    } else if (error.message) {
      message = error.message;
    } else {
      message = "Network error. Please try again.";
    }

    const customError = new Error(message);
    customError.status = status;

    return Promise.reject(customError);
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
