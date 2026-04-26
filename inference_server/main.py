from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from inference import run_inference_from_bytes

app = FastAPI(title="PrivaFed Segmentation Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class SegmentRequest(BaseModel):
    file_content: str  # base64-encoded .nii file sent by the Next.js route


@app.post("/segment")
async def segment(req: SegmentRequest):
    try:
        result = run_inference_from_bytes(req.file_content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
