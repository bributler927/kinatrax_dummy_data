from fastapi import APIRouter
from services.pitch_analysis import get_summary, get_filtered_pitches

router = APIRouter()

@router.get("/summary")
def summary():
    return get_summary()

#get_summary()

@router.get("/pitches")
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