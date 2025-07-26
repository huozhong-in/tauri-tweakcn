from fastapi import FastAPI, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
import pyautogui
from Quartz.CoreGraphics import CGEventCreateScrollWheelEvent, CGEventPost, CGEventSetLocation, kCGEventSourceStateHIDSystemState, kCGScrollEventUnitPixel
from Quartz import CGPoint
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (less secure, use with caution)
    allow_credentials=True, # Allows cookies to be included in requests
    allow_methods=["*"],    # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allows all headers
)

def send_scroll_at_point(x, y, dy):
    # 获取当前鼠标位置
    ori_pos = pyautogui.position()
    print(ori_pos.x, ori_pos.y)
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
    print(pyautogui.size())
    
    # 设置目标坐标
    x, y = 1578, 587  # 替换为你的目标坐标
    send_scroll_at_point(x, y, -22)
    return {"message": "Hello World"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=60315, log_level="info")
