import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from schemas import (
    AnomalyDetectionRequest, AnomalyDetectionResponse,
    IncidentAnalysisRequest, IncidentAnalysisResponse,
    AlertPriorityRequest, AlertPriorityResponse,
    TimelineSummaryRequest, TimelineSummaryResponse,
    RemediationPlaybookRequest, RemediationPlaybookResponse,
    ExplainInsightRequest, ExplainInsightResponse
)
from models.anomaly_detector import anomaly_detector
from models.alert_prioritizer import alert_prioritizer
from services.llm_analyzer import llm_analyzer

app = FastAPI(
    title="NetScope Anomaly Detection Service",
    description="Endpoint anomaly detection and telemetry-based incident explanations",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NetScope AI Microservice",
        "ai_enabled": settings.AI_ENABLED,
        "groq_model": settings.GROQ_MODEL,
        "api_key_configured": bool(settings.GROQ_API_KEY)
    }

@app.post("/detect-anomaly", response_model=AnomalyDetectionResponse)
def detect_anomaly(request: AnomalyDetectionRequest):
    try:
        return anomaly_detector.detect(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(e)}")

@app.post("/analyze-incident", response_model=IncidentAnalysisResponse)
async def analyze_incident(request: IncidentAnalysisRequest):
    try:
        return await llm_analyzer.analyze_incident(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incident analysis error: {str(e)}")

@app.post("/prioritize-alert", response_model=AlertPriorityResponse)
def prioritize_alert(request: AlertPriorityRequest):
    try:
        return alert_prioritizer.prioritize(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alert prioritization error: {str(e)}")

@app.post("/summarize-timeline", response_model=TimelineSummaryResponse)
async def summarize_timeline(request: TimelineSummaryRequest):
    try:
        return await llm_analyzer.summarize_timeline(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timeline summarization error: {str(e)}")

@app.post("/generate-playbook", response_model=RemediationPlaybookResponse)
async def generate_playbook(request: RemediationPlaybookRequest):
    try:
        return await llm_analyzer.generate_playbook(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Playbook generation error: {str(e)}")

@app.post("/explain-insight", response_model=ExplainInsightResponse)
async def explain_insight(request: ExplainInsightRequest):
    try:
        return await llm_analyzer.explain_insight(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explain insight error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
