# Blood Family Telegram Bot

## Встановлення та налаштування

### 1. Встановіть залежності

```bash
pip install python-telegram-bot requests python-dotenv
```

### 2. Створіть файл `.env`

```
BOT_TOKEN=your_telegram_bot_token_here
API_URL=https://qxizqlbrapcnwzpvqplt.supabase.co/functions/v1/telegram-bot
BOT_SECRET=BloodFamilyBot2024
```

### 3. Створіть бота через @BotFather
1. Напишіть @BotFather в Telegram
2. Надішліть команду `/newbot`
3. Виберіть ім'я та юзернейм (наприклад: BloodFamilyBot)
4. Скопіюйте токен і вставте в `.env`

### 4. Код бота (bot.py)

```python
import os
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
API_URL = os.getenv("API_URL")
BOT_SECRET = os.getenv("BOT_SECRET")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Store user states
user_states = {}

def api_call(action: str, **params):
    """Make API call to Supabase edge function"""
    try:
        response = requests.post(
            API_URL,
            json={"action": action, **params},
            headers={"x-bot-secret": BOT_SECRET, "Content-Type": "application/json"},
            timeout=30
        )
        return response.json()
    except Exception as e:
        logger.error(f"API error: {e}")
        return {"error": str(e)}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    chat_id = str(update.effective_chat.id)
    
    # Check if already connected
    result = api_call("check_connection", telegram_chat_id=chat_id)
    
    if result.get("connected"):
        keyboard = [
            [InlineKeyboardButton("📬 Мої повідомлення", callback_data="notifications")],
            [InlineKeyboardButton("🆘 Тех. підтримка", callback_data="support")],
            [InlineKeyboardButton("💡 Запропонувати ідею", callback_data="idea")],
        ]
        
        if result.get("is_developer"):
            keyboard.append([InlineKeyboardButton("🎫 Тікети підтримки", callback_data="tickets")])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"👋 Привіт, *{result.get('username')}*!\n\n"
            f"Ваш Telegram підключено до Blood Family.\n"
            f"Ви отримуватимете сповіщення про виплати контрактів та інше.",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(
            "🩸 *Blood Family Bot*\n\n"
            "Для підключення акаунта:\n"
            "1. Перейдіть на сайт bloodfamily.vercel.app\n"
            "2. Відкрийте профіль → Telegram\n"
            "3. Натисніть 'Отримати код підключення'\n"
            "4. Надішліть код сюди\n\n"
            "Введіть ваш код підключення:",
            parse_mode="Markdown"
        )
        user_states[chat_id] = "waiting_code"


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle regular messages"""
    chat_id = str(update.effective_chat.id)
    text = update.message.text.strip()
    state = user_states.get(chat_id)
    
    if state == "waiting_code":
        # Try to connect with code
        result = api_call("connect", code=text, telegram_chat_id=chat_id)
        
        if result.get("success"):
            del user_states[chat_id]
            await update.message.reply_text(result.get("message", "✅ Підключено!"))
            await start(update, context)
        else:
            await update.message.reply_text(result.get("message", "❌ Помилка підключення"))
    
    elif state == "waiting_support":
        # Submit support ticket
        result = api_call("support", telegram_chat_id=chat_id, message=text, type="support")
        del user_states[chat_id]
        await update.message.reply_text(result.get("message", "📩 Відправлено!"))
    
    elif state == "waiting_idea":
        # Submit idea
        result = api_call("support", telegram_chat_id=chat_id, message=text, type="idea")
        del user_states[chat_id]
        await update.message.reply_text(result.get("message", "💡 Дякуємо за ідею!"))
    
    elif state and state.startswith("responding_"):
        # Developer responding to ticket
        ticket_id = state.replace("responding_", "")
        result = api_call(
            "respond_ticket",
            telegram_chat_id=chat_id,
            ticket_id=ticket_id,
            response_message=text
        )
        
        del user_states[chat_id]
        
        if result.get("success"):
            # Send response to user
            user_chat_id = result.get("user_telegram_chat_id")
            if user_chat_id:
                try:
                    await context.bot.send_message(
                        chat_id=user_chat_id,
                        text=f"📨 *Відповідь від підтримки:*\n\n{text}",
                        parse_mode="Markdown"
                    )
                except Exception as e:
                    logger.error(f"Could not send response to user: {e}")
            
            await update.message.reply_text(result.get("message", "✅ Відповідь надіслано!"))
        else:
            await update.message.reply_text(result.get("message", "❌ Помилка"))
    
    else:
        # Unknown state, show menu
        await start(update, context)


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    
    chat_id = str(update.effective_chat.id)
    data = query.data
    
    if data == "notifications":
        result = api_call("get_notifications", telegram_chat_id=chat_id)
        notifications = result.get("notifications", [])
        
        if not notifications:
            await query.edit_message_text("📭 Немає нових повідомлень")
            return
        
        # Mark as read
        notification_ids = [n["id"] for n in notifications]
        api_call("mark_read", notification_ids=notification_ids)
        
        text = "📬 *Ваші повідомлення:*\n\n"
        for n in notifications[:10]:
            emoji = "💰" if n["type"] == "contract_paid" else "📌"
            text += f"{emoji} *{n['title']}*\n{n['message']}\n\n"
        
        await query.edit_message_text(text, parse_mode="Markdown")
    
    elif data == "support":
        user_states[chat_id] = "waiting_support"
        await query.edit_message_text(
            "🆘 *Тех. підтримка*\n\n"
            "Опишіть вашу проблему і ми допоможемо:",
            parse_mode="Markdown"
        )
    
    elif data == "idea":
        user_states[chat_id] = "waiting_idea"
        await query.edit_message_text(
            "💡 *Ваша ідея*\n\n"
            "Напишіть вашу пропозицію для покращення сайту чи сім'ї:",
            parse_mode="Markdown"
        )
    
    elif data == "tickets":
        result = api_call("get_support_tickets", telegram_chat_id=chat_id)
        
        if not result.get("success", True):
            await query.edit_message_text(result.get("message", "❌ Помилка"))
            return
        
        tickets = result.get("tickets", [])
        
        if not tickets:
            await query.edit_message_text("📭 Немає відкритих тікетів")
            return
        
        keyboard = []
        for t in tickets[:10]:
            username = t.get("profiles", {}).get("username", "Анонім") if t.get("profiles") else "Анонім"
            type_emoji = "💡" if t["type"] == "idea" else "🆘"
            keyboard.append([
                InlineKeyboardButton(
                    f"{type_emoji} {username}: {t['message'][:30]}...",
                    callback_data=f"ticket_{t['id']}"
                )
            ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            "🎫 *Відкриті тікети:*\n\nОберіть тікет для відповіді:",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
    
    elif data.startswith("ticket_"):
        ticket_id = data.replace("ticket_", "")
        user_states[chat_id] = f"responding_{ticket_id}"
        await query.edit_message_text(
            "✏️ Напишіть відповідь на цей тікет:",
            parse_mode="Markdown"
        )


async def menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /menu command"""
    await start(update, context)


def main():
    """Start the bot"""
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("menu", menu))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("Bot started!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
```

