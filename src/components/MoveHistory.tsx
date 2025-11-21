interface Move {
    from: string;
    to: string;
    san: string;
    color: "w" | "b";
}

interface MoveHistoryProps {
    moves: Move[];
}

export const MoveHistory = ({ moves }: MoveHistoryProps) => {
    const movePairs: {moveNumber: number; white?: Move; black?: Move }[] = [];

    for (let i = 0; i < moves.length; i += 2) {
        movePairs.push({
            moveNumber: Math.floor(i / 2) + 1,
            white: moves[i],
            black: moves[i + 1]
        });
    }

    
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
        <span>📜</span> Move History
      </h3>
      
      {moves.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">
          No moves yet. Start playing!
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-900">
          <div className="space-y-1">
            {movePairs.map((pair, idx) => (
              <div 
                key={idx}
                className="grid grid-cols-[40px_1fr_1fr] gap-2 text-sm hover:bg-slate-700 rounded px-2 py-1 transition-colors"
              >
                {/* Move Number */}
                <span className="text-gray-400 font-semibold">
                  {pair.moveNumber}.
                </span>
                
                {/* White's Move */}
                <span className="text-white font-mono">
                  {pair.white?.san || ''}
                </span>
                
                {/* Black's Move */}
                <span className="text-gray-300 font-mono">
                  {pair.black?.san || '...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {moves.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-gray-400 text-center">
          {moves.length} move{moves.length !== 1 ? 's' : ''} played
        </div>
      )}
    </div>
  );
};