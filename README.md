# Kinatrax Pitch Analytics Dashboard

An exploratory React/Vite + Python/FastAPI dashboard for reviewing pitch tracking and biomechanical data from one professional pitcher across the 2023 and 2025 seasons.

The goal of this project was to create an interactive dashboard that helps a pitcher and trainer explore pitch outcomes, movement profiles, biomechanical changes, and individual pitch details in a way that is easier to understand than raw JSON data.

## Project Description

This dashboard uses two JSON data sources:

- `pitch_biomech_data.json`
  - Pitch-level data.
  - Includes game context, pitch type, pitch outcome, speed, spin rate, movement, release point, count, batter information, and discrete biomechanical metrics.

- `time_series_metrics.json`
  - Frame-level biomechanical time-series data.
  - Connected to the pitch-level data by `PitchUID`.

The app joins these data sources by `PitchUID` and allows the user to explore the data through summary cards, filters, sortable tables, comparison views, and visualizations.

The intended user is a pitcher and/or trainer reviewing how the pitcher’s arsenal and biomechanics changed between 2023 and 2025.

## Main Questions Explored

- What type of pitcher is this?
- How did the pitcher’s pitch mix and movement profile change from 2023 to 2025?
- Are the pitch types separating clearly in movement space?
- How are speed, spin rate, horizontal break, vertical break, and biomechanical metrics trending over time?
- What can be seen when drilling into one individual pitch?
- Are there mechanical patterns that might help explain pitch performance changes?

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Recharts
- CSS

### Backend

- Python
- FastAPI
- pandas
- NumPy
- Uvicorn

## Features

### Summary View

- Shows a quick overview of the pitcher’s data.
- Includes:
  - Total pitch count
  - Average speed
  - Average spin rate
  - Pitch type breakdown
  - Current pitcher label

### Pitch Table

- Interactive table for exploring pitch-level data.
- Supports filtering by:
  - Pitch type
  - Batter
  - Pitch outcome
  - Date/year
  - Inning
  - Balls
  - Strikes
  - Outs
  - Batter side
  - Pitcher side
  - Speed range

- Supports sorting by selected numerical/table columns.
- Limits the number of visible rows initially, with an option to show more.
- Each pitch row can be clicked to open a detailed pitch page.

### Pitch Detail Page

- Shows detailed information for one selected pitch.
- Includes:
  - Pitch information
  - Movement and pitch-tracking metrics
  - Batted-ball/result information
  - Biomechanical summary metrics
  - Time-series metrics for that pitch

This page is intended to be more trainer-focused, allowing a user to move from a broad trend into a specific pitch.

### Year Compare

- Compares pitch-tracking and biomechanical averages between two selected years.
- Useful for reviewing changes from 2023 to 2025.
- Includes metrics such as:
  - Speed
  - Spin rate
  - Horizontal break
  - Induced vertical break
  - Release position
  - Arm slot
  - Shoulder-related metrics
  - Elbow torque-related metrics

### Trends

- Line chart for tracking selected pitch and biomechanical metrics over time.
- Supports grouping by date, month, or year.
- Useful for seeing whether changes are gradual or season-specific.
- Example metrics:
  - Average speed
  - Average spin rate
  - Average horizontal break
  - Average induced vertical break
  - Average arm slot
  - Average max elbow torque

### Movement Profile

- Scatter plot of horizontal break vs induced vertical break.
- Pitch types are color-coded.
- Helps show how the pitch shapes separate from each other.
- Includes pitch-type summary cards.
- Allows the user to hide/show pitch types.
- Includes compare mode for viewing movement profiles side-by-side by year or month.

### Individual Pitch Time-Series View

- Displays frame-level biomechanical information for a selected pitch.
- Includes key event markers such as:
  - Max knee lift
  - Foot strike
  - Max external shoulder rotation
  - Ball release
  - Max internal shoulder rotation
  - Release + 30
  - End normalized motion

- Includes an advanced frame-by-frame table for more detailed inspection.

## Visualization Types

This project includes multiple distinct visualization types:

- **Line chart**
  - Used for pitch and biomechanical trends over time.

- **Scatter plot**
  - Used for movement profile analysis: horizontal break vs induced vertical break.

- **Comparison table**
  - Used for 2023 vs 2025 biomechanical and pitch-tracking changes.

- **Interactive data table**
  - Used for filtering, sorting, and selecting individual pitches.

These visualizations were chosen because the assessment asked for multiple ways to help the user gain insight from the data, not just display raw values.

## Installation

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Python 3.10+
- Git
- Git LFS, if the large JSON data files are stored with LFS

### Clone the Repository

```bash
git clone https://github.com/bributler927/kinatrax_dummy_data.git
cd kinatrax_dummy_data
````

### Pull Git LFS Files

The data files are stored using Git LFS:

```bash
git lfs install
git lfs pull
```

## Running the Backend

From the root of the repository:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source .venv/bin/activate
```

