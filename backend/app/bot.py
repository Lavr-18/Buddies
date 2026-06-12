from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, Update, WebAppInfo
from fastapi import Request

from app.config import settings

bot = Bot(token=settings.bot_token)
dp = Dispatcher()
router = Router()
dp.include_router(router)


def _open_app_keyboard(text: str = "Открыть Buddies") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text=f"🚀 {text}", web_app=WebAppInfo(url=settings.webapp_url))
    ]])


@router.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "Привет! 👋\n\nBuddies — находи компанию здесь и сейчас.\nОткрой приложение и создай заявку!",
        reply_markup=_open_app_keyboard(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "Buddies — находи компанию для встречи здесь и сейчас 🎉",
        reply_markup=_open_app_keyboard(),
    )


@router.message()
async def fallback(message: Message):
    await message.answer(
        "Открой Buddies через кнопку меню 👇",
        reply_markup=_open_app_keyboard(),
    )


async def process_update(update_data: dict):
    update = Update.model_validate(update_data)
    await dp.feed_update(bot, update)


# --- Notifications ---

ACTIVITY_EMOJI = {
    "coffee": "☕", "dinner": "🍕", "sport": "🏃", "cinema": "🎬",
    "board": "🎲", "walk": "🌳", "photo": "📸", "other": "🎤",
}


async def notify_new_response(request, responder):
    """Notify request author that someone responded."""
    if not settings.bot_token:
        return
    try:
        author_result = None
        from app.db.database import AsyncSessionLocal
        from app.models.user import User
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == request.user_id))
            author = result.scalar_one_or_none()
            if not author:
                return

        emoji = ACTIVITY_EMOJI.get(request.activity_type, "🎯")
        interests_str = ", ".join(responder.interests[:3]) if responder.interests else "—"
        text = (
            f"{emoji} На твою заявку <b>{request.activity_type}</b> "
            f"откликнулся(ась) <b>{responder.first_name}</b>, {responder.age} лет.\n"
            f"Интересы: {interests_str}\n\n"
            f"Посмотреть отклики:"
        )
        keyboard = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="Посмотреть →", web_app=WebAppInfo(url=f"{settings.webapp_url}?screen=responses&request_id={request.id}"))
        ]])
        await bot.send_message(author.telegram_id, text, parse_mode="HTML", reply_markup=keyboard)
    except Exception:
        pass


async def notify_match(author, responder):
    """Notify both parties about a match."""
    if not settings.bot_token:
        return
    try:
        responder_username = f"@{responder.username}" if responder.username else responder.first_name
        author_username = f"@{author.username}" if author.username else author.first_name

        # Notify responder
        keyboard_responder = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text=f"Написать {author_username}", url=f"tg://resolve?domain={author.username}" if author.username else f"tg://user?id={author.telegram_id}")
        ]])
        await bot.send_message(
            responder.telegram_id,
            f"🎉 <b>{author.first_name}</b> принял(а) твой отклик!\n"
            f"Его/её контакт: {author_username}\n\n"
            f"Напиши первым 👇",
            parse_mode="HTML",
            reply_markup=keyboard_responder,
        )

        # Notify author
        keyboard_author = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text=f"Написать {responder_username}", url=f"tg://resolve?domain={responder.username}" if responder.username else f"tg://user?id={responder.telegram_id}")
        ]])
        await bot.send_message(
            author.telegram_id,
            f"✅ Ты принял(а) отклик от <b>{responder.first_name}</b>!\n"
            f"Его/её контакт: {responder_username}\n\n"
            f"Удачной встречи! 🙌",
            parse_mode="HTML",
            reply_markup=keyboard_author,
        )
    except Exception:
        pass
