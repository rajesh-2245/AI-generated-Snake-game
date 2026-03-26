import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Gamepad2, Music, Square, RefreshCcw } from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

const TRACKS = [
  { id: 1, title: "CYBER_PULSE.MP3", artist: "SYSTEM_VOID", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "NEON_DREAM.WAV", artist: "DATA_GHOST", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "GLITCH_CORE.FLAC", artist: "ERROR_404", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

// --- Components ---

const GlitchText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`relative inline-block ${className}`}>
    <span className="relative z-10">{children}</span>
    <span className="absolute top-0 left-0 -z-10 text-neon-magenta translate-x-[1px] opacity-70 animate-[glitch_0.3s_infinite]">{children}</span>
    <span className="absolute top-0 left-0 -z-10 text-neon-cyan -translate-x-[1px] opacity-70 animate-[glitch_0.5s_infinite]">{children}</span>
  </span>
);

export default function App() {
  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Music Logic ---
  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  // --- Snake Logic ---
  const generateFood = useCallback((currentSnake: { x: number, y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setScore(0);
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || !gameStarted) return;

    setSnake((prevSnake) => {
      const head = { x: prevSnake[0].x + direction.x, y: prevSnake[0].y + direction.y };

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, gameStarted, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // Draw Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);

    // Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f3ff';
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#00f3ff' : 'rgba(0, 243, 255, 0.7)';
      ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="scanline" />
      
      {/* Background Noise/Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#00f3ff 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-4xl flex justify-between items-end mb-8 border-b border-neon-cyan/30 pb-4"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">
            <GlitchText>NEON_SNAKE_OS</GlitchText>
          </h1>
          <p className="text-xs text-neon-cyan/60 mt-1 uppercase tracking-widest">v2.0.26 // SYSTEM_STABLE</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-neon-magenta uppercase tracking-widest mb-1">Session_Score</div>
          <div className="text-3xl font-bold neon-text-cyan">{score.toString().padStart(4, '0')}</div>
        </div>
      </motion.header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Music Info */}
        <motion.section 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="p-4 border border-neon-cyan/20 bg-black/40 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan" />
            <div className="flex items-center gap-2 mb-4 text-neon-cyan">
              <Music size={16} />
              <span className="text-xs font-bold uppercase tracking-tighter">Now_Playing</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white truncate">{TRACKS[currentTrackIndex].title}</h2>
              <p className="text-sm text-neon-magenta font-bold">{TRACKS[currentTrackIndex].artist}</p>
            </div>
            
            {/* Visualizer Mockup */}
            <div className="mt-6 flex items-end gap-1 h-12">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [10, 40, 20, 45, 15] : 5 }}
                  transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                  className="flex-1 bg-neon-cyan/40"
                />
              ))}
            </div>
          </div>

          <div className="p-4 border border-neon-magenta/20 bg-black/40 backdrop-blur-sm">
            <div className="text-[10px] text-neon-magenta uppercase tracking-widest mb-2">System_Stats</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">HIGH_SCORE:</span>
                <span className="text-neon-cyan">{highScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">CPU_LOAD:</span>
                <span className="text-neon-cyan">42%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">MEM_FREE:</span>
                <span className="text-neon-cyan">128MB</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Center: Game Window */}
        <motion.section 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="lg:col-span-6 flex flex-col items-center"
        >
          <div className="relative p-2 neon-border bg-black group">
            <canvas 
              ref={canvasRef}
              width={400}
              height={400}
              className="max-w-full aspect-square cursor-none"
            />
            
            <AnimatePresence>
              {(!gameStarted || isGameOver) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                >
                  <h3 className="text-4xl font-bold mb-6">
                    <GlitchText>{isGameOver ? "GAME_OVER" : "READY_PLAYER_01"}</GlitchText>
                  </h3>
                  
                  {isGameOver && (
                    <div className="mb-8 text-center">
                      <p className="text-neon-magenta text-sm mb-1 uppercase tracking-widest">Final_Score</p>
                      <p className="text-5xl font-bold neon-text-cyan">{score}</p>
                    </div>
                  )}

                  <button 
                    onClick={resetGame}
                    className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan font-bold uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all duration-300 glitch-hover flex items-center gap-3"
                  >
                    {isGameOver ? <RefreshCcw size={20} /> : <Gamepad2 size={20} />}
                    {isGameOver ? "REBOOT_SYSTEM" : "INITIALIZE_GAME"}
                  </button>
                  
                  <p className="mt-6 text-[10px] text-white/40 uppercase tracking-[0.3em]">Use Arrow Keys to Navigate</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Game Controls Help */}
          <div className="mt-4 flex gap-4 text-[10px] text-neon-cyan/40 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Square size={8} className="fill-neon-cyan" /> Snake</span>
            <span className="flex items-center gap-1"><Square size={8} className="fill-neon-magenta" /> Data_Node</span>
          </div>
        </motion.section>

        {/* Right Sidebar: Music Controls */}
        <motion.section 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="p-6 border border-neon-cyan/20 bg-black/40 backdrop-blur-sm">
            <div className="flex justify-center gap-8 mb-8">
              <button onClick={prevTrack} className="text-white/60 hover:text-neon-cyan transition-colors">
                <SkipBack size={24} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full border-2 border-neon-cyan flex items-center justify-center text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,243,255,0.3)]"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              <button onClick={nextTrack} className="text-white/60 hover:text-neon-cyan transition-colors">
                <SkipForward size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/60">
                <Volume2 size={16} />
                <div className="flex-1 h-1 bg-white/10 relative">
                  <div className="absolute top-0 left-0 h-full w-3/4 bg-neon-cyan shadow-[0_0_5px_#00f3ff]" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Playlist_Queue</div>
                <div className="space-y-2">
                  {TRACKS.map((track, i) => (
                    <div 
                      key={track.id}
                      onClick={() => setCurrentTrackIndex(i)}
                      className={`text-xs p-2 cursor-pointer transition-colors flex justify-between items-center ${
                        currentTrackIndex === i ? 'bg-neon-cyan/10 text-neon-cyan border-l-2 border-neon-cyan' : 'hover:bg-white/5 text-white/60'
                      }`}
                    >
                      <span className="truncate">{track.title}</span>
                      {currentTrackIndex === i && isPlaying && (
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-2 bg-neon-cyan animate-pulse" />
                          <div className="w-0.5 h-3 bg-neon-cyan animate-pulse delay-75" />
                          <div className="w-0.5 h-2 bg-neon-cyan animate-pulse delay-150" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Audio Element */}
          <audio 
            ref={audioRef}
            src={TRACKS[currentTrackIndex].url}
            onEnded={nextTrack}
          />

          <div className="p-4 border border-neon-magenta/20 bg-black/40 backdrop-blur-sm text-[10px] text-white/40 leading-relaxed">
            <p className="mb-2">WARNING: SYSTEM_OVERCLOCK_DETECTED</p>
            <p>ENSURE_AUDITORY_SENSORS_ARE_CALIBRATED_FOR_MAXIMUM_BASS_RESPONSE.</p>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.5em] flex items-center gap-4">
        <span>[ CONNECTION_SECURE ]</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>[ ENCRYPTED_STREAM_ACTIVE ]</span>
      </footer>
    </div>
  );
}
