# assistant.py
from fastapi import FastAPI
from constant import API_KEY

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Swipe Assistant!", "api_key": API_KEY[:4] + "***"}
