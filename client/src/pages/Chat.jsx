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

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const initChat = async () => {
      const conversations = await fetchConversations();
      if (conversations.length === 0) {
        const newConv = await createNewConversation();
        if (newConv) {
          await loadMessages(newConv.id);
        }
      } else {
        await loadMessages(conversations[0].id);
      }
    };

    if (user) {
      initChat();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
      });
      if (response.ok) {
        const newConversation = await response.json();
        setCurrentConversation(newConversation);
        return newConversation;
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
    return null;
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setCurrentConversation({ id: conversationId });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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
    if (!input.trim() || isLoading || !currentConversation) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');
    
    // Ajouter immédiatement le message de l'utilisateur
    const userMessageObj = {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessageObj]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversation.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessageObj = {
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessageObj]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
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
    const bgColor = useColorModeValue(
      isUser ? 'brand.500' : 'gray.100',
      isUser ? 'brand.200' : 'gray.700'
    );
    const textColor = useColorModeValue(
      isUser ? 'white' : 'gray.800',
      isUser ? 'gray.800' : 'white'
    );

    return (
      <Box
        maxW="80%"
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
        bg={bgColor}
        color={textColor}
        px={4}
        py={2}
        borderRadius="lg"
        my={1}
      >
        <Text whiteSpace="pre-wrap">{message.content}</Text>
      </Box>
    );
  };

  if (!currentConversation) {
    return <Box p={4}>Chargement...</Box>;
  }

  return (
    <Box h="calc(100vh - 80px)" display="flex" flexDirection="column">
      <VStack
        flex="1"
        overflowY="auto"
        spacing={4}
        p={4}
        alignItems="stretch"
      >
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </VStack>

      <Box p={4} borderTop="1px" borderColor="gray.200">
        <form onSubmit={handleSubmit}>
          <Flex gap={2}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={isLoading}
            />
            <IconButton
              type="submit"
              icon={<ArrowUpIcon />}
              isLoading={isLoading}
              aria-label="Envoyer"
            />
          </Flex>
        </form>
      </Box>
    </Box>
  );
};

export default Chat; 