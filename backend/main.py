from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.pitches import router as pitches_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:2026",
                   "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

'''
 Categories to plot:
    - pfx_x = horizontal movement
    - pfx_z = vertical movement
    - x0 = horizontal release point
    - y0 = release distance from plate
    - z0 = vertical release point
    - plate_x = horizontal plate crossing
    - plate_z = vertical plate crosing
'''

'''
 SECTION: API ENDPOINTS
'''

app.include_router(pitches_router, prefix="/api")

# No pagination reqiured because it's a small dataset?
@app.get("/")
def root():
    return {"message": "Python analytics backend is running"}

