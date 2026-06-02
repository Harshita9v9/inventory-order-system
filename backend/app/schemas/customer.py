from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone_number: str = Field(min_length=5, max_length=30)


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, min_length=5, max_length=30)


class CustomerRead(CustomerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
