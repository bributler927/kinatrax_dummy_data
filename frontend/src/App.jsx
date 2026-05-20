import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [summary, setSummary] = useState(null);
  const [pitches, setPitches] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data));

    fetch("http://localhost:8000/api/pitches")
      .then((res) => res.json())
      .then((data) => setPitches(data));
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Pitch Analytics Dashboard</h1>

      {!summary ? (
        <p>Loading...</p>
      ) : (
        <section>
          <h2>Summary</h2>
          <p>Total pitches: {summary.total_pitches}</p>
          <p>Average velocity: {summary.average_end_speed} mph</p>
          <p>Average spin rate: {summary.average_spin_rate} rpm</p>

          <h3>Pitch Type Counts</h3>
          <ul>
            {Object.entries(summary.pitch_type_counts).map(([type, count]) => (
              <li key={type}>
                {type}: {count}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Raw Pitch Data</h2>

        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Pitcher</th>
              <th>Pitch Type</th>
              <th>Velocity</th>
              <th>Spin Rate</th>
            </tr>
          </thead>

          <tbody>
            {pitches.map((pitch, index) => (
              <tr key={index}>
                <td>{pitch.date}</td>
                <td>{pitch.pitch_type}</td>
                <td>{pitch.end_speed}</td>
                <td>{pitch.spin_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default App
