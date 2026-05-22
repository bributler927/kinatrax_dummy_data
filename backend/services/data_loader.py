import pandas as pd
import json

PITCHES_DATA_PATH = "data/pitch_biomech_data.json"
TIME_DATA_PATH = "data/time_series_metrics.json"



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