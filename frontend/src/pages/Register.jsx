import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import API, { setToken } from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import PasswordInput from "../components/PasswordInput";
import { validateName, validateEmail, validatePassword } from "../utils/validation";

const inputBase =
  "w-full px-4 py-3 sm:py-2.5 rounded-2xl border bg-white/80 dark:bg-dark-700/85 text-slate-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition";
const inputError = "border-rose-500 dark:border-rose-500";
const inputDefault = "border-white/70 dark:border-dark-600";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const navigate = useNavigate();

  const clearApiError = () => setApiError("");

  const validate = useCallback(() => {
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ name: nameErr, email: emailErr, password: passwordErr });
    return !nameErr && !emailErr && !passwordErr;
  }, [name, email, password]);

  useEffect(() => {
    if (touched.name || touched.email || touched.password) validate();
  }, [name, email, password, touched, validate]);

  const handleBlur = (field) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    clearApiError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const data = await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      if (data?.token) {
        setToken(data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        navigate("/", { replace: true });
      } else {
        // Fallback: if token missing for some reason, send user to login
        navigate("/login", { replace: true });
      }
    } catch (err) {
      let message = err.message || "Registration failed";

      if (
        err.status === 400 &&
        message.toLowerCase().includes("account with this email")
      ) {
        message = "An account with this email already exists";
      } else if (
        err.status === 400 &&
        /required|validation/i.test(message)
      ) {
        message = "Please fill all required fields";
      } else if (err.status >= 500) {
        message = "Something went wrong. Please try again.";
      }

      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    !validateName(name) && !validateEmail(email) && !validatePassword(password);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 transition-colors duration-300">
      <AuthThemeToggle />

      <div className="w-full max-w-md">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-[0_12px_24px_rgba(10,132,255,0.35)]">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                AttendanceOS
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Create your account
              </p>
            </div>
          </div>

          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={handleInputChange(setName)}
                onBlur={handleBlur("name")}
                placeholder="Your name"
                autoComplete="name"
                maxLength={30}
                className={`${inputBase} ${errors.name ? inputError : inputDefault}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleInputChange(setEmail)}
                onBlur={handleBlur("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={`${inputBase} ${errors.email ? inputError : inputDefault}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={handleInputChange(setPassword)}
                onBlur={handleBlur("password")}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                error={errors.password}
                className={`${inputBase} pr-12 ${errors.password ? inputError : inputDefault}`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full btn-primary py-3 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sky-600 hover:text-sky-500 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
