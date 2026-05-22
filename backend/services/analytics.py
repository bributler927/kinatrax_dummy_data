import pandas as pd
import numpy as np

from services.data_loader import load_data
from services.filters import add_date_parts, apply_common_filters
from services.pitch_analysis import clean_for_json


ANALYTICS_METRICS = {
    "start_speed": "Start Speed",
    "spin_rate": "Spin Rate",
    "horizontal_break": "Horizontal Break",
    "induced_vertical_break": "Induced Vertical Break",
    "x0": "Release X",
    "y0": "Release Y",
    "z0": "Release Z",
    "plate_x": "Plate X",
    "plate_z": "Plate Z",
    "Arm_Slot_Updated_X": "Arm Slot",
    "Sho_Rot_MER_X": "Shoulder Rotation at MER",
    "Sho_Rot_FC_X": "Shoulder Rotation at Foot Contact",
    "Pelvis_Rotation_MER_X": "Pelvis Rotation at MER",
    "Trunk_Rotation_MER_X": "Trunk Rotation at MER",
    "Max_Elb_Var_Torque_X": "Max Elbow Varus Torque",
    "Normalized_Max_Elb_Var_Torque_X": "Normalized Max Elbow Varus Torque",
    "Max_Resultant_Sho_Force_X": "Max Resultant Shoulder Force",
}


DEFAULT_COMPARISON_METRICS = [
    "start_speed",
    "spin_rate",
    "horizontal_break",
    "induced_vertical_break",
    "x0",
    "z0",
    "Arm_Slot_Updated_X",
    "Sho_Rot_MER_X",
    "Pelvis_Rotation_MER_X",
    "Trunk_Rotation_MER_X",
    "Max_Elb_Var_Torque_X",
    "Normalized_Max_Elb_Var_Torque_X",
    "Max_Resultant_Sho_Force_X",
]


DEFAULT_TREND_METRICS = [
    "start_speed",
    "spin_rate",
    "horizontal_break",
    "induced_vertical_break",
    "Arm_Slot_Updated_X",
    "Max_Elb_Var_Torque_X",
]


def parse_metrics(metrics):
    if not metrics:
        return None

    return [
        metric.strip()
        for metric in metrics.split(",")
        if metric.strip()
    ]


def safe_mean(series):
    clean_series = series.dropna()

    if clean_series.empty:
        return None

    return round(float(clean_series.mean()), 2)


def safe_rate(numerator, denominator):
    if denominator == 0:
        return None

    return round(float(numerator / denominator), 3)


def get_available_analytics_metrics():
    return [
        {
            "key": key,
            "label": label,
        }
        for key, label in ANALYTICS_METRICS.items()
    ]


def get_year_comparison(
    year_a=2023,
    year_b=2025,
    pitcher_id=None,
    pitch_type=None,
    pitch_result=None,
    batter_side=None,
    pitcher_side=None,
    metrics=None,
):
    df = load_data()
    df = add_date_parts(df)

    selected_metrics = parse_metrics(metrics) or DEFAULT_COMPARISON_METRICS
    selected_metrics = [
        metric for metric in selected_metrics
        if metric in df.columns
    ]

    df = apply_common_filters(
        df,
        pitcher_id=pitcher_id,
        pitch_type=pitch_type,
        pitch_result=pitch_result,
        batter_side=batter_side,
        pitcher_side=pitcher_side,
    )

    year_a_df = df[df["year"] == int(year_a)]
    year_b_df = df[df["year"] == int(year_b)]

    comparison_rows = []

    for metric in selected_metrics:
        year_a_value = safe_mean(year_a_df[metric])
        year_b_value = safe_mean(year_b_df[metric])

        difference = None
        percent_change = None

        if year_a_value is not None and year_b_value is not None:
            difference = round(year_b_value - year_a_value, 2)

            if year_a_value != 0:
                percent_change = round((difference / year_a_value) * 100, 2)

        comparison_rows.append({
            "metric": metric,
            "label": ANALYTICS_METRICS.get(metric, metric),
            "year_a_value": year_a_value,
            "year_b_value": year_b_value,
            "difference": difference,
            "percent_change": percent_change,
        })

    return {
        "year_a": year_a,
        "year_b": year_b,
        "sample_sizes": {
            str(year_a): len(year_a_df),
            str(year_b): len(year_b_df),
        },
        "filters": {
            "pitcher_id": pitcher_id,
            "pitch_type": pitch_type,
            "pitch_result": pitch_result,
            "batter_side": batter_side,
            "pitcher_side": pitcher_side,
        },
        "comparison": comparison_rows,
    }


def get_pitch_trends(
    group_by="month",
    pitcher_id=None,
    pitch_type=None,
    pitch_result=None,
    batter_side=None,
    pitcher_side=None,
    year=None,
    metrics=None,
):
    df = load_data()
    df = add_date_parts(df)

    selected_metrics = parse_metrics(metrics) or DEFAULT_TREND_METRICS
    selected_metrics = [
        metric for metric in selected_metrics
        if metric in df.columns
    ]

    df = apply_common_filters(
        df,
        pitcher_id=pitcher_id,
        pitch_type=pitch_type,
        pitch_result=pitch_result,
        batter_side=batter_side,
        pitcher_side=pitcher_side,
        year=year,
    )

    if group_by == "date":
        df["period"] = df["date"]
    elif group_by == "year":
        df["period"] = df["year"].astype("Int64").astype(str)
    else:
        df["period"] = df["month"]

    df = df.dropna(subset=["period"])

    rows = []

    for period, group in df.groupby("period"):
        row = {
            "period": period,
            "pitch_count": len(group),
        }

        for metric in selected_metrics:
            row[f"avg_{metric}"] = safe_mean(group[metric])

        if "is_ball" in group.columns:
            row["ball_rate"] = safe_rate(group["is_ball"].fillna(0).sum(), len(group))

        if "is_called_strike" in group.columns:
            row["called_strike_rate"] = safe_rate(
                group["is_called_strike"].fillna(0).sum(),
                len(group),
            )

        if "is_bip" in group.columns:
            row["in_play_rate"] = safe_rate(group["is_bip"].fillna(0).sum(), len(group))

        if "is_swing" in group.columns and "is_strike_swinging" in group.columns:
            swings = group["is_swing"].fillna(0).sum()
            whiffs = group["is_strike_swinging"].fillna(0).sum()
            row["whiff_rate"] = safe_rate(whiffs, swings)

        rows.append(row)

    result_df = pd.DataFrame(rows)

    if not result_df.empty:
        result_df = result_df.sort_values("period")

    result_df = clean_for_json(result_df)

    return {
        "group_by": group_by,
        "metrics": selected_metrics,
        "trends": result_df.to_dict(orient="records"),
    }