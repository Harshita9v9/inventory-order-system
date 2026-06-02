from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import customers_router, dashboard_router, orders_router, products_router
from app.db import Base, engine
import app.models  # noqa: F401

app = FastAPI(title="Inventory & Order Management API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(dashboard_router)
