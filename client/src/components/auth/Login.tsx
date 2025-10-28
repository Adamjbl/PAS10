import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface LoginProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function Login({ onSuccess, onSwitchToRegister }: LoginProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);

      login(response.user, response.token);
      toast.success(`Bienvenue, ${response.user.username}!`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Échec de la connexion';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Votre email"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Votre mot de passe"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {onSwitchToRegister && (
        <p className="mt-4 text-center text-sm text-gray-600">
          Pas encore de compte?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Inscrivez-vous ici
          </button>
        </p>
      )}
    </div>
  );
}
