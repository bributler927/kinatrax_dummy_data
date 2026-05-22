from services.data_loader import load_data
import numpy as np
import pandas as pd


TABLE_COLUMNS = [
    "PitchUID",
    "Date",
    "game_pk",
    "at_bat_index",
    "inning",
    "half_inning",
    "batter_id",
    "pitch_number",
    "pitch_type",
    "pitch_outcome",
    "pitch_outcome_display",
    "balls",
    "strikes",
    "outs",
    "start_speed",
    "end_speed",
    "spin_rate",
    "horizontal_break",
    "induced_vertical_break",
    "plate_x",
    "plate_z",
    "zone",
    "launchSpeed",
    "launchAngle",
    "eventType",
    "description",
    "pitcherSide",
    "batterSide",
    "Arm_Slot_Updated_X",
    "Max_Elb_Var_Torque_X",
    "Normalized_Max_Elb_Var_Torque_X",
    "Max_Resultant_Sho_Force_X",
]


def clean_for_json(df):
    """
    FastAPI cannot serialize NaN or +/- infinity.
    Convert them to None so they become JSON null.
    """
    return (
        df.replace([np.inf, -np.inf], np.nan)
        .astype(object)
        .where(pd.notna(df), None)
    )


def safe_mean(df, column_name):
    if column_name not in df.columns:
        return None

    value = df[column_name].mean()

    if pd.isna(value):
        return None

    return round(value, 2)


def get_unique_strings(df, column_name):
    if column_name not in df.columns:
        return []

    values = df[column_name].dropna().astype(str).unique().tolist()
    values = [value for value in values if value.strip() != ""]
    return sorted(values)


def get_unique_ints(df, column_name):
    if column_name not in df.columns:
        return []

    values = df[column_name].dropna().unique().tolist()

    cleaned_values = []
    for value in values:
        try:
            cleaned_values.append(int(value))
        except (TypeError, ValueError):
            pass

    return sorted(set(cleaned_values))


def get_speed_range(df):
    if "start_speed" not in df.columns:
        return {"min": None, "max": None}

    min_speed = df["start_speed"].min()
    max_speed = df["start_speed"].max()

    return {
        "min": None if pd.isna(min_speed) else round(float(min_speed), 1),
        "max": None if pd.isna(max_speed) else round(float(max_speed), 1),
    }

def get_text_series(df, column_name):
    if column_name not in df.columns:
        return pd.Series([""] * len(df), index=df.index)

    return df[column_name].fillna("").astype(str).str.strip()


def add_pitch_outcome(df):
    df = df.copy()

    df["pitch_outcome"] = get_text_series(df, "eventTypeD")

    #eventTypeD is blank for some pitches, so replace it with a guranteed column
    for fallback_column in ["eventType", "description", "pitch_call"]:
        missing_outcome = df["pitch_outcome"] == ""
        df.loc[missing_outcome, "pitch_outcome"] = get_text_series(
            df,
            fallback_column
        )[missing_outcome]

    return df

def format_pitch_result_label(value):
    if value is None or pd.isna(value):
        return None

    text = str(value).strip()

    if text == "":
        return None

    special_cases = {
        "hbp": "HBP",
        "hit_by_pitch": "Hit By Pitch",
    }

    raw_key = text.lower()

    if raw_key in special_cases:
        return special_cases[raw_key]

    words = text.replace("_", " ").split()

    return " ".join(word.capitalize() for word in words)


def add_pitch_outcome_display(df):
    """
    Creates:
    - pitch_outcome: raw filter value, such as field_out
    - pitch_outcome_display: frontend label, such as Field Out
    """
    df = add_pitch_outcome(df)

    df["pitch_outcome_display"] = df["pitch_outcome"].apply(
        format_pitch_result_label
    )

    return df


def get_value_label_options(df, value_column, label_column):
    if value_column not in df.columns or label_column not in df.columns:
        return []

    options_df = df[[value_column, label_column]].dropna().drop_duplicates()

    options_df = options_df[
        options_df[value_column].astype(str).str.strip() != ""
    ]

    options_df = options_df.sort_values(label_column)

    return (
        options_df.rename(
            columns={
                value_column: "value",
                label_column: "label",
            }
        )
        .to_dict(orient="records")
    )

def get_pitch_filtering_categories():
    """
    Frontend dropdown/filter options.
    Return arrays, not value_counts dictionaries, because the React UI
    needs a list of selectable values.
    """
    df = load_data()
    df = add_pitch_outcome_display(df)

    years = []
    if "Date" in df.columns:
        years = (
            df["Date"]
            .dropna()
            .astype(str)
            .str[:4]
            .unique()
            .tolist()
        )
        years = sorted(years)
        

    return {
        "pitch_types": get_unique_strings(df, "pitch_type"),
        "pitch_results": get_value_label_options(
            df, 
            "pitch_outcome",
            "pitch_outcome_display"),
        "batter_ids": get_unique_strings(df, "batter_id"),
        "dates": get_unique_strings(df, "Date"),
        "years": years,
        "innings": get_unique_ints(df, "inning"),
        "batter_sides": get_unique_strings(df, "batterSide"),
        "pitcher_sides": get_unique_strings(df, "pitcherSide"),
        "balls": get_unique_ints(df, "balls"),
        "strikes": get_unique_ints(df, "strikes"),
        "outs": get_unique_ints(df, "outs"),
        "speed_range": get_speed_range(df),
    }

