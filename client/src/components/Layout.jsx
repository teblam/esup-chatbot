import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (loading) {
    return null; // ou un composant de chargement
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar onOpen={onOpen} />
      <Flex pt="64px">
        <Sidebar isOpen={isOpen} onClose={onClose} />
        <Box
          flex="1"
          ml={{ base: 0, md: '300px' }}
          p={4}
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 