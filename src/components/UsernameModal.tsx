import { useState } from "react";
import { Button } from "../components/Button";

interface UsernameModalProps {
  onSubmit: (username: string) => void;
}

export const UsernameModal = ({ onSubmit }: UsernameModalProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters long.");
      return;
    }

    if (username.trim().length > 20) {
      setError("Username must be less than 20 characters");
      return;
    }
    if(username.toLowerCase().includes("badword")) {
      setError("Usernames not allowed")
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    onSubmit(username.trim());
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
        handleSubmit();
    }
  };

  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-8 max-w-md w-full mx-4 border-2 border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          ♟️ Welcome to Chess
        </h2>
        <p className="text-gray-400 text-center mb-6">
          Enter your username to start playing
        </p>

        <div className="mb-4">
          <label className="block text-white font-semibold mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter username..."
            className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border-2 border-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
            maxLength={20}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">⚠️ {error}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            2-20 characters, letters, numbers, and underscores only
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Continue ➜
        </Button>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>🎮 Ready to play some chess?</p>
        </div>
      </div>
    </div>
  );
};
