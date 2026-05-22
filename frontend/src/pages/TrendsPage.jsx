import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getPitchTrends } from "../api/api";

const TREND_METRICS = [
  {
    key: "avg_start_speed",
    label: "Average Speed",
  },
  {
    key: "avg_spin_rate",
    label: "Average Spin Rate",
  },
  {
    key: "avg_horizontal_break",
    label: "Average Horizontal Break",
  },
  {
    key: "avg_induced_vertical_break",
    label: "Average Induced Vertical Break",
  },
  {
    key: "avg_Arm_Slot_Updated_X",
    label: "Average Arm Slot",
  },
  {
    key: "avg_Max_Elb_Var_Torque_X",
    label: "Average Max Elbow Torque",
  },
];

function TrendsPage() {
  const [groupBy, setGroupBy] = useState("month");
  const [pitchType, setPitchType] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("avg_start_speed");
  const [error, setError] = useState("");

  async function loadTrends() {
    setError("");

    try {
      const data = await getPitchTrends({
        group_by: groupBy,
        pitch_type: pitchType,
      });

      setTrendData(data.trends);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTrends();
  }, []);

  const selectedMetricLabel =
    TREND_METRICS.find((metric) => metric.key === selectedMetric)?.label ??
    selectedMetric;

  return (
    <section className="panel">
      <div className="table-header-row">
        <div>
          <h2>Pitch Outcome Trends</h2>
          <p className="subtle-text">
            Track speed, spin, movement, and biomechanical changes over time.
          </p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="filters-form">
        <div className="filters-grid">
          <label className="filter-control">
            <span>Group By</span>
            <select
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value)}
            >
              <option value="date">Date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </label>

          <label className="filter-control">
            <span>Pitch Type</span>
            <input
              value={pitchType}
              placeholder="Example: Sinker"
              onChange={(event) => setPitchType(event.target.value)}
            />
          </label>

          <label className="filter-control">
            <span>Metric</span>
            <select
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
            >
              {TREND_METRICS.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-actions">
          <button className="primary-button" type="button" onClick={loadTrends}>
            Update Trend
          </button>
        </div>
      </div>

      <div className="chart-card">
        <h3>{selectedMetricLabel}</h3>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              name={selectedMetricLabel}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-wrapper">
        <table className="pitch-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Pitch Count</th>
              <th>Avg Speed</th>
              <th>Avg Spin</th>
              <th>Avg H. Break</th>
              <th>Avg IVB</th>
              <th>Ball Rate</th>
              <th>Called Strike Rate</th>
              <th>Whiff Rate</th>
            </tr>
          </thead>

          <tbody>
            {trendData.map((row) => (
              <tr key={row.period}>
                <td>{row.period}</td>
                <td>{row.pitch_count}</td>
                <td>{row.avg_start_speed ?? "—"}</td>
                <td>{row.avg_spin_rate ?? "—"}</td>
                <td>{row.avg_horizontal_break ?? "—"}</td>
                <td>{row.avg_induced_vertical_break ?? "—"}</td>
                <td>{row.ball_rate ?? "—"}</td>
                <td>{row.called_strike_rate ?? "—"}</td>
                <td>{row.whiff_rate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TrendsPage;