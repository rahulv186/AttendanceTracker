import { useEffect } from "react";
import { fetchDayTimetable } from "../services/api";
import {
  getReminderSettings,
  getReminderState,
  resetReminderStateForDate,
  setReminderState,
} from "../utils/reminder";
import {
  showAttendanceReminderNotification,
  supportsNotifications,
} from "../utils/notifications";

const THIRTY_MIN_MS = 30 * 60 * 1000;

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getReminderDateTime = (today, timeString) => {
  const [hh = "18", mm = "00"] = String(timeString).split(":");
  const [year, month, day] = today.split("-").map(Number);
  return new Date(year, month - 1, day, Number(hh), Number(mm), 0, 0);
};

export default function useAttendanceReminder() {
  useEffect(() => {
    let alive = true;

    const checkAndNotify = async () => {
      if (!alive) return;

      const settings = getReminderSettings();
      if (!settings.enabled) return;
      if (!supportsNotifications() || Notification.permission !== "granted") {
        return;
      }

      const now = new Date();
      const today = getToday();
      let state = getReminderState();

      if (state.date !== today) {
        resetReminderStateForDate(today);
        state = getReminderState();
      }

      const reminderAt = getReminderDateTime(today, settings.time);
      if (now < reminderAt || state.completed) return;

      if (state.lastNotifiedAt) {
        const lastMs = new Date(state.lastNotifiedAt).getTime();
        if (!Number.isNaN(lastMs) && now.getTime() - lastMs < THIRTY_MIN_MS) {
          return;
        }
      }

      try {
        const dayData = await fetchDayTimetable(today);
        const hasMarkedAtLeastOne = (dayData?.classes || []).some((cls) => cls.hasLog);
        if (hasMarkedAtLeastOne) {
          setReminderState({
            date: today,
            lastNotifiedAt: state.lastNotifiedAt,
            completed: true,
          });
          return;
        }

        const sent = await showAttendanceReminderNotification();
        if (sent) {
          setReminderState({
            date: today,
            lastNotifiedAt: now.toISOString(),
            completed: false,
          });
        }
      } catch {
        // Quiet failure: scheduler retries on next interval.
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60 * 1000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);
}
