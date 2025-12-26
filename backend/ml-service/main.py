# ml-service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from contextlib import asynccontextmanager
import joblib
import numpy as np

state = {"model": None, "ds": None}

@asynccontextmanager
async def lifespan(app: FastAPI):
  state["model"] = joblib.load("models/lightfm_model.joblib")
  state["ds"] = joblib.load("models/mappings.joblib")["ds"]
  yield
  state["model"] = None
  state["ds"] = None

app = FastAPI(lifespan=lifespan)

class RecommendIn(BaseModel):
  user_id: str
  lat: float
  lon: float
  now_iso: str
  candidate_items: list[str] | None = None  # optional: let model generate

class RecommendOut(BaseModel):
  recommendations: list[str]

@app.post("/recommend", response_model=RecommendOut)
def recommend(inp: RecommendIn):
    # Dummy implementation for testing: return first 10 candidate_items or dummy ids
    if inp.candidate_items:
        # candidate_items is a list of dicts with 'id' field
        ids = [c['id'] if isinstance(c, dict) and 'id' in c else c for c in inp.candidate_items]
        return {"recommendations": ids[:10]}
    # fallback: return dummy ids
    return {"recommendations": [f"item{i}" for i in range(1, 11)]}
