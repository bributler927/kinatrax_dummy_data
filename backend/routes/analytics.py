from fastapi import APIRouter
from services.analytics import (
    get_available_analytics_metrics,
    get_year_comparison,
    get_pitch_trends,
)

router = APIRouter()


@router.get("/metrics")
def analytics_metrics():
    return get_available_analytics_metrics()


@router.get("/year-comparison")
def year_comparison(
    year_a: int = 2023,
    year_b: int = 2025,
    pitcher_id: str | None = None,
    pitch_type: str | None = None,
    pitch_result: str | None = None,
    batter_side: str | None = None,
    pitcher_side: str | None = None,
    metrics: str | None = None,
):
    return get_year_comparison(
        year_a=year_a,
        year_b=year_b,
        pitcher_id=pitcher_id,
        pitch_type=pitch_type,
        pitch_result=pitch_result,
        batter_side=batter_side,
        pitcher_side=pitcher_side,
        metrics=metrics,
    )


@router.get("/trends")
def trends(
    group_by: str = "month",
    pitcher_id: str | None = None,
    pitch_type: str | None = None,
    pitch_result: str | None = None,
    batter_side: str | None = None,
    pitcher_side: str | None = None,
    year: int | None = None,
    metrics: str | None = None,
):
    return get_pitch_trends(
        group_by=group_by,
        pitcher_id=pitcher_id,
        pitch_type=pitch_type,
        pitch_result=pitch_result,
        batter_side=batter_side,
        pitcher_side=pitcher_side,
        year=year,
        metrics=metrics,
    )