import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:8000";

const DEFAULT_FILTERS = {
  pitch_type: "",
  pitch_result: "",
  min_speed: "",
  max_speed: "",
  date: "",
  year: "",
  inning: "",
  batter_side: "",
  pitcher_side: "",
  balls: "",
  strikes: "",
  outs: "",
  sort_by: "Date",
  sort_order: "desc",
};

const DEFAULT_FILTER_OPTIONS = {
  pitch_types: [],
  pitch_results: [],
  dates: [],
  years: [],
  innings: [],
  batter_sides: [],
  pitcher_sides: [],
  balls: [0, 1, 2, 3],
  strikes: [0, 1, 2],
  outs: [0, 1, 2],
  speed_range: {
    min: 70,
    max: 100,
  },
};

const SORT_OPTIONS = [
  { value: "Date", label: "Date" },
  { value: "end_speed", label: "Velocity" },
  { value: "spin_rate", label: "Spin Rate" },
  { value: "pitch_type", label: "Pitch Type" },
  { value: "pitch_call", label: "Pitch Result" },
  { value: "horizontal_break", label: "Horizontal Break" },
  { value: "induced_vertical_break", label: "Induced Vertical Break" },
  { value: "Arm_Slot_Updated_X", label: "Arm Slot" },
  { value: "Max_Elb_Var_Torque_X", label: "Max Elbow Torque" },
];

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const TABLE_COLUMNS = [
  { key: "Date", label: "Date" },
  { key: "pitcher_id", label: "Pitcher" },
  { key: "batter_id", label: "Batter" },
  { key: "inning", label: "Inning" },
  { key: "pitch_number", label: "Pitch #" },
  { key: "count", label: "Count" },
  { key: "outs", label: "Outs" },
  { key: "pitch_type", label: "Type" },
  { key: "pitch_call", label: "Result" },
  {
    key: "end_speed",
    label: "Velocity",
    format: (value) => formatWithUnit(value, "mph", 1),
  },
  {
    key: "spin_rate",
    label: "Spin",
    format: (value) => formatWithUnit(value, "rpm", 0),
  },
  {
    key: "horizontal_break",
    label: "H. Break",
    format: (value) => formatNumber(value, 1),
  },
  {
    key: "induced_vertical_break",
    label: "IVB",
    format: (value) => formatNumber(value, 1),
  },
  { key: "plate_location", label: "Plate X/Z" },
  {
    key: "Arm_Slot_Updated_X",
    label: "Arm Slot",
    format: (value) => formatNumber(value, 1),
  },
  {
    key: "Max_Elb_Var_Torque_X",
    label: "Max Elbow Torque",
    format: (value) => formatNumber(value, 1),
  },
];

function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(decimals);
}

function formatWithUnit(value, unit, decimals = 1) {
  const formatted = formatNumber(value, decimals);
  return formatted === "—" ? "—" : `${formatted} ${unit}`;
}

function getTableCellValue(pitch, column) {
  if (column.key === "count") {
    const balls = pitch.balls ?? "—";
    const strikes = pitch.strikes ?? "—";
    return `${balls}-${strikes}`;
  }

  if (column.key === "plate_location") {
    return `${formatNumber(pitch.plate_x, 2)}, ${formatNumber(
      pitch.plate_z,
      2
    )}`;
  }

  if (column.format) {
    return column.format(pitch[column.key], pitch);
  }

  return pitch[column.key] ?? "—";
}

function buildQueryString(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  return params.toString();
}

