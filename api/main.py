from fastapi import FastAPI, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyautogui
from Quartz.CoreGraphics import CGEventCreateScrollWheelEvent, CGEventPost, CGEventSetLocation, kCGEventSourceStateHIDSystemState, kCGScrollEventUnitPixel
from Quartz import CGPoint

class ScrollRequest(BaseModel):
    x: int
    y: int
    dy: int
app = FastAPI()
origins = [
    "http://localhost:1421",  # Your Tauri dev server
    "tauri://localhost",      # Often used by Tauri in production
    "https://tauri.localhost" # Also used by Tauri in production
]
app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins,  # Allows specific origins
    allow_origins=["*"], # Or, to allow all origins (less secure, use with caution)
    allow_credentials=True, # Allows cookies to be included in requests
    allow_methods=["*"],    # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allows all headers
)


def send_scroll_at_point(x, y, dy):
    print("pyautogui.size():", pyautogui.size())
    # 获取当前鼠标位置
    ori_pos = pyautogui.position()
    print("原始鼠标位置:", ori_pos.x, ori_pos.y)
    # 创建滚动事件
    event = CGEventCreateScrollWheelEvent(None, kCGEventSourceStateHIDSystemState, 1, dy)
    # 设置事件发生的坐标位置
    target_location = CGPoint(x, y)
    CGEventSetLocation(event, target_location)
    # 发送事件
    CGEventPost(kCGEventSourceStateHIDSystemState, event)
    # Reset to original location
    pyautogui.moveTo(ori_pos.x, ori_pos.y)

@app.get("/")
async def root():
    print("根路径被访问")
    # 设置目标坐标
    x, y = 1578, 587  # 替换为你的目标坐标
    send_scroll_at_point(x, y, -22)
    return {"message": "Hello World"}

@app.post("/scroll")
async def scroll_at_point(request: ScrollRequest):
    print(f"Received scroll request: {request}")
    # 发送滚动事件
    if request.x == 0 and request.y == 0:
        print("Received scroll request with zero coordinates, skipping scroll.")
        return {"message": "Scroll event skipped due to zero coordinates"}
    send_scroll_at_point(request.x, request.y, request.dy)
    return {"message": "Scroll event sent"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=60315, log_level="info")
