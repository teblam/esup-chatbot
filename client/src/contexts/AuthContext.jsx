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

      // Mettre à jour l'utilisateur
      setUser(data);
      
      // Vérifier d'abord s'il existe une conversation récente vide
      try {
        // Récupérer toutes les conversations de l'utilisateur
        const conversationsResponse = await fetch('/api/conversations', {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (conversationsResponse.ok) {
          const conversations = await conversationsResponse.json();
          
          // Trier les conversations par date (de la plus récente à la plus ancienne)
          const sortedConversations = conversations.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          // Vérifier si la dernière conversation existe et est vide
          if (sortedConversations.length > 0) {
            const lastConversation = sortedConversations[0];
            
            // Récupérer les messages de cette conversation
            const messagesResponse = await fetch(`/api/conversations/${lastConversation.id}/messages`, {
              headers: { 
                'Accept': 'application/json'
              }
            });
            
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              
              // Si la conversation est vide (pas de messages), l'utiliser plutôt que d'en créer une nouvelle
              if (messages.length === 0) {
                console.log('Utilisation de la dernière conversation vide:', lastConversation.id);
                localStorage.setItem('lastConversationId', lastConversation.id);
                navigate('/');
                return { success: true };
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des conversations:', error);
        // Continuer normalement si la vérification échoue
      }
      
      // Créer une nouvelle conversation seulement si nécessaire
      const newConversation = await createNewConversation();
      
      // Modifier le localStorage pour stocker l'ID de la dernière conversation
      if (newConversation) {
        localStorage.setItem('lastConversationId', newConversation.id);
        console.log('Nouvelle conversation créée et stockée dans localStorage:', newConversation.id);
      }
      
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