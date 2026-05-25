import { useEffect, useState } from "react";
import { getYearComparison } from "../api/api";
import PitchTypeDropdown from "../components/PitchTypeDropdown";

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return typeof value === "number" ? value.toFixed(2) : value;
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value.toFixed(2)}%`;
}

function YearComparisonPage({ filterOptions }) {
  const [yearA, setYearA] = useState("2023");
  const [yearB, setYearB] = useState("2025");
  const [pitchType, setPitchType] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState("");

  async function loadComparison() {
    setError("");

    try {
      const data = await getYearComparison({
        year_a: yearA,
        year_b: yearB,
        pitch_type: pitchType,
      });

      setComparisonData(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadComparison();
  }, []);

  return (
    <section className="panel">
      <div className="table-header-row">
        <div>
          <h2>Biomechanical Year Comparison</h2>
          <p className="subtle-text">
            Compare pitch tracking and biomechanical averages across seasons.
          </p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="filters-form">
        <div className="filters-grid">
          <label className="filter-control">
            <span>Year A</span>
            <input
              value={yearA}
              onChange={(event) => setYearA(event.target.value)}
            />
          </label>

          <label className="filter-control">
            <span>Year B</span>
            <input
              value={yearB}
              onChange={(event) => setYearB(event.target.value)}
            />
          </label>

          <PitchTypeDropdown
            value={pitchType}
            onChange={setPitchType}
            pitchTypes={filterOptions?.pitch_types ?? []}
          />
        </div>

        <div className="filter-actions">
          <button className="primary-button" type="button" onClick={loadComparison}>
            Compare Years
          </button>
        </div>
      </div>

      {comparisonData && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">{comparisonData.year_a} Pitches</span>
              <strong>{comparisonData.sample_sizes[String(comparisonData.year_a)]}</strong>
            </div>

            <div className="summary-card">
              <span className="summary-label">{comparisonData.year_b} Pitches</span>
              <strong>{comparisonData.sample_sizes[String(comparisonData.year_b)]}</strong>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="pitch-table comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>{comparisonData.year_a}</th>
                  <th>{comparisonData.year_b}</th>
                  <th>Difference</th>
                  <th>% Change</th>
                </tr>
              </thead>

              <tbody>
                {comparisonData.comparison.map((row) => (
                  <tr key={row.metric}>
                    <td className="metric-cell" title={row.label}>
                        {row.label}
                    </td>
                    <td>{formatValue(row.year_a_value)}</td>
                    <td>{formatValue(row.year_b_value)}</td>
                    <td>{formatValue(row.difference)}</td>
                    <td>{formatPercent(row.percent_change)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default YearComparisonPage;