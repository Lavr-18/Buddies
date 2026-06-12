from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RequestCreate(BaseModel):
    activity_type: Literal["coffee", "dinner", "sport", "cinema", "board", "walk", "photo", "other"]
    description: str = Field(min_length=1, max_length=300)
    time_type: Literal["now", "today_evening", "scheduled"]
    scheduled_at: datetime | None = None
    looking_gender: Literal["male", "female", "any"] = "any"
    looking_goal: list[Literal["romance", "friendship", "company"]] = Field(min_length=1)


class RequestOut(BaseModel):
    id: int
    user_id: int
    activity_type: str
    description: str
    time_type: str
    scheduled_at: datetime | None
    looking_gender: str
    looking_goal: list[str]
    status: str
    created_at: datetime
    expires_at: datetime

    model_config = {"from_attributes": True}


class RequestWithUser(RequestOut):
    user: "UserPublic"


class UserPublic(BaseModel):
    id: int
    first_name: str
    age: int
    gender: str
    interests: list[str]
    username: str | None

    model_config = {"from_attributes": True}


RequestWithUser.model_rebuild()
