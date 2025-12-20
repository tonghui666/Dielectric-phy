import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from openai import OpenAI

app = FastAPI()

# 允许所有来源的跨域请求，方便前端开发
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

DEEPSEEK_API_KEY = "sk-53c0ef17b3dc41e6be8507a1b96e99b0"
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

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

def search_knowledge_base(query):
    """
    简单的关键词搜索，从data.json中查找相关内容作为上下文
    """
    try:
        file_path = find_file("data.json")
        if not file_path:
            return ""
            
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        context = []
        nodes = data.get("nodes", [])
        
        # 简单关键词匹配
        keywords = query.replace("?", "").replace("？", "").split()
        
        for node in nodes:
            score = 0
            content = f"{node.get('name', '')} {node.get('description', '')} {node.get('details', '')}"
            
            for kw in keywords:
                if kw in content:
                    score += 1
            
            if score > 0:
                context.append(f"概念：{node.get('name')}\n描述：{node.get('description')}\n详情：{node.get('details')}")
                
        # 限制上下文长度，取前3个最相关的（这里简化为按顺序）
        return "\n\n".join(context[:3])
    except Exception as e:
        print(f"Error searching knowledge base: {e}")
        return ""

@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        user_message = request.message
        
        # 1. 检索本地知识库
        context = search_knowledge_base(user_message)
        
        # 2. 构建 Prompt
        system_prompt = "你是一个电介质物理学科的智能助教。请基于提供的上下文知识回答用户的问题。如果上下文没有相关信息，请利用你的专业知识回答，但要标注'（基于通用物理知识回答）'。回答要简洁、准确、学术化。"
        
        if context:
            system_prompt += f"\n\n参考上下文：\n{context}"
            
        # 3. 调用 DeepSeek API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            stream=False
        )
        
        answer = response.choices[0].message.content
        return {"answer": answer}
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {"error": str(e), "answer": "抱歉，我现在无法回答您的问题，请稍后再试。"}

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