import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { RotateCcw, Settings, Save, Trash2, X, Upload, Image as ImageIcon, Palette, Clock, ArrowLeft, Infinity, User, LogOut } from 'lucide-react';

const PIECE_NAMES = {
  'K': 'Weißer König', 'Q': 'Weiße Dame', 'R': 'Weißer Turm', 'B': 'Weißer Läufer', 'N': 'Weißer Springer', 'P': 'Weißer Bauer',
  'k': 'Schwarzer König', 'q': 'Schwarze Dame', 'r': 'Schwarzer Turm', 'b': 'Schwarzer Läufer', 'n': 'Schwarzer Springer', 'p': 'Schwarzer Bauer'
};

const initBoard = () => {
  return [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];
};

// Safe LocalStorage Helper (Verhindert Absturz im Private Mode)
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('LocalStorage nicht verfügbar:', e);
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('LocalStorage nicht verfügbar:', e);
  }
};

const AssetManager = ({ onClose, currentAssets, onUpdate }) => {
  const [assets, setAssets] = useState({
    ...currentAssets,
    theme: currentAssets.theme || { light: '#94a3b8', dark: '#1e293b' },
    clock: currentAssets.clock || { bg: null, color: '#ffffff' }
  });

  const handleBoardUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAssets(prev => ({ ...prev, board: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handlePieceUpload = (e, piece) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAssets(prev => ({
          ...prev,
          pieces: { ...prev.pieces, [piece]: ev.target.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMassUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const name = file.name.toLowerCase();
      let pieceKey = null;
      
      // Schwarz: beginnt mit 'b' gefolgt von Figur-Buchstabe (p,r,n,b,k,q)
      const blackMatch = name.match(/^b([prnbkq])/);
      if (blackMatch) {
        pieceKey = blackMatch[1]; // 'p', 'r', 'n', 'b', 'k', 'q'
      } else {
        // Weiß: beginnt direkt mit Figur-Buchstabe
        const whiteMatch = name.match(/^([prnbkq])/);
        if (whiteMatch) {
          pieceKey = whiteMatch[1].toUpperCase(); // 'P', 'R', 'N', 'B', 'K', 'Q'
        }
      }

      if (pieceKey) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAssets(prev => ({
            ...prev,
            pieces: { ...prev.pieces, [pieceKey]: ev.target.result }
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const saveAndClose = () => {
    // Speichert alles lokal im Browser
    safeSetItem('chessAssets', JSON.stringify(assets));
    onUpdate(assets);
    onClose();
  };

  const clearAll = () => {
    if (confirm('Wirklich alle Grafiken zurücksetzen?')) {
      const empty = { board: null, pieces: {}, theme: { light: '#94a3b8', dark: '#1e293b' }, clock: { bg: null, color: '#ffffff' } };
      try { localStorage.removeItem('chessAssets'); } catch(e) {}
      setAssets(empty);
      onUpdate(empty);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 p-4 text-white w-full max-w-2xl mx-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings /> Asset Manager</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full"><X /></button>
      </div>

      <div className="w-full bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2"><ImageIcon size={18}/> Schachbrett (SVG empfohlen)</h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-slate-900 border border-slate-600 rounded flex items-center justify-center overflow-hidden">
            {assets.board ? <img src={assets.board} className="w-full h-full object-cover pixelated" /> : <span className="text-xs text-slate-500">Leer</span>}
          </div>
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2 transition-colors">
            <Upload size={16} /> Upload
            <input type="file" className="hidden" accept="image/*,.svg" onChange={handleBoardUpload} />
          </label>
        </div>
      </div>

      <div className="w-full bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2"><ImageIcon size={18}/> Figuren (SVG empfohlen)</h3>
        
        <div className="mb-4">
            <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors w-full border border-slate-600 border-dashed">
                <Upload size={16} /> 
                <span>Massenupload (Dateien auswählen)</span>
                <input type="file" className="hidden" multiple accept="image/*,.svg" onChange={handleMassUpload} />
            </label>
            <p className="text-xs text-slate-500 mt-2 text-center">Dateinamen: "x..." für Weiß, "bx..." für Schwarz (x = p,r,n,b,k,q)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.keys(PIECE_NAMES).map(piece => (
            <div key={piece} className="bg-slate-900 p-3 rounded border border-slate-700 flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-2">{PIECE_NAMES[piece]}</span>
              <div className="w-12 h-12 mb-2 flex items-center justify-center bg-slate-800 rounded">
                {assets.pieces[piece] ? 
                  <img src={assets.pieces[piece]} className="w-full h-full object-contain pixelated" /> : 
                  <span className="text-lg font-bold">{piece}</span>
                }
              </div>
              <label className="cursor-pointer text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded flex items-center gap-1 w-full justify-center">
                <Upload size={12} /> Ändern
                <input type="file" className="hidden" accept="image/*,.svg" onChange={(e) => handlePieceUpload(e, piece)} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2"><Palette size={18}/> Farbschema</h3>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase font-bold">Helle Felder</label>
            <div className="flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-700">
              <input 
                type="color" 
                value={assets.theme.light}
                onChange={(e) => setAssets(prev => ({ ...prev, theme: { ...prev.theme, light: e.target.value } }))}
                className="bg-transparent w-8 h-8 cursor-pointer border-none p-0"
              />
              <span className="text-xs font-mono text-slate-300">{assets.theme.light}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 uppercase font-bold">Dunkle Felder</label>
            <div className="flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-700">
              <input 
                type="color" 
                value={assets.theme.dark}
                onChange={(e) => setAssets(prev => ({ ...prev, theme: { ...prev.theme, dark: e.target.value } }))}
                className="bg-transparent w-8 h-8 cursor-pointer border-none p-0"
              />
              <span className="text-xs font-mono text-slate-300">{assets.theme.dark}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2"><Clock size={18}/> Schachuhr</h3>
        <div className="flex gap-6 items-center">
             <div className="flex flex-col gap-2 items-center">
                <div className="w-20 h-20 bg-slate-900 border border-slate-600 rounded flex items-center justify-center overflow-hidden relative">
                    {assets.clock?.bg ? <img src={assets.clock.bg} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-500">Kein Bild</span>}
                </div>
                <label className="cursor-pointer text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1 transition-colors">
                    <Upload size={12} /> Bg
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setAssets(prev => ({...prev, clock: {...prev.clock, bg: ev.target.result}}));
                            reader.readAsDataURL(file);
                        }
                    }} />
                </label>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 uppercase font-bold">Zahlenfarbe</label>
                <div className="flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-700">
                  <input 
                    type="color" 
                    value={assets.clock?.color || '#ffffff'}
                    onChange={(e) => setAssets(prev => ({ ...prev, clock: { ...prev.clock, color: e.target.value } }))}
                    className="bg-transparent w-8 h-8 cursor-pointer border-none p-0"
                  />
                </div>
             </div>
        </div>
      </div>

      <div className="flex gap-4 w-full">
        <button onClick={saveAndClose} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
          <Save size={20} /> Speichern & Zurück
        </button>
        <button onClick={clearAll} className="px-4 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="mt-6 text-slate-500 text-xs text-center">
        Bilder werden lokal im Browser gespeichert.
      </div>
    </div>
  );
};

const App = () => {
  const [board, setBoard] = useState(initBoard());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState('white');
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [enPassant, setEnPassant] = useState(null);
  const [castling, setCastling] = useState({
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  });
  const [showCMS, setShowCMS] = useState(false);
  const [customAssets, setCustomAssets] = useState({ 
    board: null, 
    pieces: {},
    theme: { light: '#94a3b8', dark: '#1e293b' },
    clock: { bg: null, color: '#ffffff' }
  });
  const [dragStart, setDragStart] = useState(null);
  const dragTimeoutRef = useRef(null);
  const [boardSize, setBoardSize] = useState(192);
  const [gameStarted, setGameStarted] = useState(false);
  const [initialTime, setInitialTime] = useState(600);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [hasFirstMoveHappened, setHasFirstMoveHappened] = useState(false);

  useEffect(() => {
    // Lädt Assets direkt aus dem LocalStorage beim Start
    const savedAssets = safeGetItem('chessAssets');
    if (savedAssets) {
      try {
        const data = JSON.parse(savedAssets);
        setCustomAssets(prev => ({ 
          ...prev, 
          ...data, 
          theme: data.theme || prev.theme,
          clock: data.clock || prev.clock
        }));
      } catch (e) {
        console.error("Fehler beim Laden der lokalen Assets:", e);
      }
    }
  }, []);

  useEffect(() => {
    const calculateSize = () => {
      // Wir nutzen clientWidth/Height für die exakte innere Größe ohne Scrollbars
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      
      // Prüfen, ob wir im Portrait-Modus sind (Uhr rutscht nach unten) oder Bildschirm schmal ist
      const isPortrait = vw < 800 || vh > vw;
      
      let availableW, availableH;
      
      if (isPortrait) {
        // Mobile/Portrait:
        // Wir brauchen 384px für 2x Skalierung. Ein iPhone hat 390px.
        // Alter Puffer (16px) war zu groß (390-16 = 374 < 384 -> Fallback auf 1x).
        // Neuer Puffer: 4px (2px pro Seite).
        availableW = vw - 4;
        // Höhe: Header (~60px) + Footer/Uhr (~160px) abziehen. Im Zen-Modus weniger.
        availableH = initialTime === null ? vh - 100 : vh - 220;
      } else {
        // Desktop/Landscape:
        // Platz für Uhr/Sidebar abziehen, außer im Zen-Modus
        availableW = initialTime === null ? vw - 40 : vw - 220;
        availableH = vh - 100;
      }
      
      const max = Math.min(availableW, availableH);
      
      // Basisgröße: 8 Felder * 24 Pixel = 192 Pixel
      let scale = Math.floor(max / 192);
      if (scale < 1) scale = 1;
      
      setBoardSize(scale * 192);
    };

    // ResizeObserver ist zuverlässiger als window.resize auf Mobiles
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(calculateSize);
      observer.observe(document.body);
      calculateSize();
      return () => observer.disconnect();
    } else {
      // Fallback für ältere Browser
      window.addEventListener('resize', calculateSize);
      calculateSize();
      return () => window.removeEventListener('resize', calculateSize);
    }
  }, [initialTime]);

  useEffect(() => {
    let interval = null;
    if (gameStarted && !gameOver && board.length > 0 && initialTime !== null && hasFirstMoveHappened) {
      interval = setInterval(() => {
        if (turn === 'white') {
          setWhiteTime(t => {
            if (t <= 0) {
               setGameOver('Zeit abgelaufen - Schwarz gewinnt!');
               return 0;
            }
            return t - 1;
          });
        } else {
          setBlackTime(t => {
            if (t <= 0) {
               setGameOver('Zeit abgelaufen - Weiß gewinnt!');
               return 0;
            }
            return t - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [turn, gameOver, gameStarted, initialTime, hasFirstMoveHappened]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPieceLabel = (piece) => {
    return piece.toUpperCase();
  };

  const isWhite = (piece) => piece && piece === piece.toUpperCase();
  const isValidPosition = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

  const getPawnMoves = (row, col, piece, currentBoard) => {
    const moves = [];
    const dir = isWhite(piece) ? -1 : 1;
    const startRow = isWhite(piece) ? 6 : 1;

    if (isValidPosition(row + dir, col) && !currentBoard[row + dir][col]) {
      moves.push([row + dir, col]);
      if (row === startRow && !currentBoard[row + 2 * dir][col]) {
        moves.push([row + 2 * dir, col]);
      }
    }

    for (let dc of [-1, 1]) {
      if (isValidPosition(row + dir, col + dc) && currentBoard[row + dir][col + dc]) {
        if (isWhite(piece) !== isWhite(currentBoard[row + dir][col + dc])) {
          moves.push([row + dir, col + dc]);
        }
      }
    }

    if (enPassant && row + dir === enPassant[0] && 
        (col + 1 === enPassant[1] || col - 1 === enPassant[1])) {
      moves.push([enPassant[0], enPassant[1]]);
    }

    return moves;
  };

  const getKnightMoves = (row, col, currentBoard) => {
    const moves = [];
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    
    for (let [dr, dc] of deltas) {
      const nr = row + dr, nc = col + dc;
      if (isValidPosition(nr, nc)) {
        const target = currentBoard[nr][nc];
        if (!target || isWhite(currentBoard[row][col]) !== isWhite(target)) {
          moves.push([nr, nc]);
        }
      }
    }
    return moves;
  };

  const getSlidingMoves = (row, col, directions, currentBoard) => {
    const moves = [];
    const piece = currentBoard[row][col];
    
    for (let [dr, dc] of directions) {
      let nr = row + dr, nc = col + dc;
      while (isValidPosition(nr, nc)) {
        const target = currentBoard[nr][nc];
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (isWhite(piece) !== isWhite(target)) {
            moves.push([nr, nc]);
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
    return moves;
  };

  const getBishopMoves = (row, col, currentBoard) => {
    return getSlidingMoves(row, col, [[-1,-1],[-1,1],[1,-1],[1,1]], currentBoard);
  };

  const getRookMoves = (row, col, currentBoard) => {
    return getSlidingMoves(row, col, [[-1,0],[1,0],[0,-1],[0,1]], currentBoard);
  };

  const getQueenMoves = (row, col, currentBoard) => {
    return [...getBishopMoves(row, col, currentBoard), ...getRookMoves(row, col, currentBoard)];
  };

  const getKingMoves = (row, col, currentBoard, checkCastling = true) => {
    const moves = [];
    const piece = currentBoard[row][col];
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (isValidPosition(nr, nc)) {
          const target = currentBoard[nr][nc];
          if (!target || isWhite(piece) !== isWhite(target)) {
            moves.push([nr, nc]);
          }
        }
      }
    }

    if (checkCastling) {
      const color = isWhite(piece) ? 'white' : 'black';
      if (castling[color].kingside && !currentBoard[row][5] && !currentBoard[row][6]) {
        if (!isSquareAttacked(row, 4, color, currentBoard) && 
            !isSquareAttacked(row, 5, color, currentBoard) && 
            !isSquareAttacked(row, 6, color, currentBoard)) {
          moves.push([row, 6]);
        }
      }
      if (castling[color].queenside && !currentBoard[row][3] && !currentBoard[row][2] && !currentBoard[row][1]) {
        if (!isSquareAttacked(row, 4, color, currentBoard) && 
            !isSquareAttacked(row, 3, color, currentBoard) && 
            !isSquareAttacked(row, 2, color, currentBoard)) {
          moves.push([row, 2]);
        }
      }
    }

    return moves;
  };

  const getPieceMoves = (row, col, currentBoard, checkCastling = true) => {
    const piece = currentBoard[row][col];
    if (!piece) return [];

    const type = piece.toLowerCase();
    switch (type) {
      case 'p': return getPawnMoves(row, col, piece, currentBoard);
      case 'n': return getKnightMoves(row, col, currentBoard);
      case 'b': return getBishopMoves(row, col, currentBoard);
      case 'r': return getRookMoves(row, col, currentBoard);
      case 'q': return getQueenMoves(row, col, currentBoard);
      case 'k': return getKingMoves(row, col, currentBoard, checkCastling);
      default: return [];
    }
  };

  const isSquareAttacked = (row, col, byColor, currentBoard) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (!piece) continue;
        
        const pieceColor = isWhite(piece) ? 'white' : 'black';
        if (pieceColor !== byColor) continue;

        const moves = getPieceMoves(r, c, currentBoard, false);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) {
          return true;
        }
      }
    }
    return false;
  };

  const findKing = (color, currentBoard) => {
    const king = color === 'white' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c] === king) return [r, c];
      }
    }
    return null;
  };

  const isInCheck = (color, testBoard) => {
    const kingPos = findKing(color, testBoard);
    if (!kingPos) return false;
    
    const opponent = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(kingPos[0], kingPos[1], opponent, testBoard);
  };

  const isMoveLegal = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    const captured = newBoard[toRow][toCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    if (piece.toLowerCase() === 'p' && enPassant && 
        toRow === enPassant[0] && toCol === enPassant[1] && !captured) {
      newBoard[fromRow][toCol] = null;
    }

    const color = isWhite(piece) ? 'white' : 'black';
    return !isInCheck(color, newBoard);
  };

  const handleDragStart = (e, row, col) => {
    e.dataTransfer.setData('move', JSON.stringify([row, col]));
    e.dataTransfer.effectAllowed = 'move';
    
    // Figur auswählen, um gültige Züge anzuzeigen
    const piece = board[row][col];
    if (piece && ((turn === 'white' && isWhite(piece)) || (turn === 'black' && !isWhite(piece)))) {
      setSelected([row, col]);
      const moves = getPieceMoves(row, col, board, true).filter(([r, c]) => 
        isMoveLegal(row, col, r, c)
      );
      setValidMoves(moves);

      // Verzögerung, damit das Drag-Image vom Browser erstellt werden kann, bevor die Figur ausgeblendet wird
      dragTimeoutRef.current = setTimeout(() => setDragStart([row, col]), 0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('move');
    if (data) {
      const [fromRow, fromCol] = JSON.parse(data);
      handleSquareClick(row, col); // Nutzt die existierende Logik für den Zug
    }
  };

  const handleDragEnd = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    setDragStart(null);
    setSelected(null);
    setValidMoves([]);
  };

  const handleSquareClick = (row, col) => {
    if (gameOver) return;
    setDragStart(null);

    if (selected) {
      const [sr, sc] = selected;
      
      if (validMoves.some(([r, c]) => r === row && c === col)) {
        if (isMoveLegal(sr, sc, row, col)) {
          makeMove(sr, sc, row, col);
        }
      }
      
      setSelected(null);
      setValidMoves([]);
    } else {
      const piece = board[row][col];
      if (piece && ((turn === 'white' && isWhite(piece)) || (turn === 'black' && !isWhite(piece)))) {
        setSelected([row, col]);
        const moves = getPieceMoves(row, col, board, true).filter(([r, c]) => 
          isMoveLegal(row, col, r, c)
        );
        setValidMoves(moves);
      }
    }
  };

  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    if (!hasFirstMoveHappened) setHasFirstMoveHappened(true);
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    const captured = newBoard[toRow][toCol];
    
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    let newEnPassant = null;

    if (piece.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
      newBoard[toRow][toCol] = isWhite(piece) ? 'Q' : 'q';
    }

    if (piece.toLowerCase() === 'p' && Math.abs(fromRow - toRow) === 2) {
      newEnPassant = [fromRow + (toRow - fromRow) / 2, toCol];
    }

    if (piece.toLowerCase() === 'p' && enPassant && 
        toRow === enPassant[0] && toCol === enPassant[1] && !captured) {
      newBoard[fromRow][toCol] = null;
    }

    if (piece.toLowerCase() === 'k' && Math.abs(fromCol - toCol) === 2) {
      if (toCol === 6) {
        newBoard[fromRow][5] = newBoard[fromRow][7];
        newBoard[fromRow][7] = null;
      } else if (toCol === 2) {
        newBoard[fromRow][3] = newBoard[fromRow][0];
        newBoard[fromRow][0] = null;
      }
    }

    const newCastling = JSON.parse(JSON.stringify(castling));
    if (piece === 'K') {
      newCastling.white = { kingside: false, queenside: false };
    } else if (piece === 'k') {
      newCastling.black = { kingside: false, queenside: false };
    }
    if (piece === 'R' && fromRow === 7 && fromCol === 7) newCastling.white.kingside = false;
    if (piece === 'R' && fromRow === 7 && fromCol === 0) newCastling.white.queenside = false;
    if (piece === 'r' && fromRow === 0 && fromCol === 7) newCastling.black.kingside = false;
    if (piece === 'r' && fromRow === 0 && fromCol === 0) newCastling.black.queenside = false;

    setBoard(newBoard);
    setEnPassant(newEnPassant);
    setCastling(newCastling);
    
    const nextTurn = turn === 'white' ? 'black' : 'white';
    setTurn(nextTurn);

    setTimeout(() => checkGameOver(newBoard, nextTurn), 0);
  };

  const checkGameOver = (testBoard, color) => {
    let hasLegalMove = false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = testBoard[r][c];
        if (!piece) continue;
        
        const pieceColor = isWhite(piece) ? 'white' : 'black';
        if (pieceColor !== color) continue;

        const moves = getPieceMoves(r, c, testBoard, true);
        for (let [tr, tc] of moves) {
          const simBoard = testBoard.map(row => [...row]);
          const movingPiece = simBoard[r][c];
          const targetPiece = simBoard[tr][tc];
          
          simBoard[tr][tc] = movingPiece;
          simBoard[r][c] = null;

          if (movingPiece.toLowerCase() === 'p' && enPassant && 
              tr === enPassant[0] && tc === enPassant[1] && !targetPiece) {
            simBoard[r][tc] = null;
          }

          if (!isInCheck(color, simBoard)) {
            hasLegalMove = true;
            break;
          }
        }
        if (hasLegalMove) break;
      }
      if (hasLegalMove) break;
    }

    if (!hasLegalMove) {
      if (isInCheck(color, testBoard)) {
        setGameOver(color === 'white' ? 'Schwarz gewinnt!' : 'Weiß gewinnt!');
      } else {
        setGameOver('Patt - Unentschieden!');
      }
    }
  };

  const resetGame = (overrideTime) => {
    setBoard(initBoard());
    setSelected(null);
    setTurn('white');
    setValidMoves([]);
    setGameOver(null);
    setEnPassant(null);
    setCastling({
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    });
    setDragStart(null);
    setHasFirstMoveHappened(false);
    
    const timeToSet = overrideTime !== undefined ? overrideTime : initialTime;
    if (timeToSet !== null) {
      setWhiteTime(timeToSet);
      setBlackTime(timeToSet);
    }
  };

  const startGame = (time) => {
    setInitialTime(time);
    setGameStarted(true);
    resetGame(time);
  };

  if (board.length === 0) return null;

  if (showCMS) {
    return <AssetManager onClose={() => setShowCMS(false)} currentAssets={customAssets} onUpdate={setCustomAssets} />;
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
        <h1 className="text-5xl font-bold mb-8">pixichess</h1>
        <div className="bg-slate-700 p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <Clock /> Spielmodus wählen
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => startGame(60)} className="bg-slate-600 hover:bg-blue-600 p-4 rounded-lg font-bold transition-colors">1 min (Bullet)</button>
            <button onClick={() => startGame(180)} className="bg-slate-600 hover:bg-blue-600 p-4 rounded-lg font-bold transition-colors">3 min (Blitz)</button>
            <button onClick={() => startGame(300)} className="bg-slate-600 hover:bg-blue-600 p-4 rounded-lg font-bold transition-colors">5 min (Blitz)</button>
            <button onClick={() => startGame(600)} className="bg-slate-600 hover:bg-blue-600 p-4 rounded-lg font-bold transition-colors">10 min (Rapid)</button>
            <button onClick={() => startGame(1800)} className="bg-slate-600 hover:bg-blue-600 p-4 rounded-lg font-bold transition-colors">30 min (Classical)</button>
            <button onClick={() => startGame(null)} className="bg-slate-600 hover:bg-green-600 p-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"><Infinity size={20}/> Zen Modus</button>
          </div>
          <button onClick={() => setShowCMS(true)} className="mt-6 w-full bg-slate-800 hover:bg-slate-600 p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-slate-300">
             <Settings size={18} /> Einstellungen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-2">
      <style>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -webkit-crisp-edges;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
      <div className="mb-2 w-full max-w-md flex justify-between items-center">
        <button onClick={() => setGameStarted(false)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition-colors"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-white">pixichess</h1>
        <button onClick={() => setShowCMS(true)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 transition-colors"><Settings size={18} /></button>
      </div>

      <div className="flex flex-row gap-4 items-start justify-center flex-wrap">
      <div className="bg-slate-700 p-3 rounded-xl shadow-2xl">
        <div className="mb-2 text-center">
          <div className="text-lg font-semibold text-white mb-1">
            Am Zug: {turn === 'white' ? 'Weiß' : 'Schwarz'}
          </div>
          {gameOver && (
            <div className="text-xl font-bold text-yellow-400 mb-2">
              {gameOver}
            </div>
          )}
        </div>

        <div className="block rounded-lg overflow-hidden mx-auto" style={{ 
          width: boardSize, 
          height: boardSize
        }}>
          <div className="grid grid-cols-8 grid-rows-8 relative w-full h-full pixelated" style={{ 
            backgroundImage: customAssets.board ? `url(${customAssets.board})` : 'none',
            backgroundSize: 'cover'
          }}>
            {board.map((row, rowIdx) => (
              row.map((piece, colIdx) => {
                const isLight = (rowIdx + colIdx) % 2 === 0;
                const isSelected = selected && selected[0] === rowIdx && selected[1] === colIdx;
                const isValidMove = validMoves.some(([r, c]) => r === rowIdx && c === colIdx);
                const isTurn = piece && ((turn === 'white' && isWhite(piece)) || (turn === 'black' && !isWhite(piece)));
                
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    onClick={() => handleSquareClick(rowIdx, colIdx)}
                    onDragStart={(e) => handleDragStart(e, rowIdx, colIdx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, rowIdx, colIdx)}
                    onDragEnd={handleDragEnd}
                    draggable={!!isTurn}
                    className={`
                      flex items-center justify-center cursor-pointer relative
                      ${isSelected ? 'ring-2 ring-inset ring-blue-500 z-20' : ''}
                      ${isValidMove ? 'ring-2 ring-inset ring-green-400 z-10' : ''}
                      hover:opacity-80 transition-all
                    `}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      backgroundColor: customAssets.board ? 'transparent' : (isLight ? customAssets.theme.light : customAssets.theme.dark)
                    }}
                  >
                    {piece && (
                      <div className={`w-full h-full flex items-center justify-center ${(dragStart && dragStart[0] === rowIdx && dragStart[1] === colIdx) ? 'opacity-0' : 'opacity-100'}`}>
                      {
                      customAssets.pieces[piece] ? (
                        <img src={customAssets.pieces[piece]} className="w-full h-full object-contain pixelated" />
                      ) : (
                        <span 
                          className={`font-bold text-xs ${isWhite(piece) ? 'text-white' : 'text-black'}`}
                          style={{ textShadow: isWhite(piece) ? '0 0 2px black' : 'none' }}
                        >
                          {getPieceLabel(piece)}
                        </span>
                      )
                      }
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        <button
          onClick={() => resetGame()}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={18} />
          Neues Spiel
        </button>
      </div>

      {initialTime !== null && (
      <div className="flex flex-col gap-4 p-4 rounded-xl shadow-xl h-full justify-center min-w-[140px] bg-slate-700"
           style={{
               backgroundColor: customAssets.clock?.bg ? 'transparent' : '#334155',
               backgroundImage: customAssets.clock?.bg ? `url(${customAssets.clock.bg})` : 'none',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               color: customAssets.clock?.color || '#ffffff'
           }}>
         <div className={`text-center p-3 rounded-lg transition-all ${turn === 'black' ? 'bg-white/10 ring-2 ring-yellow-400 scale-105' : 'opacity-70'}`}>
            <div className="text-xs uppercase tracking-wider mb-1">Schwarz</div>
            <div className="text-3xl font-mono font-bold">{formatTime(blackTime)}</div>
         </div>

         <div className="h-px bg-white/20 w-full my-2"></div>

         <div className={`text-center p-3 rounded-lg transition-all ${turn === 'white' ? 'bg-white/10 ring-2 ring-yellow-400 scale-105' : 'opacity-70'}`}>
            <div className="text-xs uppercase tracking-wider mb-1">Weiß</div>
            <div className="text-3xl font-mono font-bold">{formatTime(whiteTime)}</div>
         </div>
      </div>
      )}
      </div>

      <div className="mt-2 text-slate-400 text-xs text-center max-w-md">
        <p>Pixel-Perfect Scaling (192px Basis)</p>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);