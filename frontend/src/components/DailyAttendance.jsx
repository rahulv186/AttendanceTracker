import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchDayTimetable, updateAttendance } from "../services/api";
import { CheckCircle, XCircle, Calendar, Send } from "lucide-react";

export default function DailyAttendance({ onUpdate }) {
  const today = new Date().toISOString().split("T")[0];
  console.log(today);
  
  const [date, setDate] = useState(today);
  const [dayInfo, setDayInfo] = useState(null); // { day, classes }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Local state for toggling: period -> { status: 'present'|'absent', locked: boolean }
  const [attendanceState, setAttendanceState] = useState({});

  useEffect(() => {
    loadTimetable(date);
  }, [date]);

  const loadTimetable = async (selectedDate) => {
    setLoading(true);
    try {
      const res = await fetchDayTimetable(selectedDate);
      setDayInfo(res);

      // Pre-fill local state
      const newState = {};
      res.classes.forEach((cls) => {
        newState[cls.period] = {
          status: cls.logStatus || "present", // Default to present if no log
          locked: cls.hasLog, // Lock if a log already exists in DB
        };
      });
      setAttendanceState(newState);
    } catch (err) {
      toast.error(err.message || "Failed to load timetable");
      setDayInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (period, status) => {
    setAttendanceState((prev) => ({
      ...prev,
      [period]: { status, locked: true }, // Immediate lock on click
    }));
  };

  const handleSubmit = async () => {
    if (!dayInfo || dayInfo.classes.length === 0) return;

    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    // Filter to only submit items that are newly locked (meaning we just toggled them)
    // Actually, locking is just visual. We can submit all items that don't already have hasLog=true in DB,
    // or just submit everything that is currently "locked" in local state but was not hasLog=true in original data
    const toSubmit = dayInfo.classes.filter(
      (cls) => !cls.hasLog && attendanceState[cls.period]?.locked,
    );

    if (toSubmit.length === 0) {
      toast("No new attendance to submit.", { icon: "ℹ️" });
      setSubmitting(false);
      return;
    }

    try {
      await Promise.all(
        toSubmit.map((cls) =>
          updateAttendance({
            subjectId: cls.subject._id,
            date,
            period: cls.period,
            status: attendanceState[cls.period].status,
          }),
        ),
      );
      successCount = toSubmit.length;
    } catch (err) {
      errorCount++;
      toast.error("Failed to submit some entries.");
    } finally {
      setSubmitting(false);
      if (successCount > 0) {
        toast.success(
          `Successfully saved attendance for ${successCount} classes.`,
        );
        onUpdate(); // Refresh dashboard stats
        loadTimetable(date); // Reload to lock items officially
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Date Control */}
      <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2 transition-colors">
            <Calendar
              size={18}
              className="text-indigo-600 dark:text-indigo-400"
            />
            Mark Attendance
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 transition-colors">
            {dayInfo?.day
              ? `Showing timetable for ${dayInfo.day}`
              : "Select a date to view classes"}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-widest pl-1 transition-colors">
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading || submitting}
            max={today}
            className="px-4 py-2.5 rounded-xl bg-light-800 dark:bg-dark-700 border border-light-500 dark:border-dark-500 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-8 flex justify-center text-indigo-600 dark:text-indigo-400">
          Loading classes...
        </div>
      ) : dayInfo?.classes?.length === 0 ? (
        <div className="glass-card p-8 text-center border-light-600 dark:border-dark-600 border-dashed">
          <p className="text-slate-500 dark:text-gray-400 text-sm transition-colors">
            No classes scheduled for this day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayInfo?.classes.map((cls) => {
            const { subject, period } = cls;
            const state = attendanceState[period] || {};
            const isPresent = state.status === "present";
            const isLocked = state.locked;
            const dbLocked = cls.hasLog; // Locked from DB explicitly

            return (
              <div
                key={cls._id}
                className={`glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${isLocked ? "bg-light-700/80 dark:bg-dark-800/80" : "bg-white dark:bg-dark-800"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-light-800 dark:bg-dark-700 flex items-center justify-center shrink-0 border border-light-600 dark:border-dark-600 text-slate-500 dark:text-gray-400 font-mono text-xs font-bold shadow-sm dark:shadow-inner transition-colors">
                    P{period}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-0.5 transition-colors">
                      {subject.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleToggle(period, "present")}
                    disabled={isLocked}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isPresent
                        ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "bg-light-800 dark:bg-dark-700 text-slate-500 dark:text-gray-400 border border-transparent hover:bg-light-700 dark:hover:bg-dark-600 hover:text-slate-800 dark:hover:text-white"
                    } ${isLocked ? "opacity-60 cursor-not-allowed hidden sm:flex" : "cursor-pointer"}`}
                    style={{
                      display: isLocked && !isPresent ? "none" : "flex",
                    }}
                  >
                    <CheckCircle size={15} />
                    {dbLocked && isPresent ? "Present (Saved)" : "Present"}
                  </button>

                  <button
                    onClick={() => handleToggle(period, "absent")}
                    disabled={isLocked}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      !isPresent
                        ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                        : "bg-light-800 dark:bg-dark-700 text-slate-500 dark:text-gray-400 border border-transparent hover:bg-light-700 dark:hover:bg-dark-600 hover:text-slate-800 dark:hover:text-white"
                    } ${isLocked ? "opacity-60 cursor-not-allowed hidden sm:flex" : "cursor-pointer"}`}
                    style={{ display: isLocked && isPresent ? "none" : "flex" }}
                  >
                    <XCircle size={15} />
                    {dbLocked && !isPresent ? "Absent (Saved)" : "Absent"}
                  </button>

                  {isLocked && !dbLocked && (
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest animate-pulse ml-2 font-medium">
                      Pending Save
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="pt-4 flex justify-end sticky bottom-4 z-10">
            <button
              onClick={handleSubmit}
              disabled={submitting || dayInfo?.classes.every((c) => c.hasLog)}
              className="btn-primary flex items-center gap-2 shadow-xl shrink-0 whitespace-nowrap"
            >
              {submitting ? "Saving..." : "Submit Attendance"}
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
