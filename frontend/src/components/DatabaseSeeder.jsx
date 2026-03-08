import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  seedSubjects as apiSeedSubjects,
  seedTimetable as apiSeedTimetable,
  resetDatabase,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkSaveSubjects,
  fetchAttendance,
  fetchAllTimetables,
  bulkSaveTimetable,
} from "../services/api";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Calendar,
  BookOpen,
  Plus,
  Save,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function DatabaseSeeder({ onUpdate }) {
  const [loading, setLoading] = useState("");

  // Subject State
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Timetable State
  const [timetables, setTimetables] = useState([]); // Array of { _id, day, period, subject: _id }
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [activeDay, setActiveDay] = useState("Monday");
  const [timetableModified, setTimetableModified] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingSubjects(true);
    setLoadingTimetable(true);
    try {
      // 1. Load Subjects
      const subRes = await fetchAttendance();
      const editableSubjects = (subRes.subjects || []).map((s) => ({
        ...s,
        _modified: false,
        _isNew: false,
      }));
      console.log(editableSubjects);
      setSubjects(editableSubjects);

      // 2. Load Timetable
      const ttRes = await fetchAllTimetables();
      // Unpack populated subjects back to simple references for the editor
      const rawTimetables = (ttRes.timetables || []).map((t) => ({
        _id: t._id || `temp_${Math.random()}`,
        day: t.day,
        period: t.period,
        subjectId: t.subject?._id || t.subject, // handle depending on if populated
      }));
      setTimetables(rawTimetables);
      setTimetableModified(false);
    } catch (err) {
      toast.error("Failed to load database state.");
    } finally {
      setLoadingSubjects(false);
      setLoadingTimetable(false);
    }
  };

  // -------------------------
  // TIMETABLE CRUD
  // -------------------------

  // Group timetables by day for easy rendering
  const timetablesByDay = useMemo(() => {
    const grouped = {};
    DAYS_OF_WEEK.forEach((d) => (grouped[d] = []));

    // Sort array so periods are in order natively
    const sorted = [...timetables].sort((a, b) => a.period - b.period);

    sorted.forEach((t) => {
      if (grouped[t.day]) grouped[t.day].push(t);
    });
    return grouped;
  }, [timetables]);

  const handleTimetableChange = (ttId, field, value) => {
    const updated = timetables.map((t) => {
      if (t._id === ttId) {
        return { ...t, [field]: field === "period" ? Number(value) : value };
      }
      return t;
    });
    setTimetables(updated);
    setTimetableModified(true);
  };

  const handleAddPeriod = (day) => {
    const dayPeriods = timetablesByDay[day];
    const maxPeriod =
      dayPeriods.length > 0 ? Math.max(...dayPeriods.map((p) => p.period)) : 0;

    const newEntry = {
      _id: `temp_${Date.now()}`,
      day,
      period: maxPeriod + 1,
      subjectId: subjects.length > 0 ? subjects[0]._id : "", // Default to first subject
    };

    setTimetables([...timetables, newEntry]);
    setTimetableModified(true);
  };

  const handleRemovePeriod = (ttId) => {
    setTimetables(timetables.filter((t) => t._id !== ttId));
    setTimetableModified(true);
  };

  const handleSaveTimetable = async () => {
    // Validate: prevent missing subjectIds
    const invalid = timetables.some((t) => !t.subjectId);
    if (invalid) {
      toast.error(
        "All periods must have a subject assigned. Remove empty periods.",
      );
      return;
    }

    setLoading("save-timetable");
    try {
      // Map to expected backend format: { day, period, subject }
      const payload = timetables.map((t) => ({
        day: t.day,
        period: t.period,
        subject: t.subjectId,
      }));

      const res = await bulkSaveTimetable(payload);
      toast.success(res.message);
      setTimetableModified(false);
      onUpdate();
    } catch (err) {
      toast.error(err.message || "Failed to save timetable");
    } finally {
      setLoading("");
    }
  };

  // -------------------------
  // SEEDER ACTIONS
  // -------------------------

  const handleSeedSubjects = async (overwrite = false) => {
    setLoading("subjects");
    try {
      const res = await apiSeedSubjects(overwrite);
      toast.success(res.message);
      onUpdate();
      loadData();
    } catch (err) {
      if (err.message.includes("overwrite: true")) {
        if (
          window.confirm(
            "Subjects already exist. Do you want to wipe the database and overwrite them?",
          )
        ) {
          handleSeedSubjects(true);
        }
      } else {
        toast.error(err.message || "Failed to seed subjects");
      }
    } finally {
      if (!window.confirm) setLoading("");
      else setLoading("");
    }
  };

  const handleSeedTimetable = async () => {
    setLoading("timetable");
    try {
      const res = await apiSeedTimetable();
      toast.success(res.message);
      onUpdate();
      loadData();
    } catch (err) {
      toast.error(
        err.message || "Failed to seed timetable. Did you seed subjects first?",
      );
    } finally {
      setLoading("");
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "⚠️ WARNING: This will completely wipe all Subjects, Timetables, and Attendance Logs. Are you absolutely sure?",
      )
    ) {
      return;
    }

    setLoading("reset");
    try {
      const res = await resetDatabase();
      toast.success(res.message);
      onUpdate();
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to reset database");
    } finally {
      setLoading("");
    }
  };

  // -------------------------
  // SUBJECT CRUD
  // -------------------------

  const calculatePct = (attended, conducted) => {
    if (!conducted || conducted === 0) return 0;
    return Number(((attended / conducted) * 100).toFixed(2));
  };

  const getRiskColor = (pct) => {
    if (pct >= 75) return "text-emerald-400";
    if (pct >= 65) return "text-amber-400";
    return "text-rose-400";
  };

  const handleChange = (index, field, value) => {
    const updated = [...subjects];
    if (
      ["totalConducted", "totalAttended", "totalPlanned", "canBunk"].includes(field,)
    ) {
      value = value === "" ? 0 : Number(value);
    }
    updated[index] = { ...updated[index], [field]: value, _modified: true };
    setSubjects(updated);
  };

  const handleAddNew = () => {
    setSubjects([
      ...subjects,
      {
        name: "",
        shortName: "",
        code: "",
        totalConducted: 0,
        totalAttended: 0,
        totalPlanned: 45,
        canBunk: 11,
        color: "#6366f1",
        _modified: true,
        _isNew: true,
        _id: "temp_" + Date.now(),
      },
    ]);
  };

  const handleDeleteSubject = async (index, id, isNew) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this subject? It will delete related timetable and attendance logs too.",
      )
    )
      return;

    if (isNew) {
      const updated = [...subjects];
      updated.splice(index, 1);
      setSubjects(updated);
      return;
    }

    setLoading(`delete-${id}`);
    try {
      await deleteSubject(id);
      toast.success("Subject deleted");
      const updated = [...subjects];
      updated.splice(index, 1);
      setSubjects(updated);

      // Remove orphaned timetables locally
      setTimetables(timetables.filter((t) => t.subjectId !== id));

      onUpdate();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setLoading("");
    }
  };

  const handleSaveSubject = async (index, sub) => {
    setLoading(`save-${sub._id}`);
    try {
      const {
        _modified,
        _isNew,
        attendancePercentage,
        safeBunks,
        riskLevel,
        _id,
        ...payload
      } = sub;

      if (sub._isNew) {
        const res = await createSubject(payload);
        const updated = [...subjects];
        updated[index] = { ...res.subject, _modified: false, _isNew: false };
        setSubjects(updated);
      } else {
        const res = await updateSubject(_id, payload);
        const updated = [...subjects];
        updated[index] = { ...res.subject, _modified: false, _isNew: false };
        setSubjects(updated);
      }
      toast.success("Subject saved!");
      onUpdate();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setLoading("");
    }
  };

  const handleBulkSave = async () => {
    const modifiedSubjects = subjects.filter((s) => s._modified);
    if (modifiedSubjects.length === 0) {
      toast("No changes to save", { icon: "ℹ️" });
      return;
    }

    setLoading("bulk");
    try {
      const payload = modifiedSubjects.map((sub) => {
        const {
          _modified,
          _isNew,
          attendancePercentage,
          safeBunks,
          riskLevel,
          ...data
        } = sub;
        if (_isNew && data._id.startsWith("temp_")) {
          delete data._id;
        }
        return data;
      });

      await bulkSaveSubjects(payload);
      toast.success(`Saved ${payload.length} subjects successfully`);
      loadData();
      onUpdate();
    } catch (err) {
      toast.error(err.message || "Bulk save failed");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="glass-card p-6 border border-light-500 dark:border-dark-500 transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <Database
            className="text-indigo-600 dark:text-indigo-400"
            size={24}
          />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-colors">
            Subjects & Timetable Management
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors">
          Initialize your Subjects, Attendance and Timetable, reset terms, manage existing subjects, and
          configure your weekly timetable.
        </p>
      </div>

      {/* =======================
          SUBJECTS MANAGEMENT 
      ======================== */}
      <div className="mt-8 mb-4 pt-4 border-t border-light-600 dark:border-dark-600/50 transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 transition-colors">
          <BookOpen
            className="text-indigo-600 dark:text-indigo-400"
            size={18}
          />
          Subject Attendance Inputs
        </h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 transition-colors">
          Add, edit, or adjust your subject details manually. Ensure you save
          before modifying timetables.
        </p>

        {loadingSubjects ? (
          <div className="glass-card p-10 flex justify-center text-indigo-400">
            <RefreshCw className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((sub, idx) => {
              console.log(sub.shortName);
              
              const livePct = calculatePct(
                sub.totalAttended,
                sub.totalConducted,
              );
              const riskColor = getRiskColor(livePct);

              return (
                <div
                  key={sub._id}
                  className="glass-card p-0 overflow-hidden flex flex-col md:flex-row shadow-lg border border-light-500 dark:border-dark-600 transition-all focus-within:border-indigo-500/50 dark:focus-within:border-indigo-500/50"
                >
                  <div
                    className="w-full md:w-2 min-h-[4px]"
                    style={{ backgroundColor: sub.color }}
                  ></div>
                  <div className="p-4 md:p-5 flex-1 flex flex-col gap-4">
                    {/* Header Row */}
                    <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row pb-2 border-b border-light-600 dark:border-dark-600/50 transition-colors">
                      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                            Subject Name
                          </label>
                          <input
                            value={sub.name}
                            onChange={(e) =>
                              handleChange(idx, "name", e.target.value)
                            }
                            placeholder="e.g. Design and Analysis of Algorithms"
                            className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                            Short Name
                          </label>
                          <input
                            value={sub.shortName}
                            onChange={(e) =>
                              handleChange(idx, "shortName", e.target.value)
                            }
                            placeholder="e.g. DAA"
                            className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                            Code
                          </label>
                          <input
                            value={sub.code}
                            onChange={(e) =>
                              handleChange(idx, "code", e.target.value)
                            }
                            placeholder="e.g. 21CSC204J"
                            className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Live PC Box */}
                      <div className="shrink-0 bg-light-800 dark:bg-dark-800 rounded-lg py-2 px-4 shadow-sm dark:shadow-inner border border-light-600 dark:border-dark-600 w-full md:w-auto flex justify-between md:justify-center items-center gap-3 transition-colors">
                        <span className="text-xs text-slate-500 dark:text-gray-400 font-medium transition-colors">
                          Live %
                        </span>
                        <span
                          className={`text-xl font-bold font-mono transition-colors ${riskColor}`}
                        >
                          {livePct}%
                        </span>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                          Conducted
                        </label>
                        <input
                          type="number"
                          value={sub.totalConducted}
                          onChange={(e) =>
                            handleChange(idx, "totalConducted", e.target.value)
                          }
                          className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 font-mono transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                          Attended
                        </label>
                        <input
                          type="number"
                          value={sub.totalAttended}
                          onChange={(e) =>
                            handleChange(idx, "totalAttended", e.target.value)
                          }
                          className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 font-mono transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                          Total Planned
                        </label>
                        <input
                          type="number"
                          value={sub.totalPlanned}
                          onChange={(e) =>
                            handleChange(idx, "totalPlanned", e.target.value)
                          }
                          className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 font-mono transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block transition-colors">
                          Can Bunk
                        </label>
                        <input
                          type="number"
                          value={sub.canBunk}
                          onChange={(e) =>
                            handleChange(idx, "canBunk", e.target.value)
                          }
                          className="w-full bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 font-mono transition-colors"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1 flex items-end justify-between md:justify-start gap-4 h-full pt-1">
                        <div className="flex-1 md:flex-none">
                          <label className="text-[10px] text-slate-500 dark:text-gray-500 uppercase font-semibold mb-1 block md:hidden transition-colors">
                            Color
                          </label>
                          <input
                            type="color"
                            value={sub.color}
                            onChange={(e) =>
                              handleChange(idx, "color", e.target.value)
                            }
                            className="w-full md:w-10 h-8 md:h-[30px] rounded cursor-pointer bg-light-800 dark:bg-dark-700/50 border border-light-500 dark:border-dark-500 p-0 transition-colors"
                          />
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-auto pb-[2px]">
                          {sub._modified && (
                            <button
                              onClick={() => handleSaveSubject(idx, sub)}
                              disabled={loading === `save-${sub._id}`}
                              className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                              title="Save Changes"
                            >
                              {loading === `save-${sub._id}` ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Save size={14} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteSubject(idx, sub._id, sub._isNew)
                            }
                            disabled={loading === `delete-${sub._id}`}
                            className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                            title="Delete Subject"
                          >
                            {loading === `delete-${sub._id}` ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-gray-400 border border-dashed border-light-500 dark:border-dark-500 rounded-xl transition-colors">
                No subjects found in the database.
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <button
                onClick={handleAddNew}
                className="w-full sm:w-auto px-5 py-2.5 bg-light-800 dark:bg-dark-700 hover:bg-light-700 dark:hover:bg-dark-600 border border-light-500 dark:border-dark-500 text-slate-800 dark:text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} /> Add New Subject
              </button>

              <button
                onClick={handleBulkSave}
                disabled={
                  loading === "bulk" || !subjects.some((s) => s._modified)
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "bulk" ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {loading === "bulk" ? "Saving..." : "Save All Subject Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================
          TIMETABLE MANAGEMENT 
      ======================== */}
      <div className="mt-12 mb-4 pt-8 border-t border-light-600 dark:border-dark-600/50 transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 transition-colors">
          <Calendar className="text-cyan-600 dark:text-cyan-400" size={18} />
          Weekly Timetable Setup
        </h3>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-6 transition-colors">
          Design your fixed weekly schedule. Periods run chronologically per
          day.
        </p>

        {loadingTimetable ? (
          <div className="glass-card p-10 flex justify-center text-cyan-600 dark:text-cyan-400 transition-colors">
            <RefreshCw className="animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-500 dark:text-gray-400 border border-dashed border-light-500 dark:border-dark-500 rounded-xl transition-colors">
            You must add subjects above before configuring the timetable.
          </div>
        ) : (
          <div className="glass-card p-4 border border-light-500 dark:border-dark-500 transition-colors">
            {/* Day Nav Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2 border-b border-light-600 dark:border-dark-600 transition-colors">
              {DAYS_OF_WEEK.map((day) => {
                const count = timetablesByDay[day].length;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${activeDay === day ? "bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30" : "bg-light-800 dark:bg-dark-800 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-light-700 dark:hover:bg-dark-700"}`}
                  >
                    {day}{" "}
                    <span className="ml-1 text-[10px] opacity-70 bg-light-600 dark:bg-dark-900 px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Day Grid */}
            <div className="space-y-3">
              {timetablesByDay[activeDay].length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-gray-500 text-sm transition-colors">
                  No periods assigned for {activeDay}.
                </div>
              ) : (
                timetablesByDay[activeDay].map((tt, idx) => (
                  <div
                    key={tt._id}
                    className="flex items-center gap-3 bg-light-800/50 dark:bg-dark-800 p-3 rounded-xl border border-light-500 dark:border-dark-600 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-light-800 dark:bg-dark-900 border border-light-500 dark:border-dark-500 flex items-center justify-center font-mono font-bold text-cyan-600 dark:text-cyan-400 shrink-0 transition-colors">
                      P{tt.period}
                    </div>

                    <div className="flex-1 flex gap-3 flex-col sm:flex-row">
                      <div className="flex-1 relative">
                        <select
                          value={tt.subjectId}
                          onChange={(e) =>
                            handleTimetableChange(
                              tt._id,
                              "subjectId",
                              e.target.value,
                            )
                          }
                          className="w-full appearance-none bg-light-800 dark:bg-dark-700 border border-light-500 dark:border-dark-500 text-slate-800 dark:text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 transition-colors"
                        >
                          <option value="" disabled>
                            Select Subject...
                          </option>
                          {subjects.map((s) => (
                            <option key={s._id} value={s._isNew ? "" : s._id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-3 text-slate-500 dark:text-gray-500 pointer-events-none transition-colors"
                        />
                      </div>

                      <div className="w-full sm:w-24 relative">
                        <input
                          type="number"
                          min="1"
                          value={tt.period}
                          onChange={(e) =>
                            handleTimetableChange(
                              tt._id,
                              "period",
                              e.target.value,
                            )
                          }
                          className="w-full bg-light-800 dark:bg-dark-700 border border-light-500 dark:border-dark-500 text-slate-800 dark:text-white rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 font-mono transition-colors"
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 dark:text-gray-500 uppercase font-bold transition-colors">
                          P
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemovePeriod(tt._id)}
                      className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-transparent hover:border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors"
                      title="Remove Period"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={() => handleAddPeriod(activeDay)}
                className="w-full py-3 mt-4 border border-dashed border-light-500 dark:border-dark-500 text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} /> Add Period to {activeDay}
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveTimetable}
                disabled={loading === "save-timetable" || !timetableModified}
                className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "save-timetable" ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {loading === "save-timetable"
                  ? "Saving Timetable..."
                  : "Save Timetable Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="py-2">
        <hr className="border-light-600 dark:border-dark-600 transition-colors" />
      </div>

      {/* QUICK SEEDERS (Original Danger/Automated) */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 mt-8 transition-colors">
        Automated Data Entry Only For CSE L
      </h3>
      <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 transition-colors">
        Fast data input
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen
                size={18}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <h3 className="text-base font-bold text-slate-800 dark:text-white transition-colors">
                CSE L Subjects Template
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 transition-colors">
              Populates preloaded CSE L subjects. Replaces existing data.
            </p>
          </div>
          <button
            onClick={() => handleSeedSubjects(false)}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-light-800 dark:bg-dark-700 hover:bg-indigo-600 dark:hover:bg-indigo-600 border border-light-500 dark:border-dark-600 text-slate-800 dark:text-white hover:text-white rounded-lg text-sm font-semibold transition-all"
          >
            Execute
          </button>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar
                size={18}
                className="text-cyan-600 dark:text-cyan-400"
              />
              <h3 className="text-base font-bold text-slate-800 dark:text-white transition-colors">
                CSE L TimeTable Template
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 transition-colors">
              Autofills Timetable for CSE L.
            </p>
          </div>
          <button
            onClick={handleSeedTimetable}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-light-800 dark:bg-dark-700 hover:bg-cyan-600 dark:hover:bg-cyan-600 border border-light-500 dark:border-dark-600 text-slate-800 dark:text-white hover:text-white rounded-lg text-sm font-semibold transition-all"
          >
            Execute         </button>
        </div>
      </div>

      <div className="glass-card p-6 border border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 mt-6 transition-colors">
        <div className="flex items-start justify-between sm:items-center flex-col sm:flex-row gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                size={18}
                className="text-rose-600 dark:text-rose-400 transition-colors"
              />
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 transition-colors">
                Danger Zone
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors">
              Permanently wipe all database collections.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={!!loading}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2 bg-white dark:bg-dark-800 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl font-semibold transition-all"
          >
            {loading === "reset" ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Trash2 size={16} />
            )}
            Reset Database
          </button>
        </div>
      </div>
    </div>
  );
}