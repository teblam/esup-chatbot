import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction pour créer une nouvelle conversation
  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ title: 'Nouvelle conversation' }),
      });

      // Vérifier d'abord si la réponse est en JSON
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Réponse non-JSON:", text);
        throw new Error("Format de réponse invalide");
      }

      if (!response.ok) {
        const error = data;
        throw new Error(error.error || 'Failed to create conversation');
      }

      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      // Vérifier d'abord si la réponse est en JSON
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Réponse non-JSON:", text);
        data = { error: "Format de réponse invalide" };
        throw new Error("Format de réponse invalide");
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Créer immédiatement la nouvelle conversation AVANT de mettre à jour l'état user
      // pour éviter que les anciennes conversations soient chargées
      const newConversation = await createNewConversation();
      
      // Modifier le localStorage pour stocker l'ID de la dernière conversation
      if (newConversation) {
        localStorage.setItem('lastConversationId', newConversation.id);
        console.log('Conversation créée et stockée dans localStorage:', newConversation.id);
      }
      
      // Mettre à jour l'utilisateur
      setUser(data);
      
      // Naviguer vers la page d'accueil
      navigate('/');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (formData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      // Vérifier d'abord si la réponse est en JSON
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Réponse non-JSON:", text);
        throw new Error("Format de réponse invalide");
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Si l'inscription réussit, on connecte l'utilisateur
      return login(formData.username, formData.password);
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    createNewConversation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 