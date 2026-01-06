interface GameOverModalProps {
  isOpen: boolean;
  winner: string;
  reason: string;
  onPlayAgain: () => void;
  playerColor: 'white' | 'black' | null;
}

export const GameOverModal = ({ isOpen, winner, reason, onPlayAgain, playerColor }: GameOverModalProps) => {
  if (!isOpen) return null;

  const isWinner = 
    (winner === 'white' && playerColor === 'white') ||
    (winner === 'black' && playerColor === 'black');
  
  const isDraw = winner === 'draw';

  const getTitle = () => {
    if (isDraw) return '🤝 Draw!';
    if (isWinner) return '🎉 Victory!';
    return '😔 Defeat';
  };

  const getMessage = () => {
    if (isDraw) return 'Game drawn by agreement';
    if (reason === 'checkmate') return `Checkmate! ${winner} wins!`;
    if (reason === 'resignation') return `${winner} wins by resignation`;
    if (reason === 'timeout') return `${winner} wins on time`;
    return `${winner} wins!`;
  };

  const getBgColor = () => {
    if (isDraw) return 'from-blue-600 to-cyan-600';
    if (isWinner) return 'from-green-600 to-emerald-600';
    return 'from-red-600 to-orange-600';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getBgColor()} p-8 text-center`}>
          <h2 className="text-4xl font-bold text-white mb-2">{getTitle()}</h2>
          <div className="text-6xl mb-4">
            {isDraw ? '🤝' : isWinner ? '👑' : '💔'}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-white text-xl text-center mb-6 font-semibold">
            {getMessage()}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onPlayAgain}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              🔄 Play Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg rounded-xl transition-all"
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};