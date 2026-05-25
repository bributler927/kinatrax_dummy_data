import json
from functools import lru_cache

import pandas as pd

PITCHES_DATA_PATH = "data/pitch_biomech_data.json"
TIME_DATA_PATH = "data/time_series_metrics.json"


@lru_cache(maxsize=1)
def load_pitch_data():
    with open(PITCHES_DATA_PATH, "r") as f:
        biomech_data = json.load(f)

    return pd.DataFrame(biomech_data)


@lru_cache(maxsize=1)
def load_time_series_data():
    with open(TIME_DATA_PATH, "r") as f:
        ts_data = json.load(f)

    return pd.DataFrame([
        {
            "PitchUID": pitch_id,
            "timeseries": metrics,
        }
        for pitch_id, metrics in ts_data.items()
    ])


def load_data(include_timeseries=False):
    pitch_df = load_pitch_data().copy()

    if not include_timeseries:
        return pitch_df

    ts_df = load_time_series_data()

    return pitch_df.merge(
        ts_df,
        on="PitchUID",
        how="left",
    )


def clear_data_cache():
    load_pitch_data.cache_clear()
    load_time_series_data.cache_clear()