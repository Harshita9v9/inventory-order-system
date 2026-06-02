from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Customer, Order, Product
from app.schemas.order import OrderCreate, OrderRead, OrderUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if product.quantity < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock for SKU '{product.sku}'. "
                f"Available: {product.quantity}, requested: {payload.quantity}."
            ),
        )

    total_amount = Decimal(product.price) * payload.quantity
    product.quantity -= payload.quantity

    order = Order(
        customer_id=payload.customer_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        total_amount=total_amount,
    )
    db.add(order)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to create order due to invalid data.")
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderRead], status_code=status.HTTP_200_OK)
def list_orders(db: Session = Depends(get_db)) -> list[Order]:
    return db.query(Order).order_by(Order.id).all()


@router.get("/{order_id}", response_model=OrderRead, status_code=status.HTTP_200_OK)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


@router.put("/{order_id}", response_model=OrderRead, status_code=status.HTTP_200_OK)
def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    customer_id = payload.customer_id if payload.customer_id is not None else order.customer_id
    product_id = payload.product_id if payload.product_id is not None else order.product_id
    quantity = payload.quantity if payload.quantity is not None else order.quantity

    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    old_product = db.get(Product, order.product_id)
    if not old_product:
        raise HTTPException(status_code=404, detail="Current order product not found.")

    # Restore previously reserved stock before recalculating new reservation.
    old_product.quantity += order.quantity

    new_product = db.get(Product, product_id)
    if not new_product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if new_product.quantity < quantity:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock for SKU '{new_product.sku}'. "
                f"Available: {new_product.quantity}, requested: {quantity}."
            ),
        )

    new_product.quantity -= quantity

    order.customer_id = customer_id
    order.product_id = product_id
    order.quantity = quantity
    order.total_amount = Decimal(new_product.price) * quantity

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to update order due to invalid data.")
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> None:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    product = db.get(Product, order.product_id)
    if product:
        product.quantity += order.quantity

    db.delete(order)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Unable to delete order.")
