from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Customer, Order, Product

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[LowStockProduct]


@router.get("/summary", response_model=DashboardSummary, status_code=status.HTTP_200_OK)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    low_stock_products = (
        db.query(Product)
        .filter(Product.quantity < 10)
        .order_by(Product.quantity.asc(), Product.id.asc())
        .all()
    )

    return DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock_products,
    )