### 5. Запуск бота

```bash
python bot.py
```

## Безкоштовні хостинги для бота

### 1. Railway.app (Рекомендовано)
- 500 годин безкоштовно на місяць
- Легке налаштування через GitHub
- Підтримка environment variables
- https://railway.app

### 2. Render.com
- Безкоштовний план для background workers
- Може засипати через 15 хвилин неактивності
- https://render.com

### 3. Fly.io
- Щедрий безкоштовний план
- Потребує кредитну картку для верифікації
- https://fly.io

### 4. PythonAnywhere
- Завжди активний на безкоштовному плані
- Обмежені бібліотеки
- https://pythonanywhere.com

### 5. Oracle Cloud Free Tier
- Повністю безкоштовний VM назавжди
- Потребує реєстрації з карткою
- https://cloud.oracle.com/free

## Налаштування на Railway

1. Створіть репозиторій на GitHub з файлами:
   - `bot.py`
   - `requirements.txt`:
     ```
     python-telegram-bot==20.7
     requests==2.31.0
     python-dotenv==1.0.0
     ```

2. Зайдіть на railway.app і підключіть GitHub

3. Створіть новий проект → Deploy from GitHub repo

4. Додайте Environment Variables:
   - `BOT_TOKEN`
   - `API_URL`
   - `BOT_SECRET`

5. Railway автоматично задеплоїть бота!

## Важливо

- Не публікуйте `BOT_TOKEN` та `BOT_SECRET` у відкритому доступі
- Для production використовуйте унікальний `BOT_SECRET`
- Оновіть секрет в Supabase через: Settings → Secrets → Add TELEGRAM_BOT_SECRET
