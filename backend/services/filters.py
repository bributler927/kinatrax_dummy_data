import pandas as pd


def add_date_parts(df):
    df = df.copy()

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["year"] = df["Date"].dt.year
    df["month"] = df["Date"].dt.to_period("M").astype(str)
    df["date"] = df["Date"].dt.strftime("%Y-%m-%d")

    return df


def apply_common_filters(
    df,
    pitcher_id=None,
    pitch_type=None,
    pitch_result=None,
    batter_side=None,
    pitcher_side=None,
    year=None,
    min_speed=None,
    max_speed=None,
):
    df = df.copy()

    if pitcher_id:
        df = df[df["pitcher_id"] == pitcher_id]

    if pitch_type:
        df = df[df["pitch_type"] == pitch_type]

    if pitch_result:
        df = df[df["pitch_call"] == pitch_result]

    if batter_side:
        df = df[df["batterSide"] == batter_side]

    if pitcher_side:
        df = df[df["pitcherSide"] == pitcher_side]

    if year is not None:
        df = df[df["year"] == int(year)]

    if min_speed is not None:
        df = df[df["start_speed"] >= float(min_speed)]

    if max_speed is not None:
        df = df[df["start_speed"] <= float(max_speed)]

    return df