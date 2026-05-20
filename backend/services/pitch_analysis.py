from services.data_loader import load_data
import numpy as np

def clean_for_json(df):
    return df.replace({np.nan: None})

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

    #print(df)

    df = clean_for_json(df)
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
    #print(df_numeric)

    return (
        pitch_calls,
        pitch_types,
        batter_ids,
        batter_sides,
        pitcher_sides,
        years,
        dates,
    )

#get_pitch_filtering_categories()

def get_summary():
    df = load_data()

    summary = {
        "total_pitches": len(df),
        "average_end_speed": round(df["end_speed"].mean(), 2),
        "average_spin_rate": round(df["spin_rate"].mean(), 2),
        "pitch_type_counts": df["pitch_type"].value_counts().to_dict(),
    }

    #print(summary["average_end_speed"])
    #print(summary["average_spin_rate"])
    #print(summary["pitch_type_counts"])
    
    return summary