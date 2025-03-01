import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { HamburgerIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ onOpen }) => {
  const { user, logout } = useAuth();
  
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      px={4}
      boxShadow="sm"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <IconButton
          size="md"
          icon={<HamburgerIcon />}
          aria-label="Open Menu"
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
        />

        <Text
          fontSize="2xl"
          fontWeight="bold"
          bgGradient="linear(to-r, brand.400, brand.600)"
          bgClip="text"
        >
          ESUP Chatbot
        </Text>

        <Flex alignItems="center">
          <Stack direction="row" spacing={7}>
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
                minW={0}
              >
                <Flex alignItems="center">
                  <Icon as={FiUser} mr={2} />
                  <Text>{user?.username}</Text>
                  <ChevronDownIcon ml={1} />
                </Flex>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiLogOut />} onClick={logout}>
                  Déconnexion
                </MenuItem>
              </MenuList>
            </Menu>
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;