from datetime import datetime

from pydantic import BaseModel

from app.schemas.request import RequestOut, UserPublic


class ResponseOut(BaseModel):
    id: int
    request_id: int
    user_id: int
    status: str
    created_at: datetime
    user: UserPublic | None = None
    request: RequestOut | None = None

    model_config = {"from_attributes": True}


class MatchOut(BaseModel):
    id: int
    request_id: int
    partner_name: str
    partner_username: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