def get_filtered_pitches(
    sort_by=None,
    sort_order="asc",
    pitch_type=None,
    batter_id=None,
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
    outs=None,
):
    df = load_data()
    df = add_pitch_outcome_display(df)

    if pitch_type:
        df = df[df["pitch_type"] == pitch_type]

    if batter_id:
        df = df[df["batter_id"] == batter_id]

    if min_speed is not None:
        df = df[df["start_speed"] >= min_speed]

    if max_speed is not None:
        df = df[df["start_speed"] <= max_speed]

    if date:
        df = df[df["Date"].astype(str) == date]

    if year:
        df = df[df["Date"].astype(str).str[:4] == year]

    if pitch_result:
        df = df[df["pitch_outcome"] == pitch_result]

    if inning is not None:
        df = df[df["inning"] == inning]

    if batter_side:
        df = df[df["batterSide"] == batter_side]

    if pitcher_side:
        df = df[df["pitcherSide"] == pitcher_side]

    if balls is not None:
        df = df[df["balls"] == balls]

    if strikes is not None:
        df = df[df["strikes"] == strikes]

    if outs is not None:
        df = df[df["outs"] == outs]

    if sort_by and sort_by in df.columns:
        df = df.sort_values(
            by=sort_by,
            ascending=(sort_order != "desc"),
            na_position="last",
        )

    columns_to_return = [
        column for column in TABLE_COLUMNS
        if column in df.columns
    ]

    df = df[columns_to_return]
    df = clean_for_json(df)

    return df.to_dict(orient="records")

PITCH_DETAIL_FIELDS = [
    "PitchUID",
    "Date",
    "game_pk",
    "at_bat_index",
    "inning",
    "half_inning",
    "pitcher_id",
    "batter_id",
    "pitch_number",
    "pitch_type",
    "pitch_call",
    "balls",
    "strikes",
    "outs",
    "start_speed",
    "end_speed",
    "spin_rate",
    "pitcherSide",
    "batterSide",
]

MOVEMENT_DETAIL_FIELDS = [
    "pfx_x",
    "pfx_z",
    "x0",
    "y0",
    "z0",
    "plate_x",
    "plate_z",
    "zone",
    "horizontal_break",
    "induced_vertical_break",
    "break_length",
    "break_angle",
    "spin_direction",
]

BATTED_BALL_DETAIL_FIELDS = [
    "launchSpeed",
    "launchAngle",
    "totalDistance",
    "hit_trajectory",
    "hit_hardness",
    "hit_location",
    "eventType",
    "description",
]

NON_BIOMECH_FIELDS = set(
    PITCH_DETAIL_FIELDS
    + MOVEMENT_DETAIL_FIELDS
    + BATTED_BALL_DETAIL_FIELDS
    + ["timeseries"]
)


def pick_fields(row, fields):
    return {
        field: row.get(field)
        for field in fields
        if field in row
    }


def is_biomech_field(field_name):
    if field_name in NON_BIOMECH_FIELDS:
        return False

    biomech_prefixes = (
        "Lead_",
        "Trail_",
        "Pelvis_",
        "Trunk_",
        "Sho_",
        "Elb_",
        "Hip_",
        "COM_",
        "Hand_",
        "Knee_",
        "Step_",
        "Stride_",
        "Max_",
        "Normalized_",
        "Resultant_",
        "Grounded_",
        "Head_",
        "Glove_",
        "MEEV",
        "MHV",
        "MPRV",
        "MSRV",
        "MTRV",
    )

    return (
        field_name.endswith("_X")
        or field_name.endswith("_Predicted_X")
        or field_name.startswith(biomech_prefixes)
    )


def get_pitch_detail(pitch_uid):
    df = load_data()

    matching_pitch = df[df["PitchUID"] == pitch_uid]

    if matching_pitch.empty:
        return None

    matching_pitch = clean_for_json(matching_pitch)
    row = matching_pitch.iloc[0].to_dict()

    biomechanics = {
        key: value
        for key, value in row.items()
        if is_biomech_field(key)
        and value is not None
        and value != ""
    }

    return {
        "pitch_uid": pitch_uid,
        "pitch": pick_fields(row, PITCH_DETAIL_FIELDS),
        "movement": pick_fields(row, MOVEMENT_DETAIL_FIELDS),
        "batted_ball": pick_fields(row, BATTED_BALL_DETAIL_FIELDS),
        "biomechanics": biomechanics,
        "timeseries": row.get("timeseries"),
    }

def get_summary():
    df = load_data()

    pitcher_ids = (
        df["pitcher_id"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )

    current_pitcher_id = pitcher_ids[0] if len(pitcher_ids) == 1 else "Multiple"

    return {
        "current_pitcher_id": current_pitcher_id,
        "total_pitches": len(df),
        "average_speed": safe_mean(df, "start_speed"),
        "average_spin_rate": safe_mean(df, "spin_rate"),
        "pitch_type_counts": df["pitch_type"].value_counts().to_dict(),
    }