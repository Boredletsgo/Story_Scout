"""Dashboard router: analytics + reading coach."""

from __future__ import annotations

from fastapi import APIRouter

from app.agents.reading_coach_agent import CoachContext, generate_coaching
from app.api.deps import CurrentUser, DashboardServiceDep, UserServiceDep

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(current_user: CurrentUser, service: DashboardServiceDep) -> dict:
    return await service.get_stats(current_user.id)


@router.get("/genres")
async def genre_distribution(
    current_user: CurrentUser, service: DashboardServiceDep
) -> dict[str, int]:
    return await service.genre_distribution(current_user.id)


@router.get("/coach")
async def reading_coach(
    current_user: CurrentUser,
    dashboard: DashboardServiceDep,
    users: UserServiceDep,
) -> dict[str, str]:
    stats = await dashboard.get_stats(current_user.id)
    pref = await users.get_preferences(current_user.id)
    ctx = CoachContext(
        profile_summary=pref.profile_summary or "",
        books_read=stats["books_read"],
        streak_days=stats["reading_streak_days"],
        goal_books=stats["reading_goal_books"],
    )
    message = await generate_coaching(ctx)
    return {"message": message}
