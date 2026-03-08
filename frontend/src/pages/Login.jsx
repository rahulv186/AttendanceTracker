import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import API, { setToken } from "../services/api";
import AuthThemeToggle from "../components/AuthThemeToggle";
import PasswordInput from "../components/PasswordInput";
import { validateEmail, validatePassword } from "../utils/validation";

const inputBase =
  "w-full px-4 py-3 sm:py-2.5 rounded-xl border bg-white dark:bg-dark-800 text-slate-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition";
const inputError = "border-rose-500 dark:border-rose-500";
const inputDefault = "border-light-600 dark:border-dark-600";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

  const clearApiError = () => setApiError("");

  const validate = useCallback(() => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });
    return !emailErr && !passwordErr;
  }, [email, password]);

  useEffect(() => {
    if (touched.email || touched.password) validate();
  }, [email, password, touched, validate]);

  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    clearApiError();
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    clearApiError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const data = await API.post("/auth/login", { email: email.trim(), password });
      if (data.token) {
        setToken(data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/", { replace: true });
      }
    } catch (err) {
      setApiError(err.message?.includes("Invalid") ? "Invalid email or password" : err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const isValid = !validateEmail(email) && !validatePassword(password);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-light-900 dark:bg-dark-900 transition-colors duration-300">
      <AuthThemeToggle />

      <div className="w-full max-w-md">
        <div className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                AttendanceIQ
              </h1>
              <p className="text-xs text-slate-500 dark:text-gray-500">
                Sign in to your account
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
              <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleBlur("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={`${inputBase} pr-4 ${errors.email ? inputError : inputDefault}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={handlePasswordChange}
                onBlur={handleBlur("password")}
                placeholder="••••••••"
                autoComplete="current-password"
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
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-500 hover:text-indigo-400 font-medium"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
