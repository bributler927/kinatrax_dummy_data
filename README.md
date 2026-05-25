# Pitch Analytics Dashboard

An exploratory React/Vite + Python/FastAPI dashboard for reviewing pitch-level tracking and biomechanical data for a single pitcher.

The goal of this project is to give a pitcher and trainer a simple interface for exploring pitch outcomes, movement profiles, velocity/speed trends, and biomechanical changes over time.

## Overview

This dashboard combines pitch-level data with corresponding biomechanical/time-series metrics using a shared `PitchUID`. The frontend is built with React/Vite, while the backend uses FastAPI and pandas to load, merge, filter, and summarize the data.

The backend loads pitch biomechanics and time-series metrics, then merges them by `PitchUID` before serving the data through API endpoints. :contentReference[oaicite:0]{index=0} The FastAPI app exposes the backend through `/api` routes. :contentReference[oaicite:1]{index=1}

## Features

- Summary view for quick pitcher-level metrics
- Filterable and sortable pitch table
- Pitch detail view with expanded biomechanical information
- Pitch outcome trend chart over time
- Movement profile scatter plot using horizontal break and induced vertical break
- Compare view for movement profiles across years or months
- Filters for pitch type, batter, outcome, year, count, inning, and speed range

## Tech Stack

**Frontend**
- React
- Vite
- Recharts
- React Router

**Backend**
- Python
- FastAPI
- pandas
- Uvicorn

## Project Structure

```text
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
      TrendsPage.jsx
      YearComparisonPage.jsx
      MovementProfilePage.jsx
```

## To Run:
### Backend Instructions
```cd backend
uvicorn main:app --reload
```

### Front End Instructions
```cd frontend
npm install
npm install react-router-dom
npm install recharts
npm run dev
```
