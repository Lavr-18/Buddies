from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_telegram_user
from app.db.database import get_db
from app.models.match import Match
from app.models.request import Request
from app.models.response import Response
from app.models.user import User
from app.schemas.request import RequestOut, UserPublic
from app.schemas.response import MatchOut, ResponseOut

router = APIRouter(tags=["responses"])


async def get_current_user(tg_user: dict, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not registered")
    return user


@router.get("/api/requests/{request_id}/responses", response_model=dict)
async def get_responses_for_request(
    request_id: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)
    req_result = await db.execute(select(Request).where(Request.id == request_id))
    req = req_result.scalar_one_or_none()
    if not req or req.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your request")

    result = await db.execute(select(Response).where(Response.request_id == request_id))
    responses = result.scalars().all()

    items = []
    for resp in responses:
        u_result = await db.execute(select(User).where(User.id == resp.user_id))
        resp_user = u_result.scalar_one_or_none()
        items.append({
            "id": resp.id,
            "status": resp.status,
            "created_at": resp.created_at,
            "user": UserPublic.model_validate(resp_user).model_dump() if resp_user else None,
        })

    return {"responses": items}


@router.post("/api/requests/{request_id}/respond", response_model=dict, status_code=status.HTTP_201_CREATED)
async def respond_to_request(
    request_id: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)

    req_result = await db.execute(select(Request).where(Request.id == request_id))
    req = req_result.scalar_one_or_none()
    if not req or req.status != "active":
        raise HTTPException(status_code=404, detail="Request not found or not active")
    if req.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot respond to your own request")

    existing = await db.execute(
        select(Response).where(Response.request_id == request_id, Response.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already responded")

    resp = Response(request_id=request_id, user_id=user.id)
    db.add(resp)
    await db.commit()
    await db.refresh(resp)

    # Notify request author via bot
    from app.bot import notify_new_response
    await notify_new_response(req, user)

    return {"id": resp.id, "status": resp.status}


@router.post("/api/responses/{response_id}/accept", response_model=dict)
async def accept_response(
    response_id: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)

    resp_result = await db.execute(select(Response).where(Response.id == response_id))
    resp = resp_result.scalar_one_or_none()
    if not resp:
        raise HTTPException(status_code=404, detail="Response not found")

    req_result = await db.execute(select(Request).where(Request.id == resp.request_id))
    req = req_result.scalar_one_or_none()
    if not req or req.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your request")

    resp.status = "accepted"
    req.status = "matched"

    # Reject all other pending responses
    other_result = await db.execute(
        select(Response).where(
            Response.request_id == resp.request_id,
            Response.id != response_id,
            Response.status == "pending",
        )
    )
    for other in other_result.scalars().all():
        other.status = "rejected"

    match = Match(request_id=req.id, user_id_1=user.id, user_id_2=resp.user_id)
    db.add(match)
    await db.commit()
    await db.refresh(match)

    # Get responder info and notify both parties
    resp_user_result = await db.execute(select(User).where(User.id == resp.user_id))
    resp_user = resp_user_result.scalar_one_or_none()

    from app.bot import notify_match
    await notify_match(user, resp_user)

    return {"match_id": match.id}


@router.post("/api/responses/{response_id}/reject", response_model=dict)
async def reject_response(
    response_id: int,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)

    resp_result = await db.execute(select(Response).where(Response.id == response_id))
    resp = resp_result.scalar_one_or_none()
    if not resp:
        raise HTTPException(status_code=404, detail="Response not found")

    req_result = await db.execute(select(Request).where(Request.id == resp.request_id))
    req = req_result.scalar_one_or_none()
    if not req or req.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your request")

    resp.status = "rejected"
    await db.commit()
    return {"success": True}


@router.get("/api/responses/my", response_model=dict)
async def get_my_responses(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)
    result = await db.execute(
        select(Response).where(Response.user_id == user.id).order_by(Response.created_at.desc())
    )
    responses = result.scalars().all()

    items = []
    for resp in responses:
        req_result = await db.execute(select(Request).where(Request.id == resp.request_id))
        req = req_result.scalar_one_or_none()
        items.append({
            "id": resp.id,
            "status": resp.status,
            "created_at": resp.created_at,
            "request": RequestOut.model_validate(req).model_dump() if req else None,
        })

    return {"responses": items}


@router.get("/api/matches/my", response_model=dict)
async def get_my_matches(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user(tg_user, db)
    result = await db.execute(
        select(Match).where(
            (Match.user_id_1 == user.id) | (Match.user_id_2 == user.id)
        ).order_by(Match.created_at.desc())
    )
    matches = result.scalars().all()

    items = []
    for match in matches:
        partner_id = match.user_id_2 if match.user_id_1 == user.id else match.user_id_1
        p_result = await db.execute(select(User).where(User.id == partner_id))
        partner = p_result.scalar_one_or_none()
        req_result = await db.execute(select(Request).where(Request.id == match.request_id))
        req = req_result.scalar_one_or_none()
        items.append({
            "id": match.id,
            "partner_name": partner.first_name if partner else "",
            "partner_username": partner.username if partner else None,
            "request": RequestOut.model_validate(req).model_dump() if req else None,
            "created_at": match.created_at,
        })

    return {"matches": items}
