import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import httpx
import resend

app = FastAPI(title="Solne Newsletter API — 334 Creations Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "codinginquires1@gmail.com")

resend.api_key = RESEND_API_KEY


class SubscribeRequest(BaseModel):
    email: EmailStr
    lang: str = "el"
    brand: str = "Solne Clothes"
    studio: str = "334 Creations Studio"


@app.get("/health")
def health():
    return {"status": "ok", "brand": "Solne Clothes", "studio": "334 Creations Studio"}


@app.post("/api/newsletter/subscribe")
async def subscribe(req: SubscribeRequest):
    email_norm = req.email.strip().lower()

    # 1. Insert into Supabase
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{SUPABASE_URL}/rest/v1/newsletter_subscribers",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                json={
                    "email": email_norm,
                    "lang": req.lang if req.lang in ("el", "en") else "el",
                    "brand": "Solne Clothes",
                    "studio": "334 Creations Studio",
                },
            )
            if r.status_code == 409:
                raise HTTPException(status_code=409, detail="Already subscribed")
            if r.status_code >= 400:
                raise HTTPException(status_code=500, detail="Database error")

    # 2. Send welcome email via Resend
    if RESEND_API_KEY:
        subject = (
            "Καλωσόρισες στο Solne Clothes"
            if req.lang == "el"
            else "Welcome to Solne Clothes"
        )
        body = (
            "Ευχαριστούμε για την εγγραφή σου στο newsletter της Solne Clothes (334 Creations Studio)."
            if req.lang == "el"
            else "Thanks for subscribing to the Solne Clothes newsletter (334 Creations Studio)."
        )
        resend.Emails.send({
            "from": f"Solne Clothes <{SENDER_EMAIL}>",
            "to": [email_norm],
            "subject": subject,
            "text": body,
        })

    return {"ok": True, "email": email_norm}
