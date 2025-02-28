import {
  Box,
  VStack,
  Input,
  IconButton,
  Flex,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();
  const toast = useToast();
  const { activeConversation, setActiveConversation } = useConversation();

  // Extract all color values
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');

  // Message bubble colors
  const userBgColor = useColorModeValue('brand.500', 'brand.200');
  const botBgColor = useColorModeValue('gray.100', 'gray.700');
  const userTextColor = useColorModeValue('white', 'gray.800');
  const botTextColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeConversation]);

  const loadMessages = async (conversationId) => {
    try {
      setMessages([]); // Clear messages while loading
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        throw new Error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeConversation) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: activeConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Mettre à jour les messages
      if (data.messages) {
        setMessages(prev => [...prev, ...data.messages]);
      }

      // Mettre à jour la conversation si le titre a été modifié
      if (data.conversation) {
        setActiveConversation(data.conversation);
        window.dispatchEvent(new CustomEvent('conversationUpdated', { 
          detail: { 
            id: data.conversation.id, 
            title: data.conversation.title 
          } 
        }));
      }

      // Refocus input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    
    return (
      <Box
        maxW="80%"
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
        bg={isUser ? userBgColor : botBgColor}
        color={isUser ? userTextColor : botTextColor}
        px={4}
        py={2}
        borderRadius="lg"
        my={1}
      >
        <Text whiteSpace="pre-wrap">{message.content}</Text>
      </Box>
    );
  };

  if (!activeConversation) {
    return <Box p={4}>Chargement...</Box>;
  }

  return (
    <Flex direction="column" h="calc(100vh - 64px)" position="relative">
      <Box flex="1" overflowY="auto" position="relative">
        <VStack
          spacing={4}
          p={4}
          pb="20px"
          alignItems="stretch"
        >
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box 
        p={4} 
        borderTop="1px" 
        borderColor={borderColor}
        bg={bgColor}
        width="100%"
      >
        <form onSubmit={handleSubmit}>
          <Flex gap={2} maxW="900px" mx="auto">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={isLoading}
              bg={inputBgColor}
            />
            <IconButton
              type="submit"
              icon={<ArrowUpIcon />}
              isLoading={isLoading}
              aria-label="Envoyer"
              colorScheme="brand"
            />
          </Flex>
        </form>
      </Box>
    </Flex>
  );
};

export default Chat; 