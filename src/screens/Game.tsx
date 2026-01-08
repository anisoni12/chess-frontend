import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { MoveHistory } from "../components/MoveHistory";
import { UsernameModal } from "../components/UsernameModal";
import { useChessSound } from "../hooks/useChessSound";
import { GameOverModal } from "../components/GameOverModal";

interface Move {
  from: string;
  to: string;
  san: string;
  color: "w" | "b";
}

// TODO : Move together, there is repetition of code here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const RESIGN = "resign";
export const DRAW_OFFER = "draw_offer";
export const DRAW_RESPONSE = "draw_response";
export const TIME_UPDATE = "time_update";
export const TIME_CONTROL = "time_control";
export const SET_USERNAME = "set_username";

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

interface CapturedPieces {
  white: PieceSymbol[];
  black: PieceSymbol[];
}

// Timer Control options
const TIME_CONTROLS = [
  { label: "1 min", value: 60 }, // ← ADD THIS
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
];

export const Game = () => {
  const socket = useSocket();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState(
    "Click 'Play' to start a game"
  );
  const [gameOver, setGameOver] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    white: [],
    black: [],
  });
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [isInCheck, setIsInCheck] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [whiteTime, setWhiteTime] = useState(100);
  const [blackTime, setBlackTime] = useState(100);
  const [showTimeControlSelect, setShowTimeControlSelect] = useState(false);

  // 👤 PLAYER PROFILE STATES
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const [myUsername, setMyUsername] = useState("");
  const [opponentUsername, setOpponentUsername] = useState("");
  const [whitePlayer, setWhitePlayer] = useState("");
  const [blackPlayer, setBlackPlayer] = useState("");
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameResult, setGameResult] = useState<{
    winner: string;
    reason: string;
  }>({ winner: "", reason: "" });
  const { playSound } = useChessSound();

  // Calculate captured pieces by comparing with starting position
  const calculatedCapturedPieces = (currentChess: Chess): CapturedPieces => {
    const startingPieces = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1,
    };

    const currentPieces = {
      white: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      black: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    // count current pieces on board
    const boardState = currentChess.board();
    boardState.forEach((row) => {
      row.forEach((square) => {
        if (square) {
          const color = square.color === "w" ? "white" : "black";
          currentPieces[color][square.type]++;
        }
      });
    });

    const captured: CapturedPieces = { white: [], black: [] };

    // White captured black pieces
    (Object.keys(startingPieces) as PieceSymbol[]).forEach((piece) => {
      const missing = startingPieces[piece] - currentPieces.black[piece];
      for (let i = 0; i < missing; i++) {
        captured.white.push(piece);
      }
    });

    // Black captured white pieces
    (Object.keys(startingPieces) as PieceSymbol[]).forEach((piece) => {
      const missing = startingPieces[piece] - currentPieces.white[piece];
      for (let i = 0; i < missing; i++) {
        captured.black.push(piece);
      }
    });

    return captured;
  };

  // Calculate material advantage
  const calculateMaterialAdvantage = (captured: CapturedPieces) => {
    const whiteValue = captured.white.reduce(
      (sum, piece) => sum + PIECE_VALUES[piece],
      0
    );
    const blackValue = captured.black.reduce(
      (sum, piece) => sum + PIECE_VALUES[piece],
      0
    );
    return whiteValue - blackValue;
  };

  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 👤 HANDLE USERNAME SUBMISSION
  const handleUsernameSubmit = (username: string) => {
    setMyUsername(username);
    setShowUsernameModal(false);
    setStatusMessage("Click 'Play' to find an opponent");

    // send USERNAME to server
    if (socket) {
      socket.send(
        JSON.stringify({
          type: SET_USERNAME,
          payload: { username },
        })
      );
    }
  };

  // handleStartGame function
  const handleStartGame = () => {
    if (socket) {
      setShowTimeControlSelect(true);
    }
  };

  // Start game with selected time control
  const handleTimeControlSelect = (timeInSeconds: number) => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: TIME_CONTROL,
          payload: { timeControl: timeInSeconds },
        })
      );
      socket.send(JSON.stringify({ type: INIT_GAME }));
      // setSelectedTimeControl(timeInSeconds);
      setWhiteTime(timeInSeconds);
      setBlackTime(timeInSeconds);
      setStatusMessage("🔍 Looking for opponent...");
      setShowTimeControlSelect(false);
      if (gameOver) {
        setGameOver(false);
        setStarted(false);
      }
    }
  };

  // handleResign function
  const handleResign = () => {
    if (socket && started && !gameOver) {
      const confirmResign = window.confirm("Are you sure you want to resign?");

      if (confirmResign) {
        socket.send(JSON.stringify({ type: RESIGN }));
        console.log("Resign sent to server");
      }
    }
  };

  const handleOfferDraw = () => {
    if (socket && started && !gameOver) {
      const confirmOffer = window.confirm("Offer a draw to your opponent?");

      if (confirmOffer) {
        socket.send(JSON.stringify({ type: DRAW_OFFER }));
        setStatusMessage("Draw offer sent. Waiting for response...");
        console.log("Draw offer sent");
      }
    }
  };

  const handleDrawResponse = (accepted: boolean) => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: DRAW_RESPONSE,
          payload: { accepted },
        })
      );
      setDrawOfferReceived(false);
      if (!accepted) {
        const turn = chess.turn() === "w" ? "white" : "black";
        setStatusMessage(`Draw declined. ${turn}'s turn`);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handler = (event: MessageEvent) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (e) {
        console.error("Failed to parse socket message:", e);
        return;
      }

      console.log(message);
      switch (message.type) {
        case "waiting": {
          setStatusMessage("Waiting for opponent...");
          break;
        }

        case INIT_GAME: {
          const color = message.payload.color;
          const whiteUserName = message.payload.whitePlayer;
          const blackUserName = message.payload.blackPlayer;

          setPlayerColor(color);
          setWhitePlayer(whiteUserName);
          setBlackPlayer(blackUserName);

          // Set opponent username
          setOpponentUsername(
            color === "white" ? blackUserName : whiteUserName
          );

          setStatusMessage(
            `🎮 Game started! You are ${color} playing against ${
              color === "white" ? blackUserName : whiteUserName
            }`
          );

          const newChess = new Chess();
          setChess(newChess);
          setBoard(newChess.board()); // ✅ Using new instance
          setStarted(true);
          setGameOver(false);
          setLastMove(null);
          setCapturedPieces({ white: [], black: [] });
          setMoveHistory([]);
          setIsInCheck(false);

          // Initialize timers from servers
          if (message.payload.timeControl) {
            setWhiteTime(message.payload.timeControl);
            setBlackTime(message.payload.timeControl);
          }
          console.log("Game initialized - Player color:", color);
          playSound("gameStart");
          break;
        }

        // TIME UPDATE FROM SERVER
        case TIME_UPDATE: {
          setWhiteTime(message.payload.whiteTime);
          setBlackTime(message.payload.blackTime);
          break;
        }

        case MOVE: {
          const move = message.payload.move;
          const newChess = new Chess(chess.fen());

          try {
            const moveResult = newChess.move(move);
            setChess(newChess);
            setBoard(newChess.board());
            setLastMove({ from: move.from, to: move.to });

            // 🔊 PLAY SOUNDS
            if (moveResult.captured) {
              playSound("capture");
            } else if (moveResult.san?.includes("O-O")) {
              playSound("castle");
            } else if (moveResult.promotion) {
              playSound("promote");
            } else {
              playSound("move");
            }

            // Add move to history
            setMoveHistory((prev) => [
              ...prev,
              {
                from: move.from,
                to: move.to,
                san: moveResult.san, // e4, Nf3, Bxc6, etc.
                color: moveResult.color,
              },
            ]);

            // Update captured pieces
            const captured = calculatedCapturedPieces(newChess);
            setCapturedPieces(captured);

            // CHECK DETECTION
            const inCheck = newChess.isCheck();
            setIsInCheck(inCheck);

            if (inCheck) {
              setTimeout(() => playSound("check"), 100);
            }

            const currentPlayer =
              newChess.turn() === "w" ? whitePlayer : blackPlayer;
            setStatusMessage(
              inCheck
                ? `⚠️ CHECK! ${currentPlayer}'s turn`
                : `${currentPlayer}'s turn`
            );
          } catch (e) {
            console.error("Invalid move received:", e);
          }
          break;
        }
        case GAME_OVER: {
          const winner = message.payload.winner;
          const reason = message.payload.reason;
          setGameOver(true);
          setGameResult({ winner, reason });
          setShowGameOverModal(true);
          playSound("gameEnd");

          if (winner === "draw") {
            setStatusMessage("🤝 Game drawn by agreement!");
          } else if (reason === "resignation") {
            setStatusMessage(`🏳️ ${winner} wins by resignation!`);
          } else if (reason === "timeout") {
            setStatusMessage(`⏱️ ${winner} wins on time!`);
          } else {
            setStatusMessage(`👑 Checkmate! ${winner} wins!`);
          }
          break;
        }
        case "error": {
          setStatusMessage(`${message.payload.message}`);
          setTimeout(() => {
            if (started && !gameOver) {
              const turn = chess.turn() === "w" ? "white" : "black";
              setStatusMessage(`${turn}'s turn`);
            }
          }, 2000);
          break;
        }

        case "opponent_disconnected": {
          setStatusMessage("Opponent disconnected. You win!");
          setStarted(false);
          setGameOver(true);
          break;
        }

        case DRAW_OFFER: {
          setDrawOfferReceived(true);
          setStatusMessage("⚖️ Your opponent offers a draw!");
          console.log("Draw offer received");
          break;
        }

        case "draw_declined": {
          setStatusMessage("Draw offer declined. Continue playing!");
          setTimeout(() => {
            const turn = chess.turn() === "w" ? "white" : "black";
            setStatusMessage(`${turn}'s turn`);
          }, 3000);
          break;
        }
      }
    };
    socket.addEventListener("message", handler);
    return () => {
      socket.removeEventListener("message", handler);
    };
  }, [
    socket,
    chess,
    started,
    gameOver,
    whitePlayer,
    blackPlayer,
    opponentUsername,
  ]);

  if (!socket) {
    return (
      <div className="text-white text-center pt-8 text-xl">
        Connecting to server...
      </div>
    );
  }

  // 👤 SHOW USERNAME MODAL FIRST
  if (showUsernameModal) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />;
  }

  const materialAdvantage = calculateMaterialAdvantage(capturedPieces);

  // Piece images mapping
  const pieceImages: Record<PieceSymbol, string> = {
    p: "/p.svg",
    n: "/kn.svg",
    b: "/b.svg",
    r: "/r.svg",
    q: "/q.svg",
    k: "/k.svg",
  };

  // Get opponent display name
  const opponentDisplay = started
    ? playerColor === "white"
      ? blackPlayer
      : whitePlayer
    : "Opponent";

  const myDisplay = myUsername || (playerColor === "white" ? "White" : "Black");

  return (
    <div className="justify-center flex min-h-screen bg-slate-950">
      <div className="pt-8 max-w-screen-lg w-full px-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 w-full">
          {/* Chess Board */}
          <div className="md:col-span-4 w-full flex flex-col items-center gap-4">
            {/* Opponent Captured Pieces (Top) */}
            {started && (
              <div className="w-full bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Opponent Timer */}
                  <div
                    className={`px-4 py-2 rounded font-mono text-xl font-bold ${
                      (playerColor === "white" && chess.turn() === "b") ||
                      (playerColor === "black" && chess.turn() === "w")
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-gray-300"
                    }`}
                  >
                    {formatTime(
                      playerColor === "white" ? blackTime : whiteTime
                    )}
                  </div>

                  {/* 👤 PLAYER INFO */}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {opponentDisplay.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {opponentDisplay}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {playerColor === "white" ? "Black" : "White"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-white font-semibold mr-2">
                      {playerColor === "white" ? "Black" : "White"}:
                    </span>
                    {(playerColor === "white"
                      ? capturedPieces.white
                      : capturedPieces.black
                    ).map((piece, idx) => (
                      <img
                        key={idx}
                        src={pieceImages[piece]}
                        alt={piece}
                        className="w-6 h-6"
                      />
                    ))}
                  </div>
                </div>
                {materialAdvantage !== 0 && (
                  <div
                    className={`font-bold text-lg ${
                      (playerColor === "white" && materialAdvantage > 0) ||
                      (playerColor === "black" && materialAdvantage < 0)
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {playerColor === "white"
                      ? materialAdvantage > 0
                        ? `+${materialAdvantage}`
                        : materialAdvantage
                      : materialAdvantage < 0
                      ? `+${Math.abs(materialAdvantage)}`
                      : `-${materialAdvantage}`}
                  </div>
                )}
              </div>
            )}

            {/* Board */}
            <ChessBoard
              socket={socket}
              board={board}
              chess={chess}
              lastMove={lastMove}
              playerColor={playerColor}
              isInCheck={isInCheck}
            />

            {/* Your Section with timer */}
            {started && (
              <div className="w-full bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* ⏱️ YOUR TIMER */}
                  <div
                    className={`px-4 py-2 rounded font-mono text-xl font-bold ${
                      (playerColor === "white" && chess.turn() === "w") ||
                      (playerColor === "black" && chess.turn() === "b")
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-gray-300"
                    }`}
                  >
                    {formatTime(
                      playerColor === "white" ? whiteTime : blackTime
                    )}
                  </div>

                  {/* 👤 YOUR INFO */}
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {myDisplay.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {myDisplay} <span className="text-gray-400">(You)</span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        {playerColor === "white" ? "White" : "Black"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-white font-semibold mr-2">
                      {playerColor === "white" ? "White" : "Black"} (You):
                    </span>
                    {(playerColor === "white"
                      ? capturedPieces.black
                      : capturedPieces.white
                    ).map((piece, idx) => (
                      <img
                        key={idx}
                        src={pieceImages[piece]}
                        alt={piece}
                        className="w-6 h-6"
                      />
                    ))}
                  </div>
                </div>

                {materialAdvantage !== 0 && (
                  <div
                    className={`font-bold text-lg ${
                      (playerColor === "white" && materialAdvantage < 0) ||
                      (playerColor === "black" && materialAdvantage > 0)
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {playerColor === "white"
                      ? materialAdvantage < 0
                        ? `+${Math.abs(materialAdvantage)}`
                        : `-${materialAdvantage}`
                      : materialAdvantage > 0
                      ? `+${materialAdvantage}`
                      : materialAdvantage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game Controls */}
          <div className="md:col-span-2 bg-slate-900 rounded-lg p-6 w-full">
            <div className="flex flex-col gap-4">
              {/* 👤 PLAYER INFO CARD */}
              {!started && (
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-2">
                    {myUsername.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white font-bold text-lg">{myUsername}</p>
                  <p className="text-gray-400 text-sm">Ready to play!</p>
                </div>
              )}
              {/* Status Display */}
              <div className="bg-slate-800 rounded p-4 text-center">
                <p className="text-white text-lg font-semibold">
                  {statusMessage}
                </p>
              </div>

              {started && <MoveHistory moves={moveHistory} />}

              {/* ⏱️ TIME CONTROL SELECTION */}
              {!started && !showTimeControlSelect && (
                <Button onClick={handleStartGame}>🎮 Play</Button>
              )}

              {showTimeControlSelect && (
                <div className="flex flex-col gap-2">
                  <p className="text-white text-center font-semibold mb-2">
                    ⏱️ Select Time Control
                  </p>
                  {TIME_CONTROLS.map((tc) => (
                    <Button
                      key={tc.value}
                      onClick={() => handleTimeControlSelect(tc.value)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {tc.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Resign Button */}
              {started && !gameOver && (
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleResign}
                >
                  Resign
                </Button>
              )}

              {/* Offer Draw Button - Show during active game */}
              {started && !gameOver && !drawOfferReceived && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleOfferDraw}
                >
                  🤝 Offer Draw
                </Button>
              )}

              {drawOfferReceived && (
                <div className="flex gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={() => handleDrawResponse(true)}
                  >
                    ✅ Accept
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 flex-1"
                    onClick={() => handleDrawResponse(false)}
                  >
                    ❌ Decline
                  </Button>
                </div>
              )}

              {gameOver && (
                <Button onClick={handleStartGame}>🔄 New Game</Button>
              )}

              <div className="bg-slate-800 rounded p-4 text-sm text-gray-300">
                <h3 className="font-bold text-white mb-2">How to Play:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Select time control</li>
                  <li>Click piece to see moves</li>
                  <li>Click highlighted square</li>
                  <li>Watch your time!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
       {/* Game Over Modal - ADD HERE */}
      <GameOverModal
        isOpen={showGameOverModal}
        winner={gameResult.winner}
        reason={gameResult.reason}
        onPlayAgain={handleStartGame}
        playerColor={playerColor}
      />
    </div>
  );
};
