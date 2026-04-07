from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import uploads, extract, parse, keywords, settings, jobs, applications
from app.database import init_db, close_db, get_db_info


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="JobOracle API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uploads.router, prefix="/api", tags=["uploads"])
app.include_router(extract.router, prefix="/api", tags=["extract"])
app.include_router(parse.router, prefix="/api", tags=["parse"])
app.include_router(keywords.router, prefix="/api", tags=["keywords"])
app.include_router(settings.router, prefix="/api", tags=["settings"])
app.include_router(jobs.router, prefix="/api", tags=["jobs"])
app.include_router(applications.router, prefix="/api", tags=["applications"])


@app.get("/health")
async def health_check():
    db_info = await get_db_info()
    return {
        "status": "healthy",
        "service": "JobOracle API",
        "database": db_info["database_type"],
        "fallback": db_info["is_fallback"],
    }

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)