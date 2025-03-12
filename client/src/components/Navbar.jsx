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
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { FiUser, FiSettings, FiKey } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeSwitch from './ThemeSwitch';
import { useState } from 'react';

const Navbar = ({ onOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen: openModal, onClose } = useDisclosure();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/login');
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Envoi de la demande de changement de mot de passe");
      
      // Simplifier la requête en utilisant le format exact attendu par le backend
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });
      
      // Vérifier d'abord le statut de la réponse
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }
      
      // La réponse est OK, continuer
      const data = await response.json();
      console.log("Réponse:", data);

      // Réinitialiser les champs
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Fermer le modal
      onClose();
      
      // Notification de succès
      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error("Erreur de changement de mot de passe:", error);
      toast({
        title: "Erreur",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
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
                {user.role === 'admin' && (
                  <MenuItem 
                    icon={<FiSettings />}
                    colorScheme="purple"
                    onClick={() => navigate('/admin')}
                  >
                    Administration
                  </MenuItem>
                )}
                <MenuItem 
                  icon={<FiKey />} 
                  onClick={openModal}
                >
                  Changer de mot de passe
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  Se déconnecter
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Flex>

      {/* Modal pour changer de mot de passe */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Changer de mot de passe</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Mot de passe actuel</FormLabel>
              <Input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Nouveau mot de passe</FormLabel>
              <Input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Confirmez le nouveau mot de passe</FormLabel>
              <Input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="brand" 
              mr={3} 
              onClick={handlePasswordChange}
              isLoading={isSubmitting}
            >
              Enregistrer
            </Button>
            <Button onClick={onClose}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Navbar;