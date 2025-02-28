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
import { useNavigate, useSearchParams } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchConversations();
    // Get conversation ID from URL if it exists
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, [searchParams]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        // Sort conversations by creation date, newest first
        const sortedConversations = data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setConversations(sortedConversations);
        
        // If no conversation is selected and we have conversations, select the first one
        if (!selectedConversation && sortedConversations.length > 0) {
          const firstConversation = sortedConversations[0];
          setSelectedConversation(firstConversation.id);
          navigate(`/?conversation=${firstConversation.id}`);
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
        setSelectedConversation(newConversation.id);
        navigate(`/?conversation=${newConversation.id}`);
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

  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    navigate(`/?conversation=${conversationId}`);
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
          bg={selectedConversation === conversation.id ? useColorModeValue('brand.50', 'brand.900') : 'transparent'}
          _hover={{ bg: useColorModeValue('brand.50', 'brand.900') }}
          onClick={() => handleSelectConversation(conversation.id)}
        >
          <Text noOfLines={2} fontSize="sm" fontWeight={selectedConversation === conversation.id ? "medium" : "normal"}>
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
        bg={useColorModeValue('white', 'gray.900')}
        borderRight="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
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