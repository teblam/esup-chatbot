import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  IconButton,
  HStack,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiKey, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();
  const cancelRef = React.useRef();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  // Couleurs pour le mode clair/sombre
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowBgHover = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.800');

  // Rediriger si l'utilisateur n'est pas admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      toast({
        title: 'Accès refusé',
        description: "Vous n'avez pas les droits d'accès à l'administration.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [user, navigate, toast]);

  // Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des utilisateurs');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Gérer la suppression d'un utilisateur
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast({
        title: 'Utilisateur supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
      setUserToDelete(null);
    }
  };

  // Gérer le changement de mot de passe
  const handleChangePassword = async () => {
    if (!userToChangePassword || !newPassword) return;

    try {
      const response = await fetch(`/api/admin/users/${userToChangePassword.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du changement de mot de passe');
      }

      toast({
        title: 'Mot de passe modifié',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onPasswordClose();
      setUserToChangePassword(null);
      setNewPassword('');
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    onDeleteOpen();
  };

  const openChangePassword = (user) => {
    setUserToChangePassword(user);
    onPasswordOpen();
  };

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={8}>
      <Container maxW="container.xl" bg={bgColor} p={6} borderRadius="md" boxShadow="sm" color={textColor}>
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Administration des utilisateurs</Heading>
          <Button leftIcon={<FiArrowLeft />} onClick={() => navigate('/')} colorScheme="blue">
            Retour au chat
          </Button>
        </Flex>

        <Box overflowX="auto" borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th>Nom d'utilisateur</Th>
                <Th>Identifiant UPHF</Th>
                <Th>Mot de passe (hashé)</Th>
                <Th>Rôle</Th>
                <Th>Date de création</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(user => (
                <Tr key={user.id} _hover={{ bg: tableRowBgHover }}>
                  <Td>{user.username}</Td>
                  <Td>{user.uphf_username}</Td>
                  <Td>{user.password_hash}</Td>
                  <Td>{user.role}</Td>
                  <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<FiKey />}
                        aria-label="Changer mot de passe"
                        size="sm"
                        colorScheme="blue"
                        onClick={() => openChangePassword(user)}
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        aria-label="Supprimer"
                        colorScheme="red"
                        size="sm"
                        onClick={() => confirmDelete(user)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Dialogue de confirmation pour la suppression */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={modalBg}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Supprimer l'utilisateur
              </AlertDialogHeader>

              <AlertDialogBody>
                Êtes-vous sûr de vouloir supprimer l'utilisateur {userToDelete?.username} ? Cette action est irréversible.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Annuler
                </Button>
                <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                  Supprimer
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Modal pour changer le mot de passe */}
        <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
          <ModalOverlay />
          <ModalContent bg={modalBg}>
            <ModalHeader>Changer le mot de passe</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Nouveau mot de passe pour {userToChangePassword?.username}</FormLabel>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Nouveau mot de passe"
                  bg={useColorModeValue('white', 'gray.700')}
                  borderColor={borderColor}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleChangePassword}>
                Enregistrer
              </Button>
              <Button variant="ghost" onClick={onPasswordClose}>Annuler</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Admin; 