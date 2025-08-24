from fastapi import FastAPI, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import pyautogui
import json
import httpx
import uuid
from Quartz.CoreGraphics import (
    CGEventCreateScrollWheelEvent,
    CGEventPost,
    CGEventSetLocation,
    kCGEventSourceStateHIDSystemState,
    # kCGScrollEventUnitPixel,
)
from Quartz import (
    CGPoint,
    kCGWindowOwnerName,
    kCGWindowName,
    kCGWindowNumber,
    kCGWindowBounds,
    kCGWindowListOptionOnScreenOnly,
    kCGWindowListExcludeDesktopElements,
    CGWindowListCopyWindowInfo,
    kCGNullWindowID,
)


class ScrollRequest(BaseModel):
    x: int
    y: int
    dy: int


app = FastAPI()
origins = [
    "http://localhost:1421",  # Your Tauri dev server
    "tauri://localhost",  # Often used by Tauri in production
    "https://tauri.localhost",  # Also used by Tauri in production
]
app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins,  # Allows specific origins
    allow_origins=["*"],  # Or, to allow all origins (less secure, use with caution)
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)


def send_scroll_at_point(x, y, dy):
    print("pyautogui.size():", pyautogui.size())
    # 获取当前鼠标位置
    ori_pos = pyautogui.position()
    print("原始鼠标位置:", ori_pos.x, ori_pos.y)
    # 创建滚动事件
    event = CGEventCreateScrollWheelEvent(
        None, kCGEventSourceStateHIDSystemState, 1, dy
    )
    # 设置事件发生的坐标位置
    target_location = CGPoint(x, y)
    CGEventSetLocation(event, target_location)
    # 发送事件
    CGEventPost(kCGEventSourceStateHIDSystemState, event)
    # Reset to original location
    pyautogui.moveTo(ori_pos.x, ori_pos.y)


class WindowBounds(BaseModel):
    x: int
    y: int
    width: int
    height: int


class WindowInfo(BaseModel):
    application_name: str
    window_name: str
    window_id: int
    bounds: WindowBounds


def get_window_list():
    # Define options for window listing:
    # kCGWindowListOptionOnScreenOnly: Only include windows that are currently visible on screen.
    # kCGWindowListExcludeDesktopElements: Exclude elements like the desktop background and icons.
    options = kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements

    # Get the window information list
    window_list = CGWindowListCopyWindowInfo(options, kCGNullWindowID)

    windows = []
    for window_info in window_list:
        # Extract relevant information
        owner_name = window_info.get(kCGWindowOwnerName, "Unknown Application")
        window_name = window_info.get(kCGWindowName, "Untitled Window")
        window_id = window_info.get(kCGWindowNumber)
        bounds_dict = window_info.get(kCGWindowBounds, {})

        # Create WindowBounds object
        window_bounds = WindowBounds(
            x=int(bounds_dict.get("X", 0)),
            y=int(bounds_dict.get("Y", 0)),
            width=int(bounds_dict.get("Width", 0)),
            height=int(bounds_dict.get("Height", 0)),
        )

        # Create WindowInfo object
        window_info_obj = WindowInfo(
            application_name=owner_name,
            window_name=window_name,
            window_id=window_id,
            bounds=window_bounds,
        )

        windows.append(window_info_obj)

    return windows


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


@app.get("/windows")
async def get_windows():
    print("获取窗口列表")
    windows = get_window_list()
    return {"windows": windows}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=60316, log_level="info")
