import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# 允许所有来源的跨域请求，方便前端开发
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
def get_status():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        files = os.listdir(base_dir)
    except Exception as e:
        files = str(e)
    return {
        "status": "ok",
        "cwd": os.getcwd(),
        "base_dir": base_dir,
        "files_in_base_dir": files
    }

def find_file(filename):
    # Try multiple locations
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, filename),
        os.path.join(os.getcwd(), filename),
        os.path.join(os.getcwd(), "api", filename),
        filename 
    ]
    
    for path in candidates:
        if os.path.exists(path):
            return path
    return None

@app.get("/api/graph")
def get_graph():
    try:
        file_path = find_file("data.json")
        
        if not file_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            return {"error": f"data.json not found", "searched_in": base_dir, "cwd": os.getcwd()}

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {"error": str(e), "type": "exception"}

@app.get("/api/quiz")
def get_quiz():
    try:
        file_path = find_file("questions.json")
        
        if not file_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            return {"error": f"questions.json not found", "searched_in": base_dir}
            
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {"error": str(e), "type": "exception"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Dielectric Physics Knowledge Graph API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)