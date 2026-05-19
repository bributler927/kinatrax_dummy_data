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

    return merged_df

'''
SECTIONS TO MAP TO APIs LATER
'''
# setting up filtering and sorting
def get_filtered_pitches(
    sort_by=None,
    sort_order="asc",
    pitch_type=None,
    min_speed=None,
    max_speed=None,
    date=None,
    year=None,
    pitch_result=None,
    inning=None,
    batter_side=None,
    pitcher_side=None,
    balls=None,
    strikes=None,
    outs=None
):
    df = load_data()

    if sort_by:
        if sort_order == "asc": 
            ascending = sort_order == "asc"

            df = df.sort_values(
                by=sort_by,
                ascending=ascending
            )
        elif sort_order == "desc":
            descending = sort_order == "desc"

            df = df.sort_values(
                by=sort_by,
                ascending=descending
            )

    if pitch_type:
        df = df[df["pitch_type"] == pitch_type]

    if min_speed is not None:
        df = df[df["end_speed"] >= min_speed]

    if max_speed is not None:
        df = df[df["end_speed"] <= max_speed]

    if date:
        df = df[df["Date"] == date]

    if year:
        df = df[df["Date"].str[:4] == year]

    if pitch_result:
        df = df[df["pitch_call"] == pitch_result]

    if inning:
        df = df[df["inning"] == inning]

    if batter_side:
        df = df[df["batterSide"] == batter_side]

    if pitcher_side:
        df = df[df["pitcherSide"] == pitcher_side]

    if balls:
        df = df[df["balls"] == balls]

    if strikes:
        df = df[df["strikes"] == strikes]
 
    if outs: 
        df = df[df["outs"] == outs]

    print(df)

    return df.to_dict(orient="records")

#get_filtered_pitches(balls=1, strikes=2, sort_order="desc", sort_by="end_speed")

def get_pitch_filtering_categories():
    # will later use this to providing filtering options
    df = load_data()

    pitch_calls = df["pitch_call"].value_counts().to_dict()
    pitch_types = df["pitch_type"].value_counts().to_dict()
    batter_ids = df["batter_id"].value_counts().to_dict()
    batter_sides = df["batterSide"].value_counts().to_dict()
    pitcher_sides = df["pitcherSide"].value_counts().to_dict()
    years = df["Date"].str[:4].value_counts().to_dict()
    dates = df["Date"].value_counts().to_dict()

    # get all columns with numeric data types
    df_numeric = df.select_dtypes(include=['number']).columns.tolist()
    print(df_numeric)

    return (
        pitch_calls,
        pitch_types,
        batter_ids,
        batter_sides,
        pitcher_sides,
        years,
        dates,
    )

get_pitch_filtering_categories()


'''
 Categories to plot:
    - pfx_x = horizontal movement
    - pfx_z = vertical movement
    - x0 = horizontal release point
    - y0 = release distance from plate
    - z0 = vertical release point
    - plate_x = horizontal plate crossing
    - plate_z = vertical plate crosing
'''

'''
 SECTION: API ENDPOINTS
'''

# No pagination reqiured because it's a small dataset?
@app.get("/")
def root():
    return {"message": "Python analytics backend is running"}

@app.get("/api/summary")
def get_summary():
    df = load_data()

    summary = {
        "total_pitches": len(df),
        "average_end_speed": round(df["end_speed"].mean(), 2),
        "average_spin_rate": round(df["spin_rate"].mean(), 2),
        "pitch_type_counts": df["pitch_type"].value_counts().to_dict(),
    }

    print(summary["average_end_speed"])
    print(summary["average_spin_rate"])
    print(summary["pitch_type_counts"])
    
    return summary

#get_summary()

@app.get("/pitches")
def pitches(
    pitch_type: str | None = None,
    sort_by: str | None = None,
    sort_order: str | None = None,
    min_speed: int | None = None,
    max_speed: int | None = None,
    date: str | None = None,
    year: str | None = None,
    pitch_result: str | None = None,
    inning: int | None = None,
    batter_side: str | None = None,
    pitcher_side: str | None = None,
    balls: int | None = None,
    strikes: int | None = None,
    outs: int | None = None
):
    return get_filtered_pitches(
        sort_by=sort_by,
        sort_order=sort_order,
        pitch_type=pitch_type,
        min_speed=min_speed,
        max_speed=max_speed,
        date=date,
        year=year,
        pitch_result=pitch_result,
        inning=inning,
        batter_side=batter_side,
        pitcher_side=pitcher_side,
        balls=balls,
        strikes=strikes,
        outs=outs
    )