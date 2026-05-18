from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:2026"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PITCHES_DATA_PATH = "backend/data/pitch_biomech_data.json"
TIME_DATA_PATH = "backend/data/time_series_metrics.json"

def load_data():
    # Load pitch biomech table
    with open(PITCHES_DATA_PATH, "r") as f:
        biomech_data = json.load(f)
    biomech_df = pd.DataFrame(biomech_data)

    # Load time series metrics
    with open(TIME_DATA_PATH, "r") as f:
        ts_data = json.load(f)

    # Match timeseries data, timeseries as nested col
    ts_df = pd.DataFrame([
        {
            "PitchUID": pitch_id,
            "timeseries": metrics
        }
        for pitch_id, metrics in ts_data.items()
    ])

    # Merge tables by PitchUID
    merged_df = biomech_df.merge(
        ts_df,
        on="PitchUID",
        how="left"
    )

    print(merged_df.head(1))
    return merged_df

'''
 SECTION: API ENDPOINTS
'''
@app.get("/")
def root():
    return {"message": "Python analytics backend is running"}

load_data()
