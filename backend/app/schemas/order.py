from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OrderBase(BaseModel):
    customer_id: int = Field(gt=0)
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_id: int | None = Field(default=None, gt=0)
    product_id: int | None = Field(default=None, gt=0)
    quantity: int | None = Field(default=None, gt=0)


class OrderRead(OrderBase):
    id: int
    total_amount: Decimal = Field(ge=0)

    model_config = ConfigDict(from_attributes=True)
