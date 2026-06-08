"""Optional HTTP API for website crawler (production / scaling)."""

from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field

from crawler.service import crawl_domain

app = FastAPI(title="Email Harvesting Website Crawler", version="1.0.0")


class CrawlRequest(BaseModel):
    domain: str
    max_pages: int = Field(default=10, ge=1, le=20)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "website-crawler"}


@app.post("/crawl")
def crawl(body: CrawlRequest) -> dict:
    return crawl_domain(body.domain, max_pages=body.max_pages)
