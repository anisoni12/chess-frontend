import type { Square, PieceSymbol, Color } from "chess.js";
import { useState, useRef } from "react";
import { Chess } from "chess.js";
import { MOVE } from "../screens/Game";
import PawnPromotion from "./PawnPromotion";
import { useChessSound } from "../hooks/useChessSound";

// Map piece types to full names
const getPieceFileName = (piece: PieceSymbol, color: Color): string => {
  const fileMap: Record<string, string> = {
    // White pieces (UpperCase)
    P: "Pa.svg",
    R: "Ro.svg",
    N: "Kni.svg",
    B: "Br.svg",
    Q: "Qu.svg",
    K: "Ki.svg",
    // Black pieces (LowerCase )
    p: "p.svg",
    r: "r.svg",
    n: "kn.svg",
    b: "b.svg",
    q: "q.svg",
    k: "k.svg",
  };

  const pieceLetter = color === "w" ? piece.toUpperCase() : piece.toLowerCase();
  return fileMap[pieceLetter] || `${pieceLetter}.svg`;
};

export const ChessBoard = ({
  board,
  socket,
  chess,
  lastMove,
  playerColor,
  isInCheck,
}: {
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];

  socket: WebSocket;
  chess: Chess;
  lastMove?: { from: Square; to: Square } | null;
  playerColor?: "white" | "black" | null;
  isInCheck: boolean;
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [selectedSquare, setSelectedSquare] = useState<null | Square>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const { playSound } = useChessSound();

  const findKingSquare = (): Square | null => {
    if (!isInCheck) return null;

    const turn = chess.turn();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.type === "k" && piece.color === turn) {
          const file = String.fromCharCode(97 + j);
          const rank = String.fromCharCode(56 - i);
          return (file + rank) as Square;
        }
      }
    }
    return null;
  };

  const kingInCheckSquare = findKingSquare();

  // Function to get legal moves for a selected square
  const getLegalMovesForSquare = (square: Square): Square[] => {
    const moves = chess.moves({ square, verbose: true });
    return moves.map((move) => move.to);
  };

  const isLegalMove = (square: Square): boolean => {
    return legalMoves.includes(square);
  };

  const isLastMoveSquare = (square: Square): boolean => {
    if (!lastMove) return false;
    return square === lastMove.from || square === lastMove.to;
  };

  // Handle promotion piece selection
  const handlePromotionSelect = (piece: "q" | "r" | "b" | "n") => {
    if (!pendingMove) return;

    const movePayload = {
      from: pendingMove.from,
      to: pendingMove.to,
      promotion: piece,
    };

    console.log("Sending promotion move:", movePayload);

    socket.send(
      JSON.stringify({
        type: MOVE,
        payload: movePayload,
      })
    );

    playSound('promote');

    // Clear all states
    setPromotionSquare(null);
    setPendingMove(null);
    setFrom(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleSquareClick = (square: Square, piece: any) => {
    // If promotion is active, ignore clicks
    if (promotionSquare) return;

    if (!from) {
      // First click - select the piece
      if (piece) {
        setFrom(square);
        setSelectedSquare(square);
        const legal = getLegalMovesForSquare(square);
        setLegalMoves(legal);
        console.log("Selected from:", square, "Legal moves:", legal);
      }
    } else {
      // Second click - attempt to move
      if (square === from) {
        // Clicked same square - deselect
        setFrom(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicking an empty square (not a legal move) - deselect
      if (!piece && !legalMoves.includes(square)) {
        setFrom(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicking another piece of the same color (re-select)
      if (piece && from) {
        const fromPiece = board[8 - parseInt(from[1])][from.charCodeAt(0) - 97];
        if (fromPiece && piece.color === fromPiece.color) {
          // Re-select new piece
          setFrom(square);
          setSelectedSquare(square);
          const legal = getLegalMovesForSquare(square);
          setLegalMoves(legal);
          console.log("Re-selected:", square, "Legal moves:", legal);
          return;
        }
      }

      // Check if this is a pawn promotion move
      const movingPiece = board[8 - parseInt(from[1])][from.charCodeAt(0) - 97];
      const isPawnPromotion =
        movingPiece &&
        movingPiece.type === "p" &&
        ((movingPiece.color === "w" && square[1] === "8") ||
          (movingPiece.color === "b" && square[1] === "1"));

      // Check if this move is legal
      const isMoveLegal = legalMoves.includes(square);

      if (isPawnPromotion && isMoveLegal) {
        // Show promotion dialog
        console.log("Pawn promotion detected!");
        setPendingMove({ from, to: square });
        setPromotionSquare(square);
        return; // Don't send the move yet
      }

      // Regular move (non-promotion)
      if (isMoveLegal) {
        const movePayload = {
          from,
          to: square,
        };
        console.log("Attempting move: ", movePayload);

        socket.send(
          JSON.stringify({
            type: MOVE,
            payload: movePayload,
          })
        );
        // Add sound effect
        const capturedPiece = board[8 - parseInt(square[1])][square.charCodeAt(0) - 97];
        if (capturedPiece) {
          playSound('capture');
        } else {
          playSound('move');
        }
      }

      // Clear selection
      setFrom(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const rowIndices =
    playerColor === "black"
      ? [7, 6, 5, 4, 3, 2, 1, 0] // Black: render rank 1->8 (bottom to top)
      : [0, 1, 2, 3, 4, 5, 6, 7]; // White: render rank 8->1 (top to bottom)

  return (
    <div className="text-white relative" ref={boardRef}>
      {rowIndices.map((rowIdx, displayRowIdx) => {
        // for black player, render rows in reverse order
        const row = board[rowIdx];

        const colIndices =
          playerColor === "black"
            ? [7, 6, 5, 4, 3, 2, 1, 0] // Black: render h->a (right to left)
            : [0, 1, 2, 3, 4, 5, 6, 7]; // White: render a->h (left to right)

        return (
          <div key={displayRowIdx} className="flex">
            {colIndices.map((colIdx, displayColIdx) => {
              const square = row[colIdx];

              // Calculate actual square coordinates
              const file = String.fromCharCode(97 + colIdx); // 'a' to 'h'
              const rank = String.fromCharCode(56 - rowIdx); // '8' to '1'
              const squareRepresentation = (file + rank) as Square;

              const isSelected = selectedSquare === squareRepresentation;
              const isLegal = isLegalMove(squareRepresentation);
              const isLastMove = isLastMoveSquare(squareRepresentation);
              const isKingInCheck = kingInCheckSquare === squareRepresentation;

              const pieceSrc = square
                ? `/${getPieceFileName(square.type, square.color)}`
                : null;

              // DEFINE isLightSquare
              const isLightSquare = (rowIdx + colIdx) % 2 === 0;

              let bgColor = isLightSquare ? "bg-[#ebecd0]" : "bg-[#739552]";

              if (isLastMove) {
                bgColor = isLightSquare ? "bg-yellow-400" : "bg-yellow-600";
              }

              if (isKingInCheck) {
                bgColor = "bg-red-500";
              }

              return (
                <div
                  onClick={() =>
                    handleSquareClick(squareRepresentation, square)
                  }
                  key={displayColIdx}
                  className={`w-16 h-16 cursor-pointer transition-all duration-200 relative flex items-center justify-center ${bgColor} ${
                    isSelected ? "ring-4 ring-blue-400" : ""
                  } ${
                    isKingInCheck ? "ring-4 ring-red-600 animate-pulse" : ""
                  } hover:brightness-90`}
                >
                  {/* Legal move indicator */}
                  {isLegal && !square && (
                    <div className="absolute w-4 h-4 bg-gray-700 rounded-full opacity-50 z-10 hover:opacity-70 transition-opacity" />
                  )}
                  {isLegal && square && (
                    <div className="absolute inset-0 border-[6px] border-red-500 rounded-md opacity-50 z-10" />
                  )}

                  {/* Chess Piece */}
                  {pieceSrc && (
                    <img
                      src={pieceSrc}
                      alt={`${square?.color} ${square?.type}`}
                      className="w-12 h-12 select-none z-20 relative transition-all duration-200 hover:scale-110"
                      onError={() =>
                        console.error(`Failed to load: ${pieceSrc}`)
                      }
                    />
                  )}

                  {/* Coordinates */}
                  {displayColIdx === 0 && (
                    <div className="absolute left-1 top-1 text-xs font-bold opacity-60 select-none">
                      {rank}
                    </div>
                  )}
                  {displayRowIdx === 7 && (
                    <div className="absolute right-1 bottom-1 text-xs font-bold opacity-60 select-none">
                      {file}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Pawn Promotion Dropdown */}
      {promotionSquare && pendingMove && (
        <PawnPromotion
          square={promotionSquare}
          color={
            board[8 - parseInt(pendingMove.from[1])][
              pendingMove.from.charCodeAt(0) - 97
            ]?.color || "w"
          }
          onSelect={handlePromotionSelect}
          boardRef={boardRef}
          playerColor={playerColor}
        />
      )}
    </div>
  );
};
