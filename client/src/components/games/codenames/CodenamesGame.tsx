import { useState } from 'react';
import toast from 'react-hot-toast';

interface CodenamesGameProps {
  gameState: any;
  isMyTurn: boolean;
  socketService: any;
}

export default function CodenamesGame({ gameState, isMyTurn, socketService }: CodenamesGameProps) {
  const [clueWord, setClueWord] = useState('');
  const [clueNumber, setClueNumber] = useState(1);

  const handleGiveClue = () => {
    if (!clueWord.trim()) {
      toast.error('Veuillez entrer un mot indice');
      return;
    }

    socketService.emit('codenames:give_clue', {
      roomCode: gameState.roomCode,
      clue: {
        word: clueWord.trim().toUpperCase(),
        number: clueNumber
      }
    });

    setClueWord('');
    setClueNumber(1);
  };

  const handleGuessWord = (position: number) => {
    if (!gameState.board[position].revealed) {
      socketService.emit('codenames:guess_word', {
        roomCode: gameState.roomCode,
        position
      });
    }
  };

  const handleEndTurn = () => {
    socketService.emit('codenames:end_turn', {
      roomCode: gameState.roomCode
    });
  };

  const getCardColor = (card: any) => {
    if (!card.revealed && !gameState.isSpymaster) {
      return 'bg-gray-100 hover:bg-gray-200 cursor-pointer';
    }

    if (card.revealed || gameState.isSpymaster) {
      switch (card.type) {
        case 'red':
          return card.revealed ? 'bg-red-500 text-white' : 'bg-red-200 border-2 border-red-500';
        case 'blue':
          return card.revealed ? 'bg-blue-500 text-white' : 'bg-blue-200 border-2 border-blue-500';
        case 'neutral':
          return card.revealed ? 'bg-yellow-200' : 'bg-yellow-100 border-2 border-yellow-400';
        case 'assassin':
          return card.revealed ? 'bg-black text-white' : 'bg-gray-800 border-2 border-black';
        default:
          return 'bg-gray-100';
      }
    }

    return 'bg-gray-100 hover:bg-gray-200 cursor-pointer';
  };

  const isSpymaster = gameState.playerRole === 'spymaster';
  const isAgent = gameState.playerRole === 'agent';
  const myTeam = gameState.playerTeam;
  const isMyTeamTurn = gameState.currentTeam === myTeam;

  return (
    <div className="space-y-4">
      {/* En-tête avec scores */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-6">
            <div className={`px-4 py-2 rounded-lg ${gameState.currentTeam === 'red' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-white'}`}>
              <span className="font-bold text-red-600">Équipe Rouge: {gameState.redScore || 0}</span>
            </div>
            <div className={`px-4 py-2 rounded-lg ${gameState.currentTeam === 'blue' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'}`}>
              <span className="font-bold text-blue-600">Équipe Bleue: {gameState.blueScore || 0}</span>
            </div>
          </div>
          {gameState.currentClue && (
            <div className="bg-yellow-100 px-4 py-2 rounded-lg">
              <span className="font-bold">Indice: {gameState.currentClue.word} - {gameState.currentClue.number}</span>
              <span className="ml-2 text-sm">({gameState.currentClue.guessesRemaining} restants)</span>
            </div>
          )}
        </div>

        {/* Rôle du joueur */}
        <div className="text-center mb-2">
          <span className="text-sm text-gray-600">Vous êtes </span>
          <span className={`font-bold ${myTeam === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
            {isSpymaster ? 'Espion-Maître' : 'Agent'} {myTeam === 'red' ? 'Rouge' : 'Bleu'}
          </span>
        </div>
      </div>

      {/* Plateau de jeu */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-5 gap-3">
          {gameState.board?.map((card: any, index: number) => (
            <div
              key={index}
              onClick={() => {
                if (isAgent && isMyTeamTurn && !card.revealed && gameState.currentClue) {
                  handleGuessWord(index);
                }
              }}
              className={`
                h-24 flex items-center justify-center rounded-lg p-2 transition-all
                ${getCardColor(card)}
                ${isAgent && isMyTeamTurn && !card.revealed && gameState.currentClue ? 'transform hover:scale-105' : ''}
              `}
            >
              <span className={`text-center font-bold ${card.revealed ? 'text-lg' : 'text-sm'}`}>
                {card.word}
              </span>
            </div>
          ))}
        </div>

        {/* Légende pour l'espion-maître */}
        {isSpymaster && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-semibold mb-2">Légende (visible uniquement par vous):</p>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div> Rouge
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded"></div> Bleu
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div> Neutre
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gray-800 border-2 border-black rounded"></div> Assassin
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Zone d'actions */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* Actions pour l'espion-maître */}
        {isSpymaster && isMyTurn && !gameState.currentClue && (
          <div className="space-y-3">
            <h3 className="font-bold mb-2">Donnez un indice à votre équipe:</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={clueWord}
                onChange={(e) => setClueWord(e.target.value)}
                placeholder="Mot indice"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                min="0"
                max="9"
                value={clueNumber}
                onChange={(e) => setClueNumber(parseInt(e.target.value) || 0)}
                className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleGiveClue}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Donner l'indice
              </button>
            </div>
          </div>
        )}

        {/* Actions pour les agents */}
        {isAgent && isMyTeamTurn && gameState.currentClue && (
          <div className="space-y-3">
            <p className="text-center">
              C'est votre tour! Devinez les mots correspondant à l'indice.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleEndTurn}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Terminer le tour
              </button>
            </div>
          </div>
        )}

        {/* Message d'attente */}
        {(!isMyTeamTurn || (isSpymaster && gameState.currentClue)) && (
          <div className="text-center text-gray-600">
            {!isMyTeamTurn ? (
              <p>En attente du tour de l'équipe {gameState.currentTeam === 'red' ? 'rouge' : 'bleue'}...</p>
            ) : (
              <p>En attente que vos agents devinent...</p>
            )}
          </div>
        )}
      </div>

      {/* Équipes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-red-600 mb-2">Équipe Rouge</h3>
          <div className="space-y-1">
            {gameState.teams?.red?.map((player: any) => (
              <div key={player.userId} className="text-sm">
                <span className={player.role === 'spymaster' ? 'font-bold' : ''}>
                  {player.role === 'spymaster' ? '👁️ ' : '🕵️ '}
                  {player.username}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-bold text-blue-600 mb-2">Équipe Bleue</h3>
          <div className="space-y-1">
            {gameState.teams?.blue?.map((player: any) => (
              <div key={player.userId} className="text-sm">
                <span className={player.role === 'spymaster' ? 'font-bold' : ''}>
                  {player.role === 'spymaster' ? '👁️ ' : '🕵️ '}
                  {player.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Règles rapides */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-bold mb-2">📖 Règles rapides</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• L'espion-maître donne un mot et un chiffre comme indice</li>
          <li>• Les agents doivent deviner les mots de leur couleur</li>
          <li>• Évitez les mots de l'adversaire et les mots neutres</li>
          <li>• Ne touchez JAMAIS l'assassin (noir) ou vous perdez immédiatement!</li>
          <li>• La première équipe à trouver tous ses mots gagne</li>
        </ul>
      </div>
    </div>
  );
}