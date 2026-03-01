from app.core.config import settings


def simulate_payment(total_amount: float) -> dict:
    borrower_commission = round(total_amount * settings.borrower_commission_rate, 2)
    lender_commission = round(total_amount * settings.lender_commission_rate, 2)
    lender_payout = round(total_amount - lender_commission, 2)
    platform_earnings = round(borrower_commission + lender_commission, 2)
    return {
        "borrower_commission": borrower_commission,
        "lender_commission": lender_commission,
        "lender_payout": lender_payout,
        "platform_earnings": platform_earnings,
    }
