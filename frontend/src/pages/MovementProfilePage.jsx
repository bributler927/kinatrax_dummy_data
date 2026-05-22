import { useEffect, useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

const API_BASE_URL = "http://localhost:8000";

const PITCH_TYPE_COLORS = {
  Sinker: "#38bdf8",
  Splitter: "#a78bfa",
  Slider: "#f97316",
  Fastball: "#ef4444",
  Cutter: "#22c55e",
  Changeup: "#facc15",
  Curveball: "#fb7185",
  Unknown: "#94a3b8",
};

const FALLBACK_COLORS = [
  "#38bdf8",
  "#a78bfa",
  "#f97316",
  "#22c55e",
  "#facc15",
  "#fb7185",
  "#2dd4bf",
];

const CHART_GRID_COLOR = "rgba(156, 163, 175, 0.28)";
const CHART_AXIS_COLOR = "#9ca3af";

function getPitchTypeColor(pitchType, index = 0) {
  return PITCH_TYPE_COLORS[pitchType] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function getAverage(rows, key) {
  const values = rows
    .map((row) => Number(row[key]))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function formatAverage(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toFixed(1);
}

function getNumericDomain(rows, key, padding = 2) {
  const values = rows
    .map((row) => Number(row[key]))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return ["auto", "auto"];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

function getPitchDateValue(pitch) {
  return pitch.Date ?? pitch.date ?? "";
}

function getPitchYear(pitch) {
  const dateValue = getPitchDateValue(pitch);
  return String(dateValue).slice(0, 4);
}

function getPitchMonth(pitch) {
  const dateValue = getPitchDateValue(pitch);
  return String(dateValue).slice(0, 7);
}

function getComparisonValue(pitch, compareBy) {
  if (compareBy === "month") {
    return getPitchMonth(pitch);
  }

  return getPitchYear(pitch);
}

function getValidMovementPoints(rows) {
  return rows
    .map((row) => ({
      ...row,
      horizontal_break: Number(row.horizontal_break),
      induced_vertical_break: Number(row.induced_vertical_break),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.horizontal_break) &&
        Number.isFinite(row.induced_vertical_break)
    );
}

function getMovementCenter(rows) {
  const points = getValidMovementPoints(rows);

  if (points.length === 0) {
    return null;
  }

  const totalHorizontalBreak = points.reduce(
    (sum, row) => sum + row.horizontal_break,
    0
  );

  const totalInducedVerticalBreak = points.reduce(
    (sum, row) => sum + row.induced_vertical_break,
    0
  );

  return {
    horizontal_break: totalHorizontalBreak / points.length,
    induced_vertical_break: totalInducedVerticalBreak / points.length,
    count: points.length,
  };
}

function getRegressionSegment(rows) {
  const points = getValidMovementPoints(rows);

  if (points.length < 3) {
    return null;
  }

  const xValues = points.map((point) => point.horizontal_break);
  const yValues = points.map((point) => point.induced_vertical_break);

  const xMean =
    xValues.reduce((sum, value) => sum + value, 0) / xValues.length;

  const yMean =
    yValues.reduce((sum, value) => sum + value, 0) / yValues.length;

  const numerator = points.reduce((sum, point) => {
    return (
      sum +
      (point.horizontal_break - xMean) *
        (point.induced_vertical_break - yMean)
    );
  }, 0);

  const denominator = points.reduce((sum, point) => {
    return sum + Math.pow(point.horizontal_break - xMean, 2);
  }, 0);

  if (denominator === 0) {
    return null;
  }

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  const x1 = Math.min(...xValues);
  const x2 = Math.max(...xValues);

  return [
    {
      x: x1,
      y: slope * x1 + intercept,
    },
    {
      x: x2,
      y: slope * x2 + intercept,
    },
  ];
}

function getComparisonOptions(rows, compareBy) {
  const values = rows
    .map((pitch) => getComparisonValue(pitch, compareBy))
    .filter((value) => value && value.length >= 4);

  return [...new Set(values)].sort();
}

function filterRowsForComparison(rows, compareBy, compareValue) {
  return rows.filter(
    (pitch) => getComparisonValue(pitch, compareBy) === compareValue
  );
}

function getComparisonLabel(compareBy, value) {
  if (!value) {
    return "No Selection";
  }

  if (compareBy === "month") {
    return value;
  }

  return `${value} Season`;
}

function getBaseFiltersForCompareMode(filters) {
  const {
    year,
    date,
    ...baseFilters
  } = filters;

  return baseFilters;
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

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} failed with status ${response.status}`);
  }

  return response.json();
}

function isValidMovementPoint(pitch) {
  return (
    Number.isFinite(Number(pitch.horizontal_break)) &&
    Number.isFinite(Number(pitch.induced_vertical_break))
  );
}

function groupByPitchType(pitches) {
  return pitches.reduce((groups, pitch) => {
    const pitchType = pitch.pitch_type || "Unknown";

    if (!groups[pitchType]) {
      groups[pitchType] = [];
    }

    groups[pitchType].push({
      ...pitch,
      horizontal_break: Number(pitch.horizontal_break),
      induced_vertical_break: Number(pitch.induced_vertical_break),
      start_speed:
        pitch.start_speed === null || pitch.start_speed === undefined
          ? null
          : Number(pitch.start_speed),
      spin_rate:
        pitch.spin_rate === null || pitch.spin_rate === undefined
          ? null
          : Number(pitch.spin_rate),
    });

    return groups;
  }, {});
}

function MovementTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const pitch = payload[0].payload;
  const color = getPitchTypeColor(pitch.pitch_type);

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">
        <span
          className="chart-tooltip-dot"
          style={{ background: color }}
        />
        <strong>{pitch.pitch_type ?? "Unknown Pitch"}</strong>
      </div>

      <p>Date: {pitch.Date ?? pitch.date ?? "—"}</p>
      <p>Outcome: {pitch.pitch_outcome_display ?? pitch.pitch_outcome ?? "—"}</p>
      <p>Speed: {pitch.start_speed ?? "—"} mph</p>
      <p>Spin: {pitch.spin_rate ?? "—"} rpm</p>
      <p>Horizontal Break: {pitch.horizontal_break ?? "—"}</p>
      <p>Induced Vertical Break: {pitch.induced_vertical_break ?? "—"}</p>
    </div>
  );
}

function SelectFilter({
  label,
  name,
  value,
  options,
  onChange,
  includeAll = true,
  allLabel = "All",
  disabled = false,
}) {
  return (
    <label className="filter-control">
      <span>{label}</span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
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

function MovementScatterPanel({
  title,
  data,
  hiddenPitchTypes,
  height = 390,
  showPitchCenters = true,
  showTrendLines = false,
}) {
  const groupedData = useMemo(() => {
    return groupByPitchType(data);
  }, [data]);

  const pitchTypeEntries = useMemo(() => {
    return Object.entries(groupedData).sort(([pitchTypeA], [pitchTypeB]) =>
      pitchTypeA.localeCompare(pitchTypeB)
    );
  }, [groupedData]);

  const visiblePitchTypeEntries = useMemo(() => {
    return pitchTypeEntries.filter(
      ([pitchType]) => !hiddenPitchTypes.has(pitchType)
    );
  }, [pitchTypeEntries, hiddenPitchTypes]);

  const visibleMovementData = useMemo(() => {
    return visiblePitchTypeEntries.flatMap(([, pitches]) => pitches);
  }, [visiblePitchTypeEntries]);

  const xDomain = useMemo(() => {
    return getNumericDomain(visibleMovementData, "horizontal_break", 2);
  }, [visibleMovementData]);

  const yDomain = useMemo(() => {
    return getNumericDomain(visibleMovementData, "induced_vertical_break", 2);
  }, [visibleMovementData]);

  return (
    <div className="chart-card movement-chart-card">
      <div className="movement-chart-header">
        <h3>{title}</h3>
        <span>{visibleMovementData.length} pitches</span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 35, left: 25 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" />

          <XAxis
            type="number"
            dataKey="horizontal_break"
            name="Horizontal Break"
            domain={xDomain}
            tick={{ fill: CHART_AXIS_COLOR }}
            axisLine={{ stroke: CHART_AXIS_COLOR }}
            tickLine={{ stroke: CHART_AXIS_COLOR }}
            label={{
              value: "Horizontal Break",
              position: "insideBottom",
              offset: -12,
              fill: CHART_AXIS_COLOR,
            }}
          />

          <YAxis
            type="number"
            dataKey="induced_vertical_break"
            name="Induced Vertical Break"
            domain={yDomain}
            tick={{ fill: CHART_AXIS_COLOR }}
            axisLine={{ stroke: CHART_AXIS_COLOR }}
            tickLine={{ stroke: CHART_AXIS_COLOR }}
            label={{
              value: "Induced Vertical Break",
              angle: -90,
              position: "insideLeft",
              fill: CHART_AXIS_COLOR,
            }}
          />

          <ReferenceLine
            x={0}
            stroke={CHART_GRID_COLOR}
            strokeDasharray="4 4"
          />

          <ReferenceLine
            y={0}
            stroke={CHART_GRID_COLOR}
            strokeDasharray="4 4"
          />

          <Tooltip
            content={<MovementTooltip />}
            cursor={{
              stroke: CHART_AXIS_COLOR,
              strokeDasharray: "3 3",
            }}
          />

          <Legend
            wrapperStyle={{
              color: CHART_AXIS_COLOR,
              paddingTop: "0.75rem",
            }}
          />

          {showTrendLines &&
            visiblePitchTypeEntries.map(([pitchType, rows], index) => {
              const color = getPitchTypeColor(pitchType, index);
              const segment = getRegressionSegment(rows);

              if (!segment) {
                return null;
              }

              return (
                <ReferenceLine
                  key={`${pitchType}-trend-line`}
                  segment={segment}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  ifOverflow="extendDomain"
                />
              );
            })}

          {visiblePitchTypeEntries.map(([pitchType, rows], index) => {
            const color = getPitchTypeColor(pitchType, index);

            return (
              <Scatter
                key={pitchType}
                name={pitchType}
                data={rows}
                fill={color}
                stroke={color}
                shape={(props) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4.5}
                    fill={color}
                    fillOpacity={0.72}
                    stroke={color}
                    strokeOpacity={0.95}
                    strokeWidth={1}
                  />
                )}
              />
            );
          })}

          {showPitchCenters &&
            visiblePitchTypeEntries.map(([pitchType, rows], index) => {
              const color = getPitchTypeColor(pitchType, index);
              const center = getMovementCenter(rows);

              if (!center) {
                return null;
              }

              return (
                <ReferenceDot
                  key={`${pitchType}-center`}
                  x={center.horizontal_break}
                  y={center.induced_vertical_break}
                  r={7}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              );
            })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function MovementProfilePage() {
  const [movementData, setMovementData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    pitch_types: [],
    batter_ids: [],
    years: [],
    pitch_results: [],
  });

  const [filters, setFilters] = useState({
    pitch_type: "",
    batter_id: "",
    year: "",
    pitch_result: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hiddenPitchTypes, setHiddenPitchTypes] = useState(new Set());

  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareBy, setCompareBy] = useState("year");
  const [compareValueA, setCompareValueA] = useState("");
  const [compareValueB, setCompareValueB] = useState("");

  const [showPitchCenters, setShowPitchCenters] = useState(true);
const [showTrendLines, setShowTrendLines] = useState(false);


  const validMovementData = useMemo(
    () => movementData.filter(isValidMovementPoint),
    [movementData]
  );

  const comparisonOptions = useMemo(() => {
    return getComparisonOptions(validMovementData, compareBy);
  }, [validMovementData, compareBy]);
  
  useEffect(() => {
    if (comparisonOptions.length === 0) {
      setCompareValueA("");
      setCompareValueB("");
      return;
    }
  
    setCompareValueA(comparisonOptions[0]);
    setCompareValueB(comparisonOptions[comparisonOptions.length - 1]);
  }, [compareBy, comparisonOptions.join("|")]);
  
  const comparisonDataA = useMemo(() => {
    return filterRowsForComparison(
      validMovementData,
      compareBy,
      compareValueA
    );
  }, [validMovementData, compareBy, compareValueA]);
  
  const comparisonDataB = useMemo(() => {
    return filterRowsForComparison(
      validMovementData,
      compareBy,
      compareValueB
    );
  }, [validMovementData, compareBy, compareValueB]);

  const groupedData = useMemo(
    () => groupByPitchType(validMovementData),
    [validMovementData]
  );

  const pitchTypeEntries = useMemo(() => {
    return Object.entries(groupedData).sort(([pitchTypeA], [pitchTypeB]) =>
      pitchTypeA.localeCompare(pitchTypeB)
    );
  }, [groupedData]);
  
  const visiblePitchTypeEntries = useMemo(() => {
    return pitchTypeEntries.filter(
      ([pitchType]) => !hiddenPitchTypes.has(pitchType)
    );
  }, [pitchTypeEntries, hiddenPitchTypes]);
  
  const visibleMovementData = useMemo(() => {
    return visiblePitchTypeEntries.flatMap(([, pitches]) => pitches);
  }, [visiblePitchTypeEntries]);
  
  const xDomain = useMemo(() => {
    return getNumericDomain(visibleMovementData, "horizontal_break", 2);
  }, [visibleMovementData]);
  
  const yDomain = useMemo(() => {
    return getNumericDomain(visibleMovementData, "induced_vertical_break", 2);
  }, [visibleMovementData]);
  
  const pitchTypeSummaries = useMemo(() => {
    return pitchTypeEntries.map(([pitchType, pitches], index) => {
      return {
        pitchType,
        count: pitches.length,
        color: getPitchTypeColor(pitchType, index),
        avgHorizontalBreak: getAverage(pitches, "horizontal_break"),
        avgInducedVerticalBreak: getAverage(pitches, "induced_vertical_break"),
        hidden: hiddenPitchTypes.has(pitchType),
      };
    });
  }, [pitchTypeEntries, hiddenPitchTypes]);

  async function loadMovementData(currentFilters = filters) {
    setLoading(true);
    setError("");
  
    try {
      const queryFilters = compareEnabled
        ? getBaseFiltersForCompareMode(currentFilters)
        : currentFilters;
  
      const queryString = buildQueryString(queryFilters);
  
      const url = queryString
        ? `${API_BASE_URL}/api/pitches?${queryString}`
        : `${API_BASE_URL}/api/pitches`;
  
      const data = await fetchJson(url);
      setMovementData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovementData(filters);
  }, [compareEnabled, compareBy]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const options = await fetchJson(`${API_BASE_URL}/api/filter-options`);
        setFilterOptions(options);

        await loadMovementData();
      } catch (err) {
        setError(err.message);
      }
    }

    loadInitialData();
  }, []);

  function togglePitchType(pitchType) {
    setHiddenPitchTypes((previousHiddenTypes) => {
      const nextHiddenTypes = new Set(previousHiddenTypes);
  
      if (nextHiddenTypes.has(pitchType)) {
        nextHiddenTypes.delete(pitchType);
      } else {
        nextHiddenTypes.add(pitchType);
      }
  
      return nextHiddenTypes;
    });
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    loadMovementData(filters);
  }

  return (
    <section className="panel">
      <div className="table-header-row">
        <div>
          <h2>Movement Profile</h2>
          <p className="subtle-text">
            Horizontal break vs induced vertical break by pitch type.
          </p>
        </div>

        <p className="table-count">
          {loading
            ? "Loading..."
            : `${validMovementData.length} charted pitches`}
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form className="filters-form" onSubmit={handleApplyFilters}>
        <div className="filters-grid">
          <SelectFilter
            label="Pitch Type"
            name="pitch_type"
            value={filters.pitch_type}
            options={filterOptions.pitch_types ?? []}
            onChange={handleFilterChange}
          />

          <SelectFilter
            label="Batter"
            name="batter_id"
            value={filters.batter_id}
            options={filterOptions.batter_ids ?? []}
            onChange={handleFilterChange}
          />

          <SelectFilter
            label="Year"
            name="year"
            value={filters.year}
            options={filterOptions.years ?? []}
            onChange={handleFilterChange}
          />

          <SelectFilter
            label="Outcome"
            name="pitch_result"
            value={filters.pitch_result}
            options={filterOptions.pitch_results ?? []}
            onChange={handleFilterChange}
          />
        </div>

        <div className="movement-compare-controls">
          <label className="compare-toggle">
            <input
              type="checkbox"
              checked={compareEnabled}
              onChange={(event) => setCompareEnabled(event.target.checked)}
            />

            <span>Compare View</span>
            </label>

            {compareEnabled && (
              <div className="compare-options-grid">
                <label className="filter-control">
                  <span>Compare By</span>

                  <select
                    value={compareBy}
                    onChange={(event) => setCompareBy(event.target.value)}
                  >
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                  </select>
                </label>

                <label className="filter-control">
                  <span>First Chart</span>

                  <select
                    value={compareValueA}
                    onChange={(event) => setCompareValueA(event.target.value)}
                  >
                    {comparisonOptions.map((value) => (
                      <option key={value} value={value}>
                        {getComparisonLabel(compareBy, value)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-control">
                  <span>Second Chart</span>

                  <select
                    value={compareValueB}
                    onChange={(event) => setCompareValueB(event.target.value)}
                  >
                    {comparisonOptions.map((value) => (
                      <option key={value} value={value}>
                        {getComparisonLabel(compareBy, value)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {compareEnabled && (
              <p className="compare-helper-text">
                Compare View ignores the regular Year filter and uses the selected comparison periods instead.
              </p>
            )}
          </div>

          <div className="movement-chart-options">
            <label className="compare-toggle">
              <input
                type="checkbox"
                checked={showPitchCenters}
                onChange={(event) => setShowPitchCenters(event.target.checked)}
              />

              <span>Show pitch centers</span>
            </label>

            <label className="compare-toggle">
              <input
                type="checkbox"
                checked={showTrendLines}
                onChange={(event) => setShowTrendLines(event.target.checked)}
              />

              <span>Show pitch-type trend lines</span>
            </label>
          </div>

        <div className="filter-actions">
          <button className="primary-button" type="submit">
            Update Movement Profile
          </button>
        </div>
      </form>

      <div className="movement-summary-row">
        {pitchTypeSummaries.map((summary) => (
          <button
            type="button"
            key={summary.pitchType}
            className={
              summary.hidden
                ? "pitch-type-summary-card is-muted"
                : "pitch-type-summary-card"
            }
            style={{ "--pitch-color": summary.color }}
            onClick={() => togglePitchType(summary.pitchType)}
          >
            <div className="pitch-type-card-header">
              <span className="pitch-type-dot" />
              <span>{summary.pitchType}</span>
            </div>

            <strong>{summary.count}</strong>

            <small>
              Avg HB {formatAverage(summary.avgHorizontalBreak)} · Avg IVB{" "}
              {formatAverage(summary.avgInducedVerticalBreak)}
            </small>
          </button>
        ))}
      </div>

      {compareEnabled ? (
        <div className="movement-compare-grid">
          <MovementScatterPanel
            title={getComparisonLabel(compareBy, compareValueA)}
            data={comparisonDataA}
            hiddenPitchTypes={hiddenPitchTypes}
            height={360}
            showPitchCenters={showPitchCenters}
            showTrendLines={showTrendLines}
          />

          <MovementScatterPanel
            title={getComparisonLabel(compareBy, compareValueB)}
            data={comparisonDataB}
            hiddenPitchTypes={hiddenPitchTypes}
            height={360}
            showPitchCenters={showPitchCenters}
            showTrendLines={showTrendLines}
          />
          <p className="chart-note">
            Tip: Click a pitch-type card above to hide or show that pitch type.
          </p>
        </div>
      ) : (
        <div>
          <MovementScatterPanel
            title="Movement Profile"
            data={validMovementData}
            hiddenPitchTypes={hiddenPitchTypes}
            height={430}
            showPitchCenters={showPitchCenters}
            showTrendLines={showTrendLines}
          />
          <p className="chart-note">
            Tip: Click a pitch-type card above to hide or show that pitch type.
          </p>
      </div>
      )}
    </section>
  );
}

export default MovementProfilePage;