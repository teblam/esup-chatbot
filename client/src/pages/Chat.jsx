import {
  Box,
  VStack,
  Input,
  IconButton,
  Flex,
  Text,
  useColorModeValue,
  useToast,
  Button,
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

  // Suggestions de messages prédéfinis
  const suggestions = [
    "📅 C'est quoi mes cours aujourd'hui ?",
    "🍽️ Y'a quoi a manger aujourd'hui ?",
    "⏰ Le RU ouvre a quel heure ?",
    "📍 Où se trouve le RU le plus proche ?",
    "🗓️ Quel est mon emploi du temps cette semaine ?",
    "🚪 A quelle heure ferme le RU ce soir ?",
    "💰 Combien il me reste sur ma carte IZLY ?",
    "🏢 Quels RU sont ouverts maintenant ?"
  ];

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

    // Afficher immédiatement le message de l'utilisateur
    const tempUserMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);
    
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      console.log('Response from API:', data); // Debug log
      
      // Remplacer le message temporaire par les messages sauvegardés
      if (data.messages) {
        setMessages(prev => {
          // Enlever le message temporaire
          const withoutTemp = prev.filter(msg => msg.id !== tempUserMessage.id);
          // Ajouter les messages sauvegardés
          return [...withoutTemp, ...data.messages];
        });
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
      // En cas d'erreur, on retire le message temporaire
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
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

      {messages.length === 0 && (
        <Box 
          w="full"
          mb={4}
        >
          <Box 
            maxW="900px" 
            mx="auto"
            px={4}
            position="relative"
            sx={{
              maskImage: 'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)'
            }}
          >
            <Box 
              overflowX="auto"
              position="relative"
              onMouseDown={(e) => {
                const ele = e.currentTarget;
                const startX = e.pageX + ele.scrollLeft;
                
                const onMouseMove = (e) => {
                  ele.scrollLeft = startX - e.pageX;
                  e.preventDefault();
                };
                
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
              style={{ cursor: 'grab' }}
              css={{
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                  marginX: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('gray.300', 'gray.600'),
                  borderRadius: '20px',
                  '&:hover': {
                    background: useColorModeValue('gray.400', 'gray.500')
                  }
                }
              }}
            >
              <Flex 
                gap={3} 
                pb={3}
                minW="fit-content"
                w="max-content"
              >
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    flexShrink={0}
                    size="sm"
                    px={4}
                    height="auto"
                    py={2}
                    borderRadius="xl"
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    color={useColorModeValue('gray.700', 'white')}
                    _hover={{
                      bg: useColorModeValue('gray.200', 'gray.600'),
                      transform: 'translateY(-1px)',
                    }}
                    transition="all 0.2s"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </Flex>
            </Box>
          </Box>
        </Box>
      )}

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