import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext';
import { ConversationProvider } from './contexts/ConversationContext';
import theme from './theme';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <ConversationProvider>
          <AppRoutes />
        </ConversationProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
