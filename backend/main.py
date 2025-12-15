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

@app.get("/api/graph")
def get_graph():
    try:
        # 获取当前脚本所在目录
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, "data.json")
        
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}", "cwd": os.getcwd(), "ls": os.listdir(base_dir)}

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        return {"error": str(e), "type": "exception"}

@app.get("/api/quiz")
def get_quiz():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, "questions.json")
        
        if not os.path.exists(file_path):
            return {"error": f"Quiz data not found: {file_path}", "cwd": os.getcwd(), "ls": os.listdir(base_dir)}
            
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