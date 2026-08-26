"""
POLARIS — AI Polar Energy Digital Twin
FastAPI Backend Application Entrypoint
Smart India Hackathon 2026 Problem Statement PS26061
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import station, weather, forecast, optimization, simulation, agents

app = FastAPI(
    title="POLARIS — AI Polar Energy Resilience Platform",
    description="AI-Driven Smart Energy Management System & Digital Twin for Polar Research Stations",
    version="2.0.0"
)

# CORS configuration for development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(station.router)
app.include_router(weather.router)
app.include_router(forecast.router)
app.include_router(optimization.router)
app.include_router(simulation.router)
app.include_router(agents.router)


@app.get("/")
async def root():
    return {
        "system": "POLARIS AI Polar Energy Digital Twin",
        "problem_statement": "PS26061",
        "status": "OPERATIONAL",
        "version": "2.0.0",
        "concept": "Observe -> Predict -> Simulate -> Optimize -> Validate -> Act",
        "endpoints": {
            "station": "/api/station/presets",
            "weather": "/api/weather/live?lat=-69.4072&lon=76.1872",
            "forecast": "/api/forecast/run",
            "optimization": "/api/optimization/solve",
            "simulation": "/api/simulation/run",
            "agents": "/api/agents/orchestrate"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "polaris-backend"}


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
