/**
 * Client-side validation helpers for auth forms.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s]{3,30}$/;

export function validateEmail(email) {
  if (!email || !email.trim()) return "Email is required";
  if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email (e.g. user@example.com)";
  return "";
}

export function validatePassword(password) {
  if (!password || !password.trim()) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return "";
}

export function validateName(name) {
  if (!name || !name.trim()) return "Name is required";
  const trimmed = name.trim();
  if (trimmed.length < 3) return "Name must be at least 3 characters";
  if (trimmed.length > 30) return "Name must be at most 30 characters";
  if (!NAME_REGEX.test(trimmed)) return "Only letters and spaces allowed";
  return "";
}