function SelectFilter({
  label,
  name,
  value,
  options,
  onChange,
  includeAll = true,
  allLabel = "All",
}) {
  return (
    <label className="filter-control">
      <span>{label}</span>

      <select name={name} value={value} onChange={onChange}>
        {includeAll && <option value="">{allLabel}</option>}

        {options.map((option) => {
          const optionValue =
            typeof option === "object" ? option.value : option;
          const optionLabel =
            typeof option === "object" ? option.label : option;

          return (
            <option key={String(optionValue)} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("summary");
  const [summary, setSummary] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [error, setError] = useState("");

  async function fetchSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary`);

      if (!response.ok) {
        throw new Error(`Summary request failed: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchFilterOptions() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/filter-options`);

      if (!response.ok) {
        throw new Error(`Filter options request failed: ${response.status}`);
      }

      const data = await response.json();

      setFilterOptions({
        ...DEFAULT_FILTER_OPTIONS,
        ...data,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchPitches(currentFilters = filters) {
    setLoadingPitches(true);
    setError("");

    try {
      const queryString = buildQueryString(currentFilters);
      const url = queryString
        ? `${API_BASE_URL}/api/pitches?${queryString}`
        : `${API_BASE_URL}/api/pitches`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Pitch table request failed: ${response.status}`);
      }

      const data = await response.json();
      setPitches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPitches(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    fetchFilterOptions();
    fetchPitches(DEFAULT_FILTERS);
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    fetchPitches(filters);
    setActiveTab("table");
  }

  function handleResetFilters() {
    const resetFilters = { ...DEFAULT_FILTERS };
    setFilters(resetFilters);
    fetchPitches(resetFilters);
  }

  return (
    <main className="dashboard">
      <h1>Pitch Analytics Dashboard</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="tabs">
        <button
          className={activeTab === "summary" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>

        <button
          className={activeTab === "table" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("table")}
        >
          Pitch Table
        </button>
      </div>

      {activeTab === "summary" && (
        <section className="panel">
          {!summary ? (
            <p>Loading summary...</p>
          ) : (
            <>
              <h2>Summary</h2>

              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Total Pitches</span>
                  <strong>{summary.total_pitches}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Average Velocity</span>
                  <strong>{summary.average_end_speed} mph</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Average Spin Rate</span>
                  <strong>{summary.average_spin_rate} rpm</strong>
                </div>
              </div>

              <div className="pitch-counts">
                <h3>Pitch Type Counts</h3>

                <ul>
                  {Object.entries(summary.pitch_type_counts).map(
                    ([type, count]) => (
                      <li key={type}>
                        <span>{type}</span>
                        <strong>{count}</strong>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === "table" && (
        <section className="panel">
          <div className="table-header-row">
            <div>
              <h2>Pitch Table</h2>
              <p className="subtle-text">
                Filtered view of the most important pitch-level metrics.
              </p>
            </div>

            <p className="table-count">
              {loadingPitches ? "Loading..." : `${pitches.length} pitches`}
            </p>
          </div>

          <form className="filters-form" onSubmit={handleApplyFilters}>
            <div className="filters-grid">
              <SelectFilter
                label="Pitch Type"
                name="pitch_type"
                value={filters.pitch_type}
                options={filterOptions.pitch_types}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Pitch Result"
                name="pitch_result"
                value={filters.pitch_result}
                options={filterOptions.pitch_results}
                onChange={handleFilterChange}
              />

              <label className="filter-control">
                <span>Min Velocity</span>
                <input
                  type="number"
                  step="0.1"
                  name="min_speed"
                  value={filters.min_speed}
                  onChange={handleFilterChange}
                  placeholder="Example: 85"
                />
              </label>

              <label className="filter-control">
                <span>Max Velocity</span>
                <input
                  type="number"
                  step="0.1"
                  name="max_speed"
                  value={filters.max_speed}
                  onChange={handleFilterChange}
                  placeholder="Example: 95"
                />
              </label>

              <SelectFilter
                label="Date"
                name="date"
                value={filters.date}
                options={filterOptions.dates}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Year"
                name="year"
                value={filters.year}
                options={filterOptions.years}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Inning"
                name="inning"
                value={filters.inning}
                options={filterOptions.innings}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Batter Side"
                name="batter_side"
                value={filters.batter_side}
                options={filterOptions.batter_sides}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Pitcher Side"
                name="pitcher_side"
                value={filters.pitcher_side}
                options={filterOptions.pitcher_sides}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Balls"
                name="balls"
                value={filters.balls}
                options={filterOptions.balls}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Strikes"
                name="strikes"
                value={filters.strikes}
                options={filterOptions.strikes}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Outs"
                name="outs"
                value={filters.outs}
                options={filterOptions.outs}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Sort By"
                name="sort_by"
                value={filters.sort_by}
                options={SORT_OPTIONS}
                onChange={handleFilterChange}
                includeAll={false}
              />

              <SelectFilter
                label="Sort Order"
                name="sort_order"
                value={filters.sort_order}
                options={SORT_ORDER_OPTIONS}
                onChange={handleFilterChange}
                includeAll={false}
              />
            </div>

            <div className="filter-actions">
              <button className="primary-button" type="submit">
                Apply Filters
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            </div>
          </form>

          <div className="table-wrapper">
            <table className="pitch-table">
              <thead>
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loadingPitches ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length} className="empty-message">
                      Loading pitches...
                    </td>
                  </tr>
                ) : pitches.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length} className="empty-message">
                      No pitches match the selected filters.
                    </td>
                  </tr>
                ) : (
                  pitches.map((pitch, index) => (
                    <tr key={pitch.PitchUID ?? index}>
                      {TABLE_COLUMNS.map((column) => (
                        <td key={column.key}>
                          {getTableCellValue(pitch, column)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;