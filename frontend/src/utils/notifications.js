export const supportsNotifications = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator;

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
};

export const showAttendanceReminderNotification = async () => {
  if (!supportsNotifications() || Notification.permission !== "granted") {
    return false;
  }

  const title = "Attendance Reminder";
  const options = {
    body: "Please fill today's attendance. Reminder repeats every 30 mins until you mark at least one class.",
    tag: "attendance-daily-reminder",
    renotify: true,
    icon: "/vite.svg",
    badge: "/vite.svg",
  };

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    // Fall back to window notification
  }

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      window.location.href = "/";
    };
    return true;
  } catch {
    return false;
  }
};

