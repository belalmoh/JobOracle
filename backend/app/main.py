from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import uploads, extract, parse, keywords, settings, jobs, applications
from app.database import engine, Base

app = FastAPI(title="JobOracle API", version="1.0.0")

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


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "JobOracle API"}