```bash
# Windows
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If `requirements.txt` is not available, install the main dependencies manually:

```bash
pip install fastapi uvicorn pandas numpy
```

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

## Running the Frontend

Open a new terminal window and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

If needed, install the router and charting packages:

```bash
npm install react-router-dom recharts
```

Run the Vite development server:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## API Endpoints

Main API endpoints include:

```text
GET /api/summary
GET /api/filter-options
GET /api/pitches
GET /api/pitches/{PitchUID}
GET /api/pitches/{PitchUID}/timeseries
```

Example filtered pitch requests:

```text
GET /api/pitches?pitch_type=Sinker
GET /api/pitches?year=2025
GET /api/pitches?batter_id=B00007
GET /api/pitches?min_speed=90&max_speed=100
GET /api/pitches?sort_by=start_speed&sort_order=desc
```

## Project Structure

```text
kinatrax_dummy_data/
  backend/
    main.py
    routes/
      pitches.py
    services/
      data_loader.py
      pitch_analysis.py
    data/
      pitch_biomech_data.json
      time_series_metrics.json

  frontend/
    src/
      App.jsx
      App.css
      pages/
        YearComparisonPage.jsx
        TrendsPage.jsx
        MovementProfilePage.jsx
```

## Design Choices

* I used a Python/FastAPI backend because the data processing is easier and cleaner with pandas.

* The backend handles:

  * Loading JSON data
  * Joining pitch-level and time-series data by `PitchUID`
  * Filtering
  * Sorting
  * Aggregating
  * Cleaning values for JSON responses

* I used React/Vite for the frontend because it is fast to develop with and works well for interactive dashboards.

* I used Recharts for charts because it integrates cleanly with React.

* I organized the dashboard around how a pitcher or trainer might explore the data:

  * Start with a summary.
  * Filter the pitch table.
  * Compare years.
  * Look at trends.
  * Review pitch movement.
  * Drill into a specific pitch.

## Assumptions

* The dataset is for one pitcher.
* `PitchUID` is the shared key between the pitch-level data and the time-series data.
* `start_speed` is treated as the main pitch speed value in the dashboard.
* `eventTypeD` / pitch outcome data is more useful for the user than only showing generic pitch calls like “in play.”
* Biomechanical findings should be treated as exploratory and should not be interpreted as medical conclusions.
* Some biomechanical metrics require domain expertise, so the dashboard is meant to support discussion rather than replace a coach or trainer.

## Takeaways About the Pitcher

### Pitcher Profile

* The pitcher appears to be a right-handed pitcher.

* His arsenal is built mainly around:

  * Sinker
  * Splitter
  * Slider

* Based on the pitch mix and movement profile, he looks like a power sinker/splitter pitcher with a slider used as a third pitch.

### What He Does Well

* The sinker appears to be the primary pitch.

  * It has strong speed and movement characteristics.
  * It is likely the foundation of the arsenal.

* The splitter gives him a different movement band.

  * It creates separation from the sinker.
  * It appears useful as an off-speed/chase pitch.

* The slider gives him a glove-side movement option.

  * This helps round out the pitch mix and prevents the arsenal from being only sinker/splitter.

### What Stood Out Between 2023 and 2025

* The 2025 pitch mix appears more varied than the 2023 pitch mix.
* The pitcher appears to use the splitter and slider more in 2025 compared with 2023.
* The movement profile is one of the most useful views because it shows whether the pitch shapes are staying distinct across seasons.
* The trend chart helps show whether changes in speed, spin, movement, or biomechanical values are gradual or season-specific.

### Potential Concerns

* If speed decreases while workload-related biomechanical metrics stay the same or increase, that may suggest an efficiency issue.
* If the splitter becomes less distinct from the sinker, it may be less effective as a chase pitch.
* If the ball rate increases for the splitter, the pitcher may need to improve command or tunneling with that pitch.
* If arm slot, release point, or shoulder force changes significantly between seasons, those changes should be reviewed with a trainer or pitching coach.

### Biomechanical Observations

* The dashboard focuses on metrics that are useful for reviewing delivery and stress patterns, including:

  * Arm slot
  * Release point
  * Shoulder rotation
  * Elbow torque
  * Hip-shoulder separation
  * Stride length
  * Lead leg metrics
  * Center of mass metrics

* The biomechanics should be interpreted carefully.

* Without normative ranges or video context, I would not label a biomechanical value as definitely “good” or “bad.”

* The most useful interpretation is year-to-year comparison within the same pitcher.

### Suggestions for the Pitcher/Trainer

* Compare 2023 and 2025 sinkers specifically to see whether movement or release point changed.
* Review splitter command and movement separation from the sinker.
* Continue developing the slider as a third pitch shape.
* Use the movement profile to check whether pitch shapes are staying distinct.
* Use the individual pitch detail view to investigate outlier pitches.
* Use time-series data as an advanced trainer view rather than the main player-facing view.

## Main Takeaway

This pitcher appears to be a right-handed sinker/splitter pitcher with a slider mixed in as a third pitch. The movement profile suggests that his pitch shapes are meaningfully different, which is a strength. The most interesting area to explore is how his pitch characteristics and biomechanics shifted from 2023 to 2025, especially around speed, movement separation, release point, arm slot, and workload-related metrics.

## Limitations

* This is an exploratory prototype.
* The dataset appears to represent one pitcher.
* The app uses local JSON files instead of a database.
* Some values may need more baseball/biomechanics context to interpret correctly.
* The findings are not meant to be medical or final coaching recommendations.
* Time-series data can be large and complex, so only selected views are shown in the interface.

## Future Improvements

* Add more guided insight cards for major 2023 vs 2025 changes.
* Add trainer notes on individual pitches.
* Add exportable reports.
* Add more time-series charts for pitch-level mechanics.
* Add support for multiple pitchers.
* Add database storage for faster querying.
* Add more responsive layouts for tablets or smaller screens.
* Add more domain-specific interpretation around biomechanics.
* Add function descriptions for every function in the codebase
