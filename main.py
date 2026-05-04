# main.py (корень проекта)
from dotenv import load_dotenv
load_dotenv()

from bot.main import main
import asyncio

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBot stopped.")