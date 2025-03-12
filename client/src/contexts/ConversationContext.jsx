import { createContext, useContext, useState } from 'react';

const ConversationContext = createContext();

// Exporter le contexte pour qu'il puisse être importé ailleurs
export { ConversationContext };

export const ConversationProvider = ({ children }) => {
  const [activeConversation, setActiveConversation] = useState(null);

  const value = {
    activeConversation,
    setActiveConversation,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}; 