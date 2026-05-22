import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

import YearComparisonPage from "./pages/YearComparisonPage";
import TrendsPage from "./pages/TrendsPage";
import MovementProfilePage from "./pages/MovementProfilePage";

import "./App.css";

const API_BASE_URL = "http://localhost:8000";
const STEP = 0.1;
const ROWS_PER_PAGE = 25;

const TABLE_COLUMNS = [
  {
    key: "Date",
    label: "Date",
    sortable: false,
  },
  {
    key: "batter_id",
    label: "Batter",
    sortable: false,
  },
  {
    key: "inning",
    label: "Inning",
    sortable: true,
  },
  {
    key: "pitch_type",
    label: "Pitch Type",
    sortable: false,
  },
  {
    key: "pitch_outcome_display",
    label: "Outcome",
    sortable: false,
  },
  {
    key: "count",
    label: "Count",
    sortable: false,
  },
  {
    key: "outs",
    label: "Outs",
    sortable: true,
  },
  {
    key: "start_speed",
    label: "Start Speed",
    sortable: true,
  },
  {
    key: "spin_rate",
    label: "Spin Rate",
    sortable: true,
  },
];

function formatTableValue(pitch, key) {
  if (key === "count") {
    return `${pitch.balls ?? "—"}-${pitch.strikes ?? "—"}`;
  }

  const value = pitch[key];

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (key === "start_speed") {
    return `${Number(value).toFixed(1)} mph`;
  }

  if (key === "spin_rate") {
    return `${Math.round(Number(value))} rpm`;
  }

  return value;
}

const DEFAULT_FILTERS = {
  pitch_type: "",
  batter_id: "",
  pitch_result: "",
  date: "",
  year: "",
  inning: "",
  batter_side: "",
  pitcher_side: "",
  balls: "",
  strikes: "",
  outs: "",
  min_speed: "",
  max_speed: "",
  sort_by: "Date",
  sort_order: "desc",
};

