from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import auth, products, cart, orders

app = FastAPI(title="E-Commerce API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(cart.admin_router)
app.include_router(orders.router)
app.include_router(orders.admin_router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
