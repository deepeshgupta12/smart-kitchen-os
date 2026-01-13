from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartKitchen API - V1 Foundation")

# Configure CORS so our future Next.js frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "Healthy",
        "version": "1.1.0",
        "platform": "Smart Kitchen OS",
        "step": "Environment Setup"
    }

@app.get("/health")
def health_check():
    return {"status": "up and running"}