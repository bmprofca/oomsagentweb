import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaCalendarAlt, FaTimes, FaCheck, FaUndo, FaChevronLeft, FaChevronRight, FaChevronDown,
} from "react-icons/fa";
import SelectField from "./SelectField";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toIsoDate(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value);
  if (typeof value !== "string") return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(d) {
  if (!d) return null;
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function shiftDate(date, days) {
  const next = new Date(date || new Date());
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ─── Year Dropdown ────────────────────────────────────────────────────────────
// Shows a scrollable list of years; clicking header "May 2026" toggles this.

function YearDropdown({ currentYear, onSelect, onClose, minYear = 1900, maxYear }) {
  const max = maxYear || new Date().getFullYear() + 10;
  const years = [];
  for (let y = max; y >= minYear; y--) years.push(y);

  const containerRef = useRef(null);

  // Scroll the selected year into view on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const selected = containerRef.current.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        marginTop: 4,
        width: 140,
        maxHeight: 220,
        overflowY: "auto",
      }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
    >
      {years.map((y) => (
        <button
          key={y}
          data-selected={y === currentYear ? "true" : "false"}
          onClick={() => { onSelect(y); onClose(); }}
          className={`block w-full px-3 py-1.5 text-center text-[13px] transition-colors ${
            y === currentYear 
              ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400" 
              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function Calendar({ mode, viewDate, onViewChange, selectedSingle, onSelectSingle,
  rangeStart, rangeEnd, onRangeClick, onSinglePick, minYear, maxYear }) {

  const [hoverDate, setHoverDate] = useState(null);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const headerRef = useRef(null);

  const today = startOfDay(new Date());
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();

  // Close dropdown on outside click
  useEffect(() => {
    if (!showYearDropdown) return;
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showYearDropdown]);

  function getDayClass(date) {
    const base =
      "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs select-none transition-colors duration-100 cursor-pointer ";

    if (mode === "single") {
      if (sameDay(date, selectedSingle))
        return base + "bg-blue-500 text-white rounded-md font-medium dark:bg-blue-600";
      if (sameDay(date, today))
        return base + "bg-blue-100 text-blue-700 rounded-md font-medium dark:bg-blue-900/30 dark:text-blue-400";
      return base + "hover:bg-gray-100 rounded-md text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50";
    }

    // range mode
    const lo = rangeStart && rangeEnd
      ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd)
      : rangeStart;
    const hi = rangeStart && rangeEnd
      ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart)
      : (rangeStart && hoverDate ? (hoverDate >= rangeStart ? hoverDate : null) : null);

    if (lo && sameDay(date, lo) && hi && sameDay(date, hi))
      return base + "bg-blue-500 text-white rounded-md font-medium dark:bg-blue-600";
    if (lo && sameDay(date, lo))
      return base + "bg-blue-500 text-white font-medium dark:bg-blue-600 " + (hi ? "rounded-l-lg rounded-r-none" : "rounded-md");
    if (hi && sameDay(date, hi))
      return base + "bg-blue-500 text-white font-medium dark:bg-blue-600 rounded-r-lg rounded-l-none";
    if (lo && hi && date > lo && date < hi)
      return base + "bg-blue-100 text-blue-700 rounded-md-none dark:bg-blue-900/30 dark:text-blue-400";
    if (sameDay(date, today))
      return base + "bg-blue-100 text-blue-600 rounded-md font-medium dark:bg-blue-900/30 dark:text-blue-400";
    return base + "hover:bg-gray-100 rounded-md text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50";
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <div key={`p${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-300 dark:text-gray-600">
        {prevMonthDays - firstDay + i + 1}
      </div>
    );
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = startOfDay(new Date(y, m, d));
    cells.push(
      <div
        key={d}
        className={getDayClass(date)}
        onClick={() => {
          if (mode === "single") {
            onSelectSingle?.(date);
            onSinglePick?.(date);
          } else {
            onRangeClick?.(date);
          }
        }}
        onMouseEnter={() => mode === "range" && setHoverDate(date)}
        onMouseLeave={() => mode === "range" && setHoverDate(null)}
      >
        {d}
      </div>
    );
  }
  const remaining = 42 - firstDay - daysInMonth;
  for (let d = 1; d <= remaining && d <= 7; d++) {
    cells.push(
      <div key={`n${d}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-300 dark:text-gray-600">{d}</div>
    );
  }

  return (
    <div>
      {/* Month/Year Nav */}
      <div className="flex items-center justify-between mb-2.5 gap-1.5">
        <button
          onClick={() => onViewChange(new Date(y, m - 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
        >
          ‹
        </button>

        {/* Clickable header — opens year dropdown */}
        <div ref={headerRef} style={{ position: "relative", flex: 1, textAlign: "center" }}>
          <button
            onClick={() => setShowYearDropdown(v => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary, #111)",
              background: "none",
              border: "none",
              borderRadius: 6,
              padding: "2px 8px",
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-1, #f3f4f6)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
            title="Click to jump to a year"
          >
            {MONTHS_FULL[m]} {y}
            <FaChevronDown
              size={9}
              style={{
                transform: showYearDropdown ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                opacity: 0.6,
              }}
            />
          </button>

          {showYearDropdown && (
            <YearDropdown
              currentYear={y}
              minYear={minYear || 1900}
              maxYear={maxYear}
              onSelect={(selectedYear) => {
                onViewChange(new Date(selectedYear, m, 1));
              }}
              onClose={() => setShowYearDropdown(false)}
            />
          )}
        </div>

        <button
          onClick={() => onViewChange(new Date(y, m + 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="w-7 h-6 sm:w-8 sm:h-6 flex items-center justify-center text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-medium">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells}
      </div>
      {/* Quick links */}
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => { onSelectSingle?.(null); onSinglePick?.(null); }}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
        >
          Clear
        </button>
        <button
          onClick={() => {
            const t = startOfDay(new Date());
            onSelectSingle?.(t);
            onViewChange?.(t);
            onSinglePick?.(t);
          }}
          className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
        >
          Today
        </button>
      </div>
    </div>
  );
}

// ─── Month Picker Grid ───────────────────────────────────────────────────────

function MonthYearPicker({ month, year, onMonthChange, onYearChange, minYear = 1900 }) {
  const maxYear = new Date().getFullYear() + 10;
  // Build full range of years
  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <div className="space-y-4">
      {/* Year selector — native scrollable select for full range */}
      <div>
        <p className="text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-semibold dark:text-gray-500">Year</p>
        <SelectField
          options={years.map(y => ({ value: y, label: y.toString() }))}
          value={{ value: year, label: year.toString() }}
          onChange={opt => onYearChange(Number(opt.value))}
          menuPlacement="auto"
          maxMenuHeight={200}
        />
      </div>
      {/* Month selector */}
      <div>
        <p className="text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-semibold dark:text-gray-500">Month</p>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS_SHORT.map((name, idx) => {
            const val = idx + 1;
            return (
              <button
                key={name}
                onClick={() => onMonthChange(val)}
                className={`py-2 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${month === val
                  ? "bg-blue-500 text-white dark:bg-blue-600"
                  : "border border-gray-100 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdvancedDateFilter Component ──────────────────────────────────────

const DEFAULT_TAB_OPTIONS = ["date", "month", "range"];

export default function AdvancedDateFilter({
  value,
  onChange,
  placeholder = "Filter by date",
  buttonClassName = "",
  tabOptions = DEFAULT_TAB_OPTIONS,
  showDateStepper = false,
  minYear = 1900,
  maxYear,
}) {
  const allowedTabs = Array.isArray(tabOptions) && tabOptions.length > 0
    ? tabOptions
    : DEFAULT_TAB_OPTIONS;
  const hasMultipleTabs = allowedTabs.length > 1;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(allowedTabs[0]);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const today = startOfDay(new Date());

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedSingle, setSelectedSingle] = useState(null);

  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [rangeViewDate, setRangeViewDate] = useState(new Date());

  const prevIsOpen = useRef(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const valueChanged = prevValue.current !== value;
    const justOpened = !prevIsOpen.current && isOpen;

    if (justOpened || (isOpen && valueChanged)) {
      if (value && value.date) {
        const d = parseDateValue(value.date);
        if (allowedTabs.includes("date")) {
          setSelectedSingle(d);
          if (d) setViewDate(d);
          setActiveTab("date");
        } else if (allowedTabs[0]) {
          setActiveTab(allowedTabs[0]);
        }
      } else if (value && value.month && value.year) {
        if (allowedTabs.includes("month")) {
          setTempMonth(Number(value.month));
          setTempYear(Number(value.year));
          setActiveTab("month");
        } else if (allowedTabs[0]) {
          setActiveTab(allowedTabs[0]);
        }
      } else if (value && value.from_date && value.to_date) {
        if (allowedTabs.includes("range")) {
          setRangeStart(parseDateValue(value.from_date));
          setRangeEnd(parseDateValue(value.to_date));
          setActiveTab("range");
        } else if (allowedTabs[0]) {
          setActiveTab(allowedTabs[0]);
        }
      } else if (!allowedTabs.includes(activeTab) && allowedTabs[0]) {
        setActiveTab(allowedTabs[0]);
      }
    }

    prevIsOpen.current = isOpen;
    prevValue.current = value;
    // eslint-disable-next-line
  }, [isOpen, value, allowedTabs, activeTab]);

  useEffect(() => {
    if (!allowedTabs.includes(activeTab) && allowedTabs[0]) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e) => {
      if (popoverRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function handleRangeClick(date) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
    } else {
      if (date < rangeStart) { setRangeEnd(rangeStart); setRangeStart(date); }
      else setRangeEnd(date);
    }
  }

  function handleApply() {
    let result = {};
    if (activeTab === "date") {
      result = { date: toIsoDate(selectedSingle), month: "", year: "", from_date: "", to_date: "" };
    } else if (activeTab === "month") {
      result = { date: "", month: tempMonth, year: tempYear, from_date: "", to_date: "" };
    } else if (activeTab === "range") {
      result = {
        date: "", month: "", year: "",
        from_date: toIsoDate(rangeStart),
        to_date: toIsoDate(rangeEnd),
      };
    }
    onChange?.(result);
    setIsOpen(false);
  }

  function handleClear() {
    setSelectedSingle(null);
    setRangeStart(null);
    setRangeEnd(null);
    onChange?.({ date: "", month: "", year: "", from_date: "", to_date: "" });
    setIsOpen(false);
  }

  function applySingleDate(date) {
    const selectedDate = startOfDay(date || new Date());
    setSelectedSingle(selectedDate);
    setViewDate(selectedDate);
    onChange?.({ date: toIsoDate(selectedDate), month: "", year: "", from_date: "", to_date: "" });
  }

  function getStepperDate() {
    return parseDateValue(value?.date || value?.from_date || value?.to_date || toIsoDate(new Date())) || today;
  }

  function getDisplayLabel() {
    if (!value) return placeholder;
    if (value.date) return fmt(parseDateValue(value.date)) || placeholder;
    if (value.month && value.year) return `${MONTHS_FULL[value.month - 1]} ${value.year}`;
    if (value.from_date && value.to_date) {
      const s = parseDateValue(value.from_date);
      const e = parseDateValue(value.to_date);
      return s && e ? `${fmt(s)} – ${fmt(e)}` : placeholder;
    }
    return placeholder;
  }

  const hasFilter = value && (value.date || (value.month && value.year) || (value.from_date && value.to_date));

  function getTabLabel() {
    if (activeTab === "date") {
      return selectedSingle ? fmt(selectedSingle) : "Pick a date";
    }
    if (activeTab === "month") {
      return `${MONTHS_FULL[tempMonth - 1]} ${tempYear}`;
    }
    if (rangeStart && rangeEnd) return `${fmt(rangeStart)} → ${fmt(rangeEnd)}`;
    if (rangeStart) return `${fmt(rangeStart)} → …`;
    return "Pick start date";
  }

  const tabs = [
    { key: "date", label: "Single date" },
    { key: "month", label: "Month & year" },
    { key: "range", label: "Date range" },
  ].filter((tab) => allowedTabs.includes(tab.key));

  const shouldShowStepper = showDateStepper && allowedTabs.includes("date");
  const stepperDate = getStepperDate();
  const canStepForward = stepperDate < today;

  return (
    <div className="relative inline-block w-full">
      {/* Trigger */}
      <div className={shouldShowStepper ? "flex w-full rounded-md border border-slate-200 dark:border-gray-700 min-w-[260px] items-stretch" : ""}>
        {shouldShowStepper && (
          <button
            type="button"
            onClick={() => applySingleDate(shiftDate(getStepperDate(), -1))}
            className="flex w-9 flex-shrink-0 items-center justify-center rounded-l-xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40"
            title="Previous day"
          >
            <FaChevronLeft size={11} />
          </button>
        )}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`${buttonClassName} flex min-w-[180px] flex-1 items-center justify-between gap-2`.trim()}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span className={`min-w-0 flex-1 justify-center truncate text-left text-xs sm:text-sm flex items-center gap-1.5 ${hasFilter ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
            <FaCalendarAlt className={`flex-shrink-0 text-[11px] ${hasFilter ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
            {getDisplayLabel()}
          </span>
        </button>
        {shouldShowStepper && (
          <button
            type="button"
            onClick={() => {
              if (canStepForward) applySingleDate(shiftDate(stepperDate, 1));
            }}
            disabled={!canStepForward}
            className={`flex w-9 flex-shrink-0 items-center justify-center rounded-r-xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40 ${canStepForward
              ? "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/30 dark:bg-blue-900/30 dark:text-blue-400"
              : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-600"
              }`}
            title={canStepForward ? "Next day" : "Future dates are not available"}
          >
            <FaChevronRight size={11} />
          </button>
        )}
      </div>

      {/* Modal Portal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            style={{ animation: "fadeIn 0.2s ease-out" }}
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div
            ref={popoverRef}
            data-advanced-date-filter="true"
            className="relative z-[10002]"
            style={{
              width: window.innerWidth < 640 ? "90%" : "100%",
              maxWidth: "22rem",
              animation: "zoomIn 0.2s ease-out",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm hover:bg-white hover:text-red-500 transition-colors dark:bg-gray-800/90 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
              title="Close"
            >
              <FaTimes size={12} />
            </button>

            {/* Panel */}
            <div className="w-full rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden font-sans flex flex-col dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-950/50">

              {/* Header */}
              <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold dark:text-gray-500">Selected</p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 break-words dark:text-gray-200">{getTabLabel()}</p>
              </div>

              {/* Tabs */}
              {hasMultipleTabs && (
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                  {tabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`min-w-0 flex-1 py-2 text-[10px] sm:text-[11px] font-medium transition-colors border-b-2 ${activeTab === t.key
                        ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="px-3 sm:px-4 py-3.5 overflow-y-auto">

                {activeTab === "date" && (
                  <Calendar
                    mode="single"
                    viewDate={viewDate}
                    onViewChange={setViewDate}
                    selectedSingle={selectedSingle}
                    onSelectSingle={setSelectedSingle}
                    minYear={minYear}
                    maxYear={maxYear}
                    onSinglePick={(date) => {
                      if (date) {
                        setSelectedSingle(date);
                        onChange?.({ date: toIsoDate(date), month: "", year: "", from_date: "", to_date: "" });
                        setIsOpen(false);
                      }
                    }}
                  />
                )}

                {activeTab === "month" && (
                  <MonthYearPicker
                    month={tempMonth}
                    year={tempYear}
                    minYear={minYear}
                    onMonthChange={setTempMonth}
                    onYearChange={setTempYear}
                  />
                )}

                {activeTab === "range" && (
                  <div>
                    <p className="text-[10px] text-center text-gray-400 mb-2 h-4 px-1 dark:text-gray-500">
                      {!rangeStart ? "Click to set start date" :
                        !rangeEnd ? "Click to set end date" :
                          `${fmt(rangeStart)} → ${fmt(rangeEnd)}`}
                    </p>
                    <Calendar
                      mode="range"
                      viewDate={rangeViewDate}
                      onViewChange={setRangeViewDate}
                      rangeStart={rangeStart}
                      rangeEnd={rangeEnd}
                      onRangeClick={handleRangeClick}
                      minYear={minYear}
                      maxYear={maxYear}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 sm:px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end gap-1.5">
                <button
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  title="Clear filter"
                >
                  <FaUndo className="text-[11px]" />
                </button>
                <button
                  onClick={handleApply}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700"
                  title="Apply filter"
                >
                  <FaCheck className="text-[11px]" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}