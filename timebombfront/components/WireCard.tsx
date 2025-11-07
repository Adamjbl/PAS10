import { motion } from "motion/react";
import { Scissors, CheckCircle, XCircle, Shield } from "lucide-react";

export type WireType = "safe" | "bomb" | "defuse";

interface WireCardProps {
  playerId: string;
  playerName: string;
  wireIndex: number;
  revealed: boolean;
  wireType?: WireType;
  canCut: boolean;
  onCut: () => void;
}

export function WireCard({ playerId, playerName, wireIndex, revealed, wireType, canCut, onCut }: WireCardProps) {
  const getWireColor = () => {
    if (!revealed) return "bg-gradient-to-br from-slate-700 to-slate-800";
    
    switch (wireType) {
      case "defuse":
        return "bg-gradient-to-br from-blue-600 to-blue-800";
      case "bomb":
        return "bg-gradient-to-br from-red-600 to-red-800";
      case "safe":
        return "bg-gradient-to-br from-green-600 to-green-800";
      default:
        return "bg-gradient-to-br from-slate-700 to-slate-800";
    }
  };

  const getWireIcon = () => {
    if (!revealed) return null;
    
    switch (wireType) {
      case "defuse":
        return <CheckCircle className="w-12 h-12 text-white" />;
      case "bomb":
        return <XCircle className="w-12 h-12 text-white" />;
      case "safe":
        return <Shield className="w-12 h-12 text-white" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={canCut && !revealed ? { scale: 1.05 } : {}}
      className="relative"
    >
      <div
        className={`
          ${getWireColor()}
          ${canCut && !revealed ? "cursor-pointer hover:shadow-xl hover:shadow-purple-500/50" : ""}
          ${revealed ? "border-2" : "border"}
          ${wireType === "bomb" && revealed ? "border-red-400" : ""}
          ${wireType === "defuse" && revealed ? "border-blue-400" : ""}
          ${wireType === "safe" && revealed ? "border-green-400" : ""}
          ${!revealed ? "border-slate-600" : ""}
          aspect-[3/4] rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300
        `}
        onClick={canCut && !revealed ? onCut : undefined}
      >
        {!revealed ? (
          <>
            <Scissors className="w-8 h-8 text-slate-400" />
            <div className="text-slate-400 text-sm text-center">Câble {wireIndex + 1}</div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {getWireIcon()}
            </motion.div>
            <div className="text-white text-xs text-center">
              {wireType === "defuse" && "DÉSAMORÇAGE"}
              {wireType === "bomb" && "BOMBE !"}
              {wireType === "safe" && "SÛR"}
            </div>
          </>
        )}
      </div>
      
      {canCut && !revealed && (
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Scissors className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
