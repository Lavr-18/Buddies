from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_telegram_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserRegister

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register(
    body: UserRegister,
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    if tg_user["id"] != body.telegram_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="telegram_id mismatch")

    result = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = result.scalar_one_or_none()

    if user:
        user.username = body.username
        user.first_name = body.first_name
        user.age = body.age
        user.gender = body.gender
        user.interests = body.interests
        user.goal = body.goal
    else:
        user = User(
            telegram_id=body.telegram_id,
            username=body.username,
            first_name=body.first_name,
            age=body.age,
            gender=body.gender,
            interests=body.interests,
            goal=body.goal,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
async def get_me(
    tg_user: dict = Depends(get_current_telegram_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not registered")
    return user
