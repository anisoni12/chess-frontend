// import { useState } from 'react'
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { Game } from "./screens/Game";
import { Landing } from "./screens/Landing";

function App() {
  return (
    <div className="h-screen bg-slate-950 ">
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </div>
    </div>
  )
}

export default App;
