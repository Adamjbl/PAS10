import Room from '../models/Room';

/**
 * Génère un code de salon unique à 4 caractères (lettres majuscules et chiffres)
 */
export const generateRoomCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 4;
  let code: string;
  let isUnique = false;

  // Boucle jusqu'à trouver un code unique
  while (!isUnique) {
    code = '';
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Vérifier si le code existe déjà
    const existingRoom = await Room.findOne({ code });
    if (!existingRoom) {
      isUnique = true;
      return code;
    }
  }

  throw new Error('Impossible de générer un code unique');
};

/**
 * Valide un code de salon (doit être 4 caractères alphanumériques)
 */
export const validateRoomCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{4}$/;
  return codeRegex.test(code);
};
