from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_telegram_user
from app.db.database import get_db
from app.models.request import Request
from app.models.user import User
from app.schemas.request import RequestCreate, RequestOut, RequestWithUser, UserPublic

router = APIRouter(prefix="/api/requests", tags=["requests"])


async def get_current_user(tg_user: dict, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not registered")
    return user


@router.get("", response_model=dict)
async def get_feed(
    goal: str | None = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    query = (
        select(Request)
        .where(Request.status == "active")
        .where(Request.expires_at > now)
        .order_by(Request.created_at.desc())
    )
    if goal:
        query = query.where(Request.looking_goal.any(goal))

    total_result = await db.execute(query)
    total = len(total_result.scalars().all())

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    requests = result.scalars().all()

    items = []
    for req in requests:
        user_result = await db.execute(select(User).where(User.id == req.user_id))
        user = user_result.scalar_one_or_none()
        items.append({
            **RequestOut.model_validate(req).model_dump(),
            "user": UserPublic.model_validate(user).model_dump() if user else None,
        })

    return {"requests": items, "total": total}


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(
    body: RequestCreate,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)
    req = Request(
        user_id=user.id,
        activity_type=body.activity_type,
        description=body.description,
        time_type=body.time_type,
        scheduled_at=body.scheduled_at,
        looking_gender=body.looking_gender,
        looking_goal=body.looking_goal,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


@router.get("/my", response_model=dict)
async def get_my_requests(
    status_filter: str | None = Query(None, alias="status"),
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)
    query = select(Request).where(Request.user_id == user.id).order_by(Request.created_at.desc())
    if status_filter:
        query = query.where(Request.status == status_filter)
    result = await db.execute(query)
    return {"requests": [RequestOut.model_validate(r, from_attributes=True).model_dump() for r in result.scalars().all()]}


@router.delete("/{request_id}", response_model=dict)
async def delete_request(
    request_id: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)
    result = await db.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your request")
    req.status = "deleted"
    await db.commit()
    return {"success": True}
