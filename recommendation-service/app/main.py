from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.recommend import router as recommend_router, get_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload ML model
    print("[INFO] Pre-loading ML recommender model...")
    get_model()
    print("[INFO] Recommender Service is ready!")
    yield
    # Shutdown
    print("[INFO] Shutting down Recommender Service.")


app = FastAPI(
    title="KursusIO Recommendation Engine API",
    description="Python ML microservice providing personalized course recommendations for KursusIO.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_router)


@app.get("/")
def root():
    return {
        "service": "KursusIO Recommendation Service",
        "status": "running",
        "docs_url": "/docs"
    }
