import os

from dotenv import load_dotenv

load_dotenv()


def get_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    database = os.getenv("POSTGRES_DB")

    if not user or not password or not database:
        raise ValueError(
            "Missing DB env vars. Set DATABASE_URL or POSTGRES_USER/"
            "POSTGRES_PASSWORD/POSTGRES_DB."
        )

    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
