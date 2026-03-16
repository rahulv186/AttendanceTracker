const SETTINGS_KEY = "attendanceReminderSettings";
const STATE_KEY = "attendanceReminderState";

const DEFAULT_SETTINGS = {
  enabled: false,
  time: "18:00",
};

export const getReminderSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      time: typeof parsed.time === "string" ? parsed.time : DEFAULT_SETTINGS.time,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const setReminderSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getReminderState = () => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { date: null, lastNotifiedAt: null, completed: false };
    const parsed = JSON.parse(raw);
    return {
      date: parsed.date || null,
      lastNotifiedAt: parsed.lastNotifiedAt || null,
      completed: Boolean(parsed.completed),
    };
  } catch {
    return { date: null, lastNotifiedAt: null, completed: false };
  }
};

export const setReminderState = (state) => {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
};

export const resetReminderStateForDate = (date) => {
  setReminderState({
    date,
    lastNotifiedAt: null,
    completed: false,
  });
};

