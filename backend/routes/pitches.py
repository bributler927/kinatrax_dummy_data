from fastapi import APIRouter, HTTPException
from services.pitch_analysis import (
    get_summary,
    get_filtered_pitches,
    get_pitch_filtering_categories,
    get_pitch_detail,
    get_pitch_timeseries_tables,
)

router = APIRouter()


@router.get("/summary")
def summary():
    return get_summary()

@router.get("/filter-options")
def filter_options():
    return get_pitch_filtering_categories()

@router.get("/pitches")
def pitches(
    pitch_type: str | None = None,
    batter_id: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    min_speed: float | None = None,
    max_speed: float | None = None,
    date: str | None = None,
    year: str | None = None,
    pitch_result: str | None = None,
    inning: int | None = None,
    batter_side: str | None = None,
    pitcher_side: str | None = None,
    balls: int | None = None,
    strikes: int | None = None,
    outs: int | None = None,
):
    return get_filtered_pitches(
        sort_by=sort_by,
        sort_order=sort_order,
        pitch_type=pitch_type,
        batter_id=batter_id,
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
        outs=outs,
    )

@router.get("/pitches/{pitch_uid}")
def pitch_detail(pitch_uid: str):
    pitch = get_pitch_detail(pitch_uid)

    if pitch is None:
        raise HTTPException(
            status_code=404,
            detail=f"Pitch {pitch_uid} not found"
        )

    return pitch

@router.get("/pitches/{pitch_uid}/timeseries")
def pitch_timeseries(pitch_uid: str):
    timeseries = get_pitch_timeseries_tables(pitch_uid)

    if timeseries is None:
        raise HTTPException(
            status_code=404,
            detail=f"Pitch {pitch_uid} not found",
        )

    return timeseries