import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Text,
  Input,
  IconButton,
  Flex,
  useColorModeValue,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, CheckIcon, CloseIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '../contexts/ConversationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const editInputRef = useRef(null);
  const cancelDeleteRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { activeConversation, setActiveConversation } = useConversation();

  // Extract all color values
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('brand.100', 'brand.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeTextColor = useColorModeValue('brand.700', 'brand.200');

  useEffect(() => {
    fetchConversations();
  }, []);

  // Écouter les mises à jour de conversation
  useEffect(() => {
    const handleConversationUpdate = (event) => {
      const { id, title } = event.detail;
      setConversations(prev => prev.map(conv =>
        conv.id === id ? { ...conv, title } : conv
      ));
    };

    window.addEventListener('conversationUpdated', handleConversationUpdate);
    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate);
    };
  }, []);

  // Écouter la création d'une nouvelle conversation lors de la connexion
  useEffect(() => {
    const handleNewConversationCreated = (event) => {
      const newConversation = event.detail;
      console.log('Événement newConversationCreated reçu:', newConversation);
      
      // Ajouter la nouvelle conversation à la liste
      setConversations(prev => {
        // Vérifier si la conversation existe déjà
        const exists = prev.some(conv => conv.id === newConversation.id);
        if (exists) {
          console.log('Conversation déjà existante, mise à jour uniquement');
          return prev.map(conv => 
            conv.id === newConversation.id ? newConversation : conv
          );
        } else {
          console.log('Ajout de la nouvelle conversation à la liste');
          return [newConversation, ...prev];
        }
      });
      
      // L'activer automatiquement avec un léger délai pour s'assurer que le state est à jour
      setTimeout(() => {
        console.log('Activation de la nouvelle conversation:', newConversation.id);
        setActiveConversation(newConversation);
      }, 100);
    };
    
    window.addEventListener('newConversationCreated', handleNewConversationCreated);
    return () => {
      window.removeEventListener('newConversationCreated', handleNewConversationCreated);
    };
  }, [setActiveConversation]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Vérifier le type de contenu de la réponse
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        console.error("Réponse non-JSON pour les conversations:", await response.text());
        toast({
          title: 'Erreur',
          description: 'Format de réponse invalide',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (response.ok) {
        const sortedConversations = data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setConversations(sortedConversations);
        
        // Récupérer l'ID de la dernière conversation depuis localStorage
        const lastConversationId = localStorage.getItem('lastConversationId');
        console.log('ID conversation from localStorage:', lastConversationId);
        
        // Si on a un ID dans le localStorage, chercher cette conversation
        if (lastConversationId) {
          const lastConversation = sortedConversations.find(conv => conv.id == lastConversationId);
          if (lastConversation) {
            console.log('Conversation trouvée dans la liste, activation:', lastConversation.id);
            setActiveConversation(lastConversation);
            // Supprimer l'ID après utilisation pour ne pas le réutiliser lors des chargements suivants
            localStorage.removeItem('lastConversationId');
            return;
          }
        }
        
        // Si pas de conversation spécifique à charger ou si elle n'a pas été trouvée, 
        // on prend la plus récente si elle existe
        if (!activeConversation && sortedConversations.length > 0) {
          console.log('Activation de la conversation la plus récente:', sortedConversations[0].id);
          setActiveConversation(sortedConversations[0]);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conversations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: 'Nouvelle conversation'
        })
      });
      
      // Vérifier le type de contenu de la réponse
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        console.error("Réponse non-JSON pour la création:", await response.text());
        throw new Error('Format de réponse invalide');
      }
      
      if (response.ok) {
        setConversations(prev => [data, ...prev]);
        setActiveConversation(data);
        if (window.innerWidth < 768) {
          onClose();
        }
      } else {
        throw new Error(data.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer une nouvelle conversation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEditing = (conversation, e) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || 'Nouvelle conversation');
  };

  const cancelEditing = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditingTitle('');
  };

  const handleTitleChange = async (conversationId, e) => {
    e?.stopPropagation();
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: editingTitle
        })
      });

      // Vérifier le type de contenu de la réponse
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        console.error("Réponse non-JSON pour la modification:", await response.text());
        throw new Error('Format de réponse invalide');
      }

      if (response.ok) {
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: data.title }
            : conv
        ));
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => ({ ...prev, title: data.title }));
        }
        cancelEditing();
      } else {
        throw new Error(data.error || 'Failed to update title');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le titre',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (conversation) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversation.id));
        
        // Si c'était la conversation active, on en sélectionne une autre
        if (activeConversation?.id === conversation.id) {
          const remainingConversations = conversations.filter(conv => conv.id !== conversation.id);
          if (remainingConversations.length > 0) {
            setActiveConversation(remainingConversations[0]);
          } else {
            setActiveConversation(null);
          }
        }

        toast({
          title: 'Succès',
          description: 'Conversation supprimée',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Essayer de lire une réponse JSON si disponible
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete conversation');
        } else {
          throw new Error('Failed to delete conversation');
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la conversation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const openDeleteDialog = (conversation, e) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setIsDeleteDialogOpen(true);
  };

  const sidebarContent = (
    <VStack spacing={4} align="stretch" w="full">
      <Button
        leftIcon={<AddIcon />}
        onClick={createNewConversation}
        size="sm"
        w="full"
        colorScheme="brand"
      >
        Nouvelle conversation
      </Button>
      
      {conversations.map((conversation) => (
        <Box
          key={conversation.id}
          p={3}
          cursor="pointer"
          borderRadius="md"
          bg={activeConversation?.id === conversation.id ? activeBg : 'transparent'}
          borderLeft="4px solid"
          borderLeftColor={activeConversation?.id === conversation.id ? 'brand.500' : 'transparent'}
          _hover={{ 
            bg: hoverBg,
            borderLeftColor: activeConversation?.id === conversation.id ? 'brand.500' : 'brand.200'
          }}
          onClick={() => handleSelectConversation(conversation)}
          transition="all 0.2s"
          position="relative"
          role="group"
        >
          {editingId === conversation.id ? (
            <Flex gap={2}>
              <Input
                ref={editInputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                size="sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleChange(conversation.id, e);
                  if (e.key === 'Escape') cancelEditing(e);
                }}
              />
              <IconButton
                icon={<CheckIcon />}
                size="sm"
                colorScheme="green"
                onClick={(e) => handleTitleChange(conversation.id, e)}
              />
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                colorScheme="red"
                onClick={cancelEditing}
              />
            </Flex>
          ) : (
            <>
              <Flex justify="space-between" align="center">
                <Text 
                  noOfLines={2} 
                  fontSize="sm" 
                  fontWeight={activeConversation?.id === conversation.id ? "semibold" : "normal"}
                  color={activeConversation?.id === conversation.id ? activeTextColor : undefined}
                  flex="1"
                >
                  {conversation.title || 'Nouvelle conversation'}
                </Text>
                <Flex 
                  display={{ 
                    base: activeConversation?.id === conversation.id ? 'flex' : 'none',
                    md: 'flex'
                  }}
                  opacity={{ base: 1, md: 0 }}
                  _groupHover={{ opacity: 1 }}
                  ml={2} 
                  gap={1}
                >
                  <IconButton
                    icon={<EditIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => startEditing(conversation, e)}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => openDeleteDialog(conversation, e)}
                  />
                </Flex>
              </Flex>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {formatDate(conversation.created_at)}
              </Text>
            </>
          )}
        </Box>
      ))}

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer la conversation
            </AlertDialogHeader>

            <AlertDialogBody>
              Êtes-vous sûr ? Cette action est irréversible.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={() => handleDelete(conversationToDelete)} ml={3}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );

  return (
    <>
      <Box
        display={{ base: 'none', md: 'block' }}
        w="300px"
        bg={bgColor}
        borderRight="1px"
        borderColor={borderColor}
        p={4}
        position="fixed"
        h="calc(100vh - 64px)"
        overflowY="auto"
        top="64px"
      >
        {sidebarContent}
      </Box>

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Conversations</DrawerHeader>
          <DrawerBody>
            {sidebarContent}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Sidebar; 