const DEFAULT_FILTER_OPTIONS = {
  pitch_types: [],
  batter_ids: [],
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
  { value: "start_speed", label: "Speed" },
  { value: "spin_rate", label: "Spin Rate" },
  { value: "pitch_type", label: "Pitch Type" },
  { value: "pitch_outcome_display", label: "Pitch Outcome" },
  { value: "inning", label: "Inning" },
  { value: "balls", label: "Balls" },
  { value: "strikes", label: "Strikes" },
  { value: "outs", label: "Outs" },
];

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} failed with status ${response.status}`);
  }

  return response.json();
}

function getNumericFilterValue(value, fallback) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

function SpeedDoubleSlider({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}) {
  const range = max - min;
  const minPercent = range === 0 ? 0 : ((minValue - min) / range) * 100;
  const maxPercent = range === 0 ? 100 : ((maxValue - min) / range) * 100;

  return (
    <div className="speed-filter-card inline-speed-filter">
      <div className="speed-filter-header">
        <div>
          <h3>Speed Range</h3>
          <p>Filter pitches by start speed.</p>
        </div>

        <strong>
          {minValue.toFixed(1)}-{maxValue.toFixed(1)} mph
        </strong>
      </div>

      <div className="double-slider">
        <div className="double-slider-track" />

        <div
          className="double-slider-range"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        <input
          className="double-slider-input min-slider"
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
        />

        <input
          className="double-slider-input max-slider"
          type="range"
          min={min}
          max={max}
          step={STEP}
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
        />
      </div>

      <div className="double-slider-labels">
        <span>{min.toFixed(1)} mph</span>
        <span>{max.toFixed(1)} mph</span>
      </div>
    </div>
  );
}

function formatDetailLabel(key) {
  return key
    .replaceAll("_", " ")
    .replaceAll("MER", "MER")
    .replaceAll("BR", "BR")
    .replaceAll("FC", "FC")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDetailValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }

  return String(value);
}

function DetailSection({ title, data }) {
  const entries = Object.entries(data || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  return (
    <section className="detail-section">
      <h2>{title}</h2>

      {entries.length === 0 ? (
        <p className="subtle-text">No data available.</p>
      ) : (
        <div className="detail-grid">
          {entries.map(([key, value]) => (
            <div className="detail-card" key={key}>
              <span>{formatDetailLabel(key)}</span>
              <strong>{formatDetailValue(value)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PitchDetailPage() {
  const { pitchUid } = useParams();
  const [pitchDetail, setPitchDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    async function loadPitchDetail() {
      setLoadingDetail(true);
      setDetailError("");

      try {
        const data = await fetchJson(`${API_BASE_URL}/api/pitches/${pitchUid}`);
        setPitchDetail(data);
      } catch (err) {
        setDetailError(err.message);
      } finally {
        setLoadingDetail(false);
      }
    }

    loadPitchDetail();
  }, [pitchUid]);

  if (loadingDetail) {
    return (
      <main className="dashboard">
        <Link className="back-link" to="/">
          ← Back to dashboard
        </Link>

        <p>Loading pitch details...</p>
      </main>
    );
  }

  if (detailError) {
    return (
      <main className="dashboard">
        <Link className="back-link" to="/">
          ← Back to dashboard
        </Link>

        <p className="error-message">{detailError}</p>
      </main>
    );
  }

  if (!pitchDetail) {
    return (
      <main className="dashboard">
        <Link className="back-link" to="/">
          ← Back to dashboard
        </Link>

        <p>No pitch detail found.</p>
      </main>
    );
  }

  const pitch = pitchDetail.pitch || {};

  return (
    <main className="dashboard">
      <Link className="back-link" to="/">
        ← Back to dashboard
      </Link>

      <section className="pitch-detail-hero">
        <div>
          <p className="subtle-text">Pitch Detail</p>
          <h1>{pitch.pitch_type ?? "Pitch"} — {pitchDetail.pitch_uid}</h1>
          <p>
            {pitch.Date ?? "Unknown date"} · Batter {pitch.batter_id ?? "—"}
          </p>
        </div>

        <div className="pitch-detail-result">
          <span>{pitch.pitch_outcome_display ?? "—"}</span>
          <strong>{pitch.start_speed ?? "—"} mph</strong>
        </div>
      </section>

      <DetailSection title="Pitch Information" data={pitchDetail.pitch} />

      <DetailSection title="Movement / Pitch Tracking" data={pitchDetail.movement} />

      <DetailSection title="Batted Ball / Result" data={pitchDetail.batted_ball} />

      <DetailSection title="Biomechanical Metrics" data={pitchDetail.biomechanics} />
    </main>
  );
}

function DashboardPage() {
  const [activeTab, setActiveTab] = useState("summary");
  const [summary, setSummary] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [error, setError] = useState("");
  const [visibleRowCount, setVisibleRowCount] = useState(ROWS_PER_PAGE);

  const navigate = useNavigate();

  const [sortConfig, setSortConfig] = useState({
    sort_by: DEFAULT_FILTERS.sort_by,
    sort_order: DEFAULT_FILTERS.sort_order,
  });

  const speedMin = Math.floor(filterOptions.speed_range?.min ?? 70);
  const speedMax = Math.ceil(filterOptions.speed_range?.max ?? 100);

  const currentMinSpeed = getNumericFilterValue(filters.min_speed, speedMin);
  const currentMaxSpeed = getNumericFilterValue(filters.max_speed, speedMax);

  const visiblePitches = pitches.slice(0, visibleRowCount);
  const hasMoreRows = visibleRowCount < pitches.length;
  const rowsRemaining = pitches.length - visibleRowCount;

  async function fetchPitches(currentFilters = filters) {
    setLoadingPitches(true);
    setError("");

    try {
      const queryString = buildQueryString(currentFilters);
      const url = queryString
        ? `${API_BASE_URL}/api/pitches?${queryString}`
        : `${API_BASE_URL}/api/pitches`;

      const data = await fetchJson(url);
      setPitches(data);
      setVisibleRowCount(ROWS_PER_PAGE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPitches(false);
    }
  }

  function getSortIndicator(columnKey) {
    if (sortConfig.sort_by !== columnKey) {
      return "↕";
    }
  
    return sortConfig.sort_order === "asc" ? "↑" : "↓";
  }
  
  function handleColumnSort(columnKey) {
    const nextSortOrder =
      sortConfig.sort_by === columnKey && sortConfig.sort_order === "asc"
        ? "desc"
        : "asc";
  
    const nextSortConfig = {
      sort_by: columnKey,
      sort_order: nextSortOrder,
    };
  
    const nextFilters = {
      ...filters,
      ...nextSortConfig,
    };
  
    setSortConfig(nextSortConfig);
    setFilters(nextFilters);
    fetchPitches(nextFilters);
  }

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const summaryData = await fetchJson(`${API_BASE_URL}/api/summary`);
        setSummary(summaryData);

        const filterOptionsData = await fetchJson(
          `${API_BASE_URL}/api/filter-options`
        );

        const mergedFilterOptions = {
          ...DEFAULT_FILTER_OPTIONS,
          ...filterOptionsData,
        };

        setFilterOptions(mergedFilterOptions);

        const startingFilters = {
          ...DEFAULT_FILTERS,
          min_speed: String(mergedFilterOptions.speed_range?.min ?? 70),
          max_speed: String(mergedFilterOptions.speed_range?.max ?? 100),
        };

        setFilters(startingFilters);
        fetchPitches(startingFilters);
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboardData();
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }));
  }

  function handleMinSpeedChange(rawValue) {
    const nextValue = Number(rawValue);

    setFilters((previousFilters) => {
      const previousMax = getNumericFilterValue(
        previousFilters.max_speed,
        speedMax
      );

      const cappedMin = Math.min(
        Math.max(nextValue, speedMin),
        previousMax - STEP
      );

      return {
        ...previousFilters,
        min_speed: String(Number(cappedMin.toFixed(1))),
      };
    });
  }

  function handleMaxSpeedChange(rawValue) {
    const nextValue = Number(rawValue);

    setFilters((previousFilters) => {
      const previousMin = getNumericFilterValue(
        previousFilters.min_speed,
        speedMin
      );

      const cappedMax = Math.max(
        Math.min(nextValue, speedMax),
        previousMin + STEP
      );

      return {
        ...previousFilters,
        max_speed: String(Number(cappedMax.toFixed(1))),
      };
    });
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    fetchPitches(filters);
    setActiveTab("table");
  }

  function handleResetFilters() {
    const resetFilters = {
      ...DEFAULT_FILTERS,
      min_speed: String(speedMin),
      max_speed: String(speedMax),
    };
  
    setSortConfig({
      sort_by: DEFAULT_FILTERS.sort_by,
      sort_order: DEFAULT_FILTERS.sort_order,
    });
  
    setFilters(resetFilters);
    fetchPitches(resetFilters);
  }

  const averageSpeed =
    summary?.average_speed ?? summary?.average_start_speed ?? summary?.average_end_speed;

  const currentPitcherId =
    summary?.current_pitcher_id ??
    pitches.find((pitch) => pitch.pitcher_id)?.pitcher_id ??
    "Unknown";

  return (
    <main className="dashboard">
      <header className="dashboard-topbar">
        <div>
          <p className="dashboard-eyebrow">Pitcher + Trainer View</p>
          <h1>Pitch Analytics Dashboard</h1>
        </div>

        <div className="current-pitcher-badge">
          <span>Current Pitcher</span>
          <strong>{currentPitcherId}</strong>
        </div>
      </header>

      {error && <p className="error-message">{error}</p>}

      <div className="tabs">
        <button
          type="button"
          className={activeTab === "summary" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>

        <button
          type="button"
          className={activeTab === "table" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("table")}
        >
          Pitch Table
        </button>

        <button
          type="button"
          className={activeTab === "compare" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("compare")}
        >
          Year Compare
        </button>

        <button
          type="button"
          className={activeTab === "trends" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("trends")}
        >
          Trends
        </button>
        <button
          type="button"
          className={activeTab === "movement" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("movement")}
        >
          Movement Profile
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
                  <span className="summary-label">Average Speed</span>
                  <strong>{averageSpeed} mph</strong>
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
                Filter pitch-level data using the controls below.
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
                label="Pitch Outcome"
                name="pitch_result"
                value={filters.pitch_result}
                options={filterOptions.pitch_results}
                onChange={handleFilterChange}
              />

              <SelectFilter
                label="Batter"
                name="batter_id"
                value={filters.batter_id}
                options={filterOptions.batter_ids}
                onChange={handleFilterChange}
              />

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

              <SpeedDoubleSlider
                min={speedMin}
                max={speedMax}
                minValue={currentMinSpeed}
                maxValue={currentMaxSpeed}
                onMinChange={handleMinSpeedChange}
                onMaxChange={handleMaxSpeedChange}
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
                  <th key={column.key}>
                    {column.sortable ? (
                      <button
                        type="button"
                        className="sortable-header"
                        onClick={() => handleColumnSort(column.key)}
                      >
                        <span>{column.label}</span>
                        <span className="sort-indicator">
                          {getSortIndicator(column.key)}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
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
                visiblePitches.map((pitch, index) => (
                  <tr
                    key={pitch.PitchUID ?? index}
                    className="clickable-row"
                    tabIndex={0}
                    onClick={() => navigate(`/pitches/${pitch.PitchUID}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        navigate(`/pitches/${pitch.PitchUID}`);
                      }
                    }}
                  >
                    {TABLE_COLUMNS.map((column) => (
                      <td key={column.key}>
                        {formatTableValue(pitch, column.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <p>
              Showing {Math.min(visibleRowCount, pitches.length)} of {pitches.length} pitches
            </p>

            <div className="pagination-buttons">
              {hasMoreRows && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setVisibleRowCount((currentCount) =>
                      Math.min(currentCount + ROWS_PER_PAGE, pitches.length)
                    )
                  }
                >
                  Show {Math.min(ROWS_PER_PAGE, rowsRemaining)} more
                </button>
              )}

              {visibleRowCount > ROWS_PER_PAGE && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setVisibleRowCount(ROWS_PER_PAGE)}
                >
                  Show fewer
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "compare" && <YearComparisonPage />}

      {activeTab === "trends" && <TrendsPage />}

      {activeTab === "movement" && <MovementProfilePage />}
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/pitches/:pitchUid" element={<PitchDetailPage />} />
    </Routes>
  );
}

export default App;