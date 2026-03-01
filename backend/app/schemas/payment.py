from pydantic import BaseModel


class PaymentOut(BaseModel):
    booking_id: str
    borrower_commission: float
    lender_commission: float
    lender_payout: float
    platform_earnings: float
