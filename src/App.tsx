import "./App.css";

function App() {
  return (
    <div className="w-full h-screen m-0 p-0 flex flex-row justify-center text-center overflow-hidden">
      <div className="flex-1" style={{ backgroundColor: "#61dafb" }}>
        <h1 className="text-4xl font-bold mt-8">Welcome to Tauri!</h1>
        <p className="text-xl">This is a Tauri application...</p>
      </div>
      <div className="flex-1" style={{ backgroundColor: "#00ff00" }}></div>
    </div>
  );
}

export default App;
