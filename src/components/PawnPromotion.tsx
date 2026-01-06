import React from 'react';

interface PawnPromotionProps {
  square: string;
  color: 'w' | 'b';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  boardRef: React.RefObject<HTMLDivElement | null>;
  playerColor?: "white" | "black" | null;
}

const PawnPromotion: React.FC<PawnPromotionProps> = ({ 
  square, 
  color, 
  onSelect, 
  boardRef,
  playerColor 
}) => {
  const pieces: Array<{ piece: 'q' | 'r' | 'b' | 'n'; name: string; svg: string }> = [
    { 
      piece: 'q', 
      name: 'Queen', 
      svg: color === 'w' ? '/Qu.svg' : '/q.svg'
    },
    { 
      piece: 'r', 
      name: 'Rook', 
      svg: color === 'w' ? '/Ro.svg' : '/r.svg'
    },
    { 
      piece: 'b', 
      name: 'Bishop', 
      svg: color === 'w' ? '/Br.svg' : '/b.svg'
    },
    { 
      piece: 'n', 
      name: 'Knight', 
      svg: color === 'w' ? '/Kni.svg' : '/kn.svg'
    }
  ];

  // Calculate position based on square
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = parseInt(square[1]); // 1-8
  
  // Get square size (64px as per your board)
  const squareSize = 64;
  
  // Calculate positions based on player perspective
  let left: number;
  let top: number;

  if (playerColor === "black") {
    // Board is flipped for black
    // Files are reversed: h=0, g=1, ..., a=7
    left = (7 - file) * squareSize;
    
    // Ranks are reversed: 1=0, 2=1, ..., 8=7
    const displayRank = rank - 1; // Convert 1-8 to 0-7
    
    if (color === 'b') {
      // Black pawn promoting on rank 1 (displayed at top for black player)
      // Show dropdown going DOWN
      top = displayRank * squareSize;
    } else {
      // White pawn promoting on rank 8 (displayed at bottom for black player)
      // Show dropdown going UP
      top = (displayRank - 3) * squareSize;
    }
  } else {
    // Normal orientation for white
    // Files: a=0, b=1, ..., h=7
    left = file * squareSize;
    
    // Ranks: 8=0, 7=1, ..., 1=7
    const displayRank = 8 - rank;
    
    if (color === 'w') {
      // White pawn promoting on rank 8 (displayed at top)
      // Show dropdown going DOWN
      top = displayRank * squareSize;
    } else {
      // Black pawn promoting on rank 1 (displayed at bottom)
      // Show dropdown going UP
      top = (displayRank - 3) * squareSize;
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
      
      {/* Dropdown */}
      <div
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
          backgroundColor: 'transparent',
        }}
      >
        {pieces.map(({ piece, name, svg }) => (
          <button
            key={piece}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(piece);
            }}
            style={{
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              backgroundColor: 'rgba(40, 40, 40, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(60, 60, 60, 0.98)';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            title={name}
          >
            <img 
              src={svg} 
              alt={name}
              style={{
                width: '48px',
                height: '48px',
                pointerEvents: 'none'
              }}
            />
          </button>
        ))}
      </div>
    </>
  );
};

export default PawnPromotion;