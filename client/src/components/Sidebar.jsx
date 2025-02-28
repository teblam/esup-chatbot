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

const Sidebar = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0].id);
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
      });
      if (response.ok) {
        const newConversation = await response.json();
        setConversations([newConversation, ...conversations]);
        setSelectedConversation(newConversation.id);
        window.location.href = `/?conversation=${newConversation.id}`;
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

  const handleSelectConversation = async (conversationId) => {
    setSelectedConversation(conversationId);
    window.location.href = `/?conversation=${conversationId}`;
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const sidebarContent = (
    <VStack spacing={4} align="stretch" w="full">
      <Button
        leftIcon={<AddIcon />}
        onClick={createNewConversation}
        size="sm"
        w="full"
      >
        Nouvelle conversation
      </Button>
      
      {conversations.map((conversation) => (
        <Box
          key={conversation.id}
          p={3}
          cursor="pointer"
          borderRadius="md"
          bg={selectedConversation === conversation.id ? 'brand.50' : 'transparent'}
          _hover={{ bg: 'brand.50' }}
          onClick={() => handleSelectConversation(conversation.id)}
        >
          <Text noOfLines={2} fontSize="sm">
            {conversation.title || 'Nouvelle conversation'}
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
        bg={useColorModeValue('white', 'gray.900')}
        borderRight="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        p={4}
        position="fixed"
        h="calc(100vh - 64px)"
        overflowY="auto"
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