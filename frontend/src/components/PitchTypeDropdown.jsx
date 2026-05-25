function PitchTypeDropdown({
    value,
    onChange,
    pitchTypes = [],
    label = "Pitch Type",
  }) {
    return (
      <label className="filter-control">
        <span>{label}</span>
  
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All</option>
  
          {pitchTypes.map((pitchType) => (
            <option key={pitchType} value={pitchType}>
              {pitchType}
            </option>
          ))}
        </select>
      </label>
    );
  }
  
  export default PitchTypeDropdown;