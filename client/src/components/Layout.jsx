import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Box h="100vh" overflow="hidden">
      <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
        <Navbar onOpen={onOpen} />
      </Box>
      <Flex h="100vh" pt="64px">
        <Sidebar isOpen={isOpen} onClose={onClose} />
        <Box
          flex="1"
          ml={{ base: 0, md: '300px' }}
          overflowY="auto"
          h="calc(100vh - 64px)"
          bg="gray.50"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 