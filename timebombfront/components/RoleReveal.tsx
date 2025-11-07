import { motion } from "motion/react";
import { Shield, Skull, User, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export type Role = "sherlock" | "moriarty" | "innocent";

interface RoleRevealProps {
  role: Role;
  team: "blue" | "red";
  onAcknowledge: () => void;
}

export function RoleReveal({ role, team, onAcknowledge }: RoleRevealProps) {
  const [revealed, setRevealed] = useState(false);

  const getRoleInfo = () => {
    switch (role) {
      case "sherlock":
        return {
          icon: <Shield className="w-20 h-20" />,
          title: "SHERLOCK HOLMES",
          description: "Vous êtes le détective ! Trouvez 4 câbles bleus pour désamorcer la bombe.",
          color: "from-blue-600 to-blue-800",
          borderColor: "border-blue-400"
        };
      case "moriarty":
        return {
          icon: <Skull className="w-20 h-20" />,
          title: "MORIARTY",
          description: "Vous êtes le criminel ! Faites exploser la bombe en révélant 1 câble rouge.",
          color: "from-red-600 to-red-800",
          borderColor: "border-red-400"
        };
      case "innocent":
        return {
          icon: <User className="w-20 h-20" />,
          title: "INNOCENT",
          description: team === "blue" 
            ? "Vous êtes dans l'équipe de Sherlock. Aidez à désamorcer la bombe !"
            : "Vous êtes dans l'équipe de Moriarty. Aidez à faire exploser la bombe !",
          color: team === "blue" ? "from-blue-600 to-blue-800" : "from-red-600 to-red-800",
          borderColor: team === "blue" ? "border-blue-400" : "border-red-400"
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full"
      >
        <div className={`bg-gradient-to-br ${roleInfo.color} rounded-2xl border-2 ${roleInfo.borderColor} p-8 space-y-6 text-center shadow-2xl`}>
          {!revealed ? (
            <>
              <div className="space-y-4">
                <div className="text-white text-2xl">Votre Rôle</div>
                <div className="flex justify-center">
                  <div className="relative">
                    <motion.div
                      className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <EyeOff className="w-16 h-16 text-white" />
                    </motion.div>
                  </div>
                </div>
                <p className="text-white/80">
                  Cliquez pour révéler votre rôle. Ne le montrez à personne !
                </p>
              </div>
              <Button
                onClick={() => setRevealed(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <Eye className="w-4 h-4 mr-2" />
                Révéler mon rôle
              </Button>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="space-y-4"
              >
                <div className="flex justify-center text-white">
                  {roleInfo.icon}
                </div>
                <div className="text-white text-3xl">{roleInfo.title}</div>
                <p className="text-white/90">
                  {roleInfo.description}
                </p>
                <div className="bg-black/20 rounded-lg p-4 text-white/80 text-sm">
                  <p>
                    <strong>Équipe:</strong> {team === "blue" ? "🔵 Sherlock" : "🔴 Moriarty"}
                  </p>
                </div>
              </motion.div>
              <Button
                onClick={onAcknowledge}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                J'ai compris
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
