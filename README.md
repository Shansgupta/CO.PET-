# Pet Lending Marketplace MVP (Zero-Cost Prototype)

MVP for a temporary pet-lending marketplace with:
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: FastAPI
- Database: MongoDB (free tier compatible)
- Auth: JWT email/password

## Project Structure

```text
backend/
  app/
    core/        # settings, security
    db/          # MongoDB connection
    deps/        # auth dependency
    routers/     # auth, pets, bookings, dashboard
    schemas/     # Pydantic request/response models
    services/    # simulated payment logic
    utils/       # date + mongo helpers
    main.py      # app entry
  requirements.txt

frontend/
  app/           # App Router pages
  components/    # shared UI (navbar)
  lib/           # api + auth helpers
  package.json
  tailwind.config.js
```

## Backend Setup (FastAPI)

1. Create virtual env and install dependencies:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Run MongoDB (local or Atlas free tier).

   You can configure connection and auth settings with environment variables:

```bash
set MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
set MONGO_DB=pet_lending_mvp
set JWT_SECRET=replace-with-a-random-secret
set CORS_ORIGINS=http://localhost:3000
```

3. Start API:

```bash
uvicorn app.main:app --reload --port 8000
```

4. Swagger docs:
- http://localhost:8000/docs

If registration fails, check:
- `GET /health` returns `{"status":"ok"}`
- Backend logs for MongoDB connection errors
- `MONGO_URL` is set correctly (Atlas IP access list includes your IP)
- Frontend shows backend error message directly (validation/auth/db)

## Frontend Setup (Next.js)

1. Install dependencies:

```bash
cd frontend
npm install
```

2. (Optional) set API URL:

```bash
set NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start frontend:

```bash
npm run dev
```

4. Open:
- http://localhost:3000

## API Endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Pets
- `GET /pets` (public browse)
- `GET /pets/{pet_id}` (public detail)
- `POST /pets` (auth required, create listing)

### Bookings
- `POST /bookings` (auth required, checks slot and prevents double booking)

### Dashboard
- `GET /dashboard/me` (auth required, returns listed pets + booked pets)

### Utility
- `GET /health`

## Database Collections / Schemas

### `users`
- `_id`
- `name`
- `email`
- `password_hash`
- `created_at`

### `pets`
- `_id`
- `owner_id` (user id string)
- `name`
- `type`
- `description`
- `price_per_day`
- `availability_slots[]` with:
  - `start_date` (ISO date string)
  - `end_date` (ISO date string)

### `bookings`
- `_id`
- `pet_id`
- `borrower_id`
- `start_date` (ISO date string)
- `end_date` (ISO date string)
- `total_amount`
- `status` (`confirmed`)

### `payments`
- `_id`
- `booking_id`
- `borrower_commission`
- `lender_commission`
- `lender_payout`
- `platform_earnings`

## Payment Simulation Logic

For each booking:
- `total_amount = days * price_per_day`
- `borrower_commission = total_amount * 10%`
- `lender_commission = total_amount * 5%`
- `lender_payout = total_amount - lender_commission`
- `platform_earnings = borrower_commission + lender_commission`

## MVP Workflow Implemented

1. User registers/logs in
2. User lists pet with availability slots
3. Another user browses pets and views details
4. User books an exact available slot
5. Backend validates slot + conflict check
6. Booking and payment records are created
7. Slot is removed from pet availability
8. Booking confirmation is returned
