from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    telegram_id: int
    username: str | None = None
    first_name: str
    age: int = Field(ge=18, le=80)
    gender: Literal["male", "female"]
    interests: list[str] = Field(min_length=2)
    goal: list[Literal["romance", "friendship", "company"]] = Field(min_length=1)


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: str | None
    first_name: str
    age: int
    gender: str
    interests: list[str]
    goal: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
