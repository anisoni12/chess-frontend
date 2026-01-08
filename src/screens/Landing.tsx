import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState } from "react";
import { INIT_GAME } from "./Game";

export const Landing = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [_waiting, setWaiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "waiting") {
        setWaiting(true);
      }

      if (message.type === INIT_GAME) {
        navigate("/game");
      }
    };
  }, [socket, navigate]);

  // Loading state while connecting to socket
  if (!socket) {
    return (
      <div className="min-h-screen bg-[#312e2b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">♟️</div>
          <div className="text-white text-xl font-medium">Connecting to server...</div>
          <div className="flex gap-2 justify-center">
            <div className="w-3 h-3 bg-[#81b64c] rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-[#81b64c] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-[#81b64c] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#312e2b] text-white font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 bg-[#262421] border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">♔</span>
          <span className="font-bold text-xl tracking-tight">
            Chess<span className="text-[#81b64c]">Master</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            onClick={() => navigate('/game')}
          >
            Log In
          </button>
          <button 
            className="px-5 py-2.5 text-sm font-semibold bg-[#81b64c] hover:bg-[#9bc462] text-white rounded-lg transition-all shadow-lg shadow-[#81b64c]/20"
            onClick={() => navigate('/game')}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`py-16 lg:py-28 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                Play Chess <span className="text-[#81b64c]">Online</span>
              </h1>
              <p className="text-xl text-white/60 mb-10 max-w-md mx-auto lg:mx-0 font-normal leading-relaxed">
                Challenge players from around the world. Play, learn, and improve your game.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  className="px-9 py-4 bg-[#81b64c] hover:bg-[#9bc462] text-white font-bold text-base rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#81b64c]/30"
                  onClick={() => navigate('/game')}
                >
                  Play Online
                </button>
                <button 
                  className="px-9 py-4 border-2 border-white/15 text-white hover:bg-white/5 hover:border-white/25 font-semibold text-base rounded-xl transition-all"
                  onClick={() => navigate('/game')}
                >
                  Play Computer
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-10 mt-14 justify-center lg:justify-start">
                <div>
                  <div className="text-3xl font-extrabold text-[#81b64c] mb-1">50K+</div>
                  <div className="text-sm text-white/45 font-medium">Players Online</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#81b64c] mb-1">1M+</div>
                  <div className="text-sm text-white/45 font-medium">Games Today</div>
                </div>
              </div>
            </div>

            {/* Right - Chess Board */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[#81b64c]/15 rounded-2xl blur-3xl"></div>
                
                <div className="relative grid grid-cols-8 rounded-xl overflow-hidden shadow-2xl border-[3px] border-[#1a1816]">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    const isLight = (row + col) % 2 === 0;
                    
                    let piece = '';
                    // Back row pieces
                    if (row === 0) {
                      const pieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
                      piece = pieces[col];
                    }
                    if (row === 7) {
                      const pieces = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
                      piece = pieces[col];
                    }
                    if (row === 1) piece = '♟';
                    if (row === 6) piece = '♙';
                    
                    return (
                      <div
                        key={i}
                        className={`w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center text-3xl lg:text-4xl transition-all hover:scale-110 cursor-pointer ${
                          isLight ? 'bg-[#ebecd0]' : 'bg-[#739552]'
                        } ${row <= 1 ? 'text-gray-800' : 'text-white'}`}
                      >
                        {piece}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#262421]">
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 tracking-tight">
            Why Play on ChessMaster?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Play Instantly', desc: 'No download required. Play right in your browser.' },
              { icon: '🎯', title: 'All Skill Levels', desc: 'From beginners to grandmasters, everyone is welcome.' },
              { icon: '📊', title: 'Track Progress', desc: 'Detailed stats and game history to improve your play.' },
              { icon: '👑', title: 'Pawn Promotion', desc: 'Advanced features like pawn promotion with smooth UI.' },
              { icon: '⏱️', title: 'Time Controls', desc: 'Multiple time formats from bullet to classical games.' },
              { icon: '🎨', title: 'Beautiful Interface', desc: 'Clean, modern design inspired by the best chess platforms.' },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="p-7 rounded-xl bg-[#302d2a] border border-white/[0.03] hover:border-[#81b64c]/20 hover:bg-[#353230] transition-all duration-300 hover:scale-[1.02] group"
              >
                <span className="text-4xl mb-5 block group-hover:scale-110 transition-transform">{feature.icon}</span>
                <h3 className="text-lg font-bold mb-2.5 tracking-tight">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-normal">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-[#7dad42] to-[#89b84f] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAydjJoMnYtMmgtMnptMC0ydjJoMnYtMmgtMnptLTIgMnYyaDJ2LTJoLTJ6bTAtMnYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-5 tracking-tight">Ready to Play?</h2>
          <p className="text-lg mb-10 text-white/95 max-w-xl mx-auto font-normal leading-relaxed">
            Join thousands of players online. Create your account and start playing today!
          </p>
          <button 
            className="px-12 py-4 bg-white text-[#81b64c] hover:bg-gray-50 font-bold text-base rounded-xl transition-all hover:scale-105 hover:shadow-2xl shadow-xl"
            onClick={() => navigate('/game')}
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 bg-[#262421]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">♔</span>
              <span className="font-bold text-lg tracking-tight">
                Chess<span className="text-[#81b64c]">Master</span>
              </span>
            </div>
            
            <div className="text-white/35 text-sm font-medium">
              © 2025 ChessMaster. Play chess online.
            </div>
            
            <div className="flex gap-7 text-sm text-white/50 font-medium">
              <a href="#" className="hover:text-[#81b64c] transition-colors">About</a>
              <a href="#" className="hover:text-[#81b64c] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#81b64c] transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
