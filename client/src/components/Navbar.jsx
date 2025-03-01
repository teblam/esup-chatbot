import {
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeSwitch from './ThemeSwitch';

const Navbar = ({ onOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      px={4}
      boxShadow="sm"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        {user && (
          <IconButton
            size="md"
            icon={<HamburgerIcon />}
            aria-label="Open Menu"
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
          />
        )}

        <Text
          fontSize="2xl"
          fontWeight="bold"
          bgGradient="linear(to-r, brand.400, brand.600)"
          bgClip="text"
          ml={user ? { base: 2, md: 0 } : 0}
        >
          ESUP Chatbot
        </Text>

        <Flex alignItems="center" gap={4}>
          <ThemeSwitch />
          
          {user && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiUser />}
                variant="ghost"
                aria-label="Menu utilisateur"
              />
              <MenuList>
                <MenuItem onClick={handleLogout}>
                  Se déconnecter
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;