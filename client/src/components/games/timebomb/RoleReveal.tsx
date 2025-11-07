import { motion } from 'framer-motion';
import { Eye, Shield, Skull } from 'lucide-react';

type Role = 'sherlock' | 'moriarty' | 'innocent';
type Team = 'blue' | 'red';

interface RoleRevealProps {
  role: Role;
  team: Team;
  onAcknowledge: () => void;
}

export function RoleReveal({ role, team, onAcknowledge }: RoleRevealProps) {
  const getRoleInfo = () => {
    switch (role) {
      case 'sherlock':
        return {
          icon: <Eye className="w-20 h-20 text-blue-400" />,
          title: 'Sherlock Holmes',
          description: 'Vous êtes le détective ! Trouvez et coupez 4 câbles de désamorçage pour gagner.',
          gradient: 'from-blue-600 to-blue-800'
        };
      case 'moriarty':
        return {
          icon: <Skull className="w-20 h-20 text-red-400" />,
          title: 'Moriarty',
          description: 'Vous êtes le criminel ! Faites exploser la bombe en la faisant découvrir.',
          gradient: 'from-red-600 to-red-800'
        };
      case 'innocent':
        return {
          icon: <Shield className="w-20 h-20 text-gray-400" />,
          title: team === 'blue' ? 'Innocent (Équipe Bleue)' : 'Innocent (Équipe Rouge)',
          description: team === 'blue'
            ? 'Aidez Sherlock à désamorcer la bombe !'
            : 'Aidez Moriarty à faire exploser la bombe !',
          gradient: team === 'blue' ? 'from-blue-600 to-blue-800' : 'from-red-600 to-red-800'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className={`
            bg-gradient-to-br ${roleInfo.gradient}
            rounded-2xl border-2 ${team === 'blue' ? 'border-blue-400' : 'border-red-400'}
            p-8 space-y-6 text-center shadow-2xl
          `}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="flex justify-center"
          >
            {roleInfo.icon}
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-white text-3xl font-bold">{roleInfo.title}</h2>
            <p className="text-white/90 text-lg">{roleInfo.description}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-white font-semibold mb-2">Comment jouer :</h3>
            <ul className="text-white/90 text-sm space-y-1 text-left">
              <li>• Chaque joueur a 4 câbles</li>
              <li>• À votre tour, coupez un de vos câbles</li>
              <li>• Les câbles bleus désamorcent (4 pour gagner)</li>
              <li>• Le câble rouge fait exploser la bombe</li>
              <li>• Les câbles verts sont sûrs</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAcknowledge}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30
                       py-3 px-6 rounded-lg font-semibold text-lg transition-all"
          >
            J'ai compris
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
