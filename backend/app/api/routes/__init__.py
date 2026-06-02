from app.api.routes.customers import router as customers_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.orders import router as orders_router
from app.api.routes.products import router as products_router

__all__ = [
    "products_router",
    "customers_router",
    "orders_router",
    "dashboard_router",
]
