from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.pitches import router as pitches_router
from routes.analytics import router as analytics_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:2026",
                   "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pitches_router, prefix="/api")
app.include_router(analytics_router, prefix="/api/analytics")

@app.get("/")
def root():
    return {"message": "Python analytics backend is running"}
