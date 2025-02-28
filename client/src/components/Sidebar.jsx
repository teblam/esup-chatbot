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
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '../contexts/ConversationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState([]);
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

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const sortedConversations = data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setConversations(sortedConversations);
        
        // Si pas de conversation active et qu'on en a, on sélectionne la première
        if (!activeConversation && sortedConversations.length > 0) {
          setActiveConversation(sortedConversations[0]);
        }
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Nouvelle conversation'
        })
      });
      
      if (response.ok) {
        const newConversation = await response.json();
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversation(newConversation);
        if (window.innerWidth < 768) {
          onClose();
        }
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
        >
          <Text 
            noOfLines={2} 
            fontSize="sm" 
            fontWeight={activeConversation?.id === conversation.id ? "semibold" : "normal"}
            color={activeConversation?.id === conversation.id ? activeTextColor : undefined}
          >
            {conversation.title || 'Nouvelle conversation'}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {formatDate(conversation.created_at)}
          </Text>
        </Box>
      ))}
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