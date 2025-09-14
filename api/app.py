from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="Run the FastAPI app")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to run the app on")
    parser.add_argument("--port", type=int, default=60316, help="Port to run the app on")
    args = parser.parse_args()

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")
