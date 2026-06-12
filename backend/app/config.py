from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    bot_token: str = ""
    database_url: str = "postgresql+asyncpg://buddies:buddies@postgres:5432/buddies"
    webapp_url: str = ""
    secret_key: str = "change_me"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
