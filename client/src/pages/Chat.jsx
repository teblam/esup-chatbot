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
import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Wrapper de motion pour animation
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const Chat = () => {
  // Etats pour gerer les messages et le chargement
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();
  const { activeConversation, setActiveConversation } = useConversation();

  // Liste des messages suggeres
  const suggestions = [
    "📅 Quels sont mes cours cette semaine ?",
    "🍽️ Que mange-t-on à la cantine ce midi ?",
    "📍 Quels sont les services les plus proches ?",
    "🧑‍🏫 Quel est le contact de Robert Tomczak ?",
  ];

  // Couleurs pour le theme clair/sombre
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mainBgColor = useColorModeValue('gray.50', 'gray.900'); // Fond principal plus foncé
  const chatBgColor = useColorModeValue('white', 'gray.800'); // Zone de chat plus claire
  const inputBgColor = useColorModeValue('white', 'gray.700');
  // Nouvelles couleurs pour les suggestions
  const suggestionBgColor = useColorModeValue('gray.100', 'gray.700');
  const suggestionTextColor = useColorModeValue('gray.700', 'gray.100');
  const suggestionHoverBgColor = useColorModeValue('gray.200', 'gray.600');

  // Couleurs des bulles de messages
  const userBgColor = useColorModeValue('brand.500', 'brand.400');
  const botBgColor = useColorModeValue('gray.100', 'gray.600');
  const userTextColor = useColorModeValue('white', 'white');
  const botTextColor = useColorModeValue('gray.800', 'gray.100');
  
  // Couleurs pour les inputs et placeholders
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inputHoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const inputFocusBorderColor = useColorModeValue('brand.500', 'brand.400');
  const inputFocusBoxShadow = useColorModeValue(
    '0 0 0 1px var(--chakra-colors-brand-500)',
    '0 0 0 1px var(--chakra-colors-brand-400)'
  );

  // Styles pour les éléments markdown
  const markdownStyles = {
    '.markdown-content': {
      whiteSpace: 'pre-wrap',
      lineHeight: '1.2',
    },
    '.markdown-content p': {
      marginBottom: '0.25rem',
    },
    '.markdown-content ul, .markdown-content ol': {
      paddingLeft: '1.5rem',
      marginBottom: '0.25rem',
      lineHeight: '1.2',
    },
    '.markdown-content li': {
      marginBottom: '0.1rem',
    },
    '.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4': {
      fontWeight: 'bold',
      marginTop: '0.25rem',
      marginBottom: '0.25rem',
    },
    '.markdown-content strong': {
      fontWeight: 'bold',
    },
    '.markdown-content em': {
      fontStyle: 'italic',
    },
    '.markdown-content h1': {
      fontSize: '1.5rem',
    },
    '.markdown-content h2': {
      fontSize: '1.3rem',
    },
    '.markdown-content h3': {
      fontSize: '1.1rem',
    },
    '.markdown-content code': {
      fontFamily: 'monospace',
      backgroundColor: useColorModeValue('gray.100', 'gray.700'),
      padding: '0.1rem 0.3rem',
      borderRadius: '0.2rem',
    },
    '.markdown-content pre': {
      backgroundColor: useColorModeValue('gray.100', 'gray.700'),
      padding: '0.5rem',
      borderRadius: '0.3rem',
      overflow: 'auto',
      marginBottom: '0.5rem',
    },
    '.markdown-content blockquote': {
      borderLeftWidth: '3px',
      borderLeftColor: useColorModeValue('gray.300', 'gray.500'),
      paddingLeft: '0.5rem',
      fontStyle: 'italic',
      marginBottom: '0.5rem',
    },
  };

  // Fonction pour charger les messages
  const loadMessages = useCallback(async (conversationId) => {
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
  }, [toast]);

  // Chargement des messages quand la conversation change
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeConversation, loadMessages]);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Envoi du message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeConversation) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');

    // Message temporaire
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

  // Composant pour afficher un message avec animation
  const MessageBubble = ({ message, index }) => {
    const isUser = message.role === 'user';
    const isNew = message.id && message.id.toString().includes('temp-');
    
    // Animation pour les nouveaux messages
    const fadeInVariants = {
      hidden: { 
        opacity: 0, 
        y: 10,
        scale: 0.95
      },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: { 
          type: "spring", 
          damping: 15,
          stiffness: 300,
          delay: 0.05 * index % 5 // Légère cascade pour les anciens messages
        } 
      },
      sending: {
        opacity: [1, 0.7, 1],
        scale: [1, 0.97, 1],
        transition: { 
          repeat: isNew ? Infinity : 0,
          duration: 1.5
        }
      }
    };
    
    // Animation spéciale pour les messages utilisateur
    const userMessageVariants = {
      initial: { x: 20, opacity: 0 },
      animate: { 
        x: 0, 
        opacity: 1,
        transition: { 
          type: "spring", 
          damping: 12,
          stiffness: 200,
        }
      }
    };
    
    // Animation spéciale pour les messages assistant
    const assistantMessageVariants = {
      initial: { x: -20, opacity: 0 },
      animate: { 
        x: 0, 
        opacity: 1,
        transition: { 
          type: "spring", 
          damping: 12,
          stiffness: 200,
        }
      }
    };
    
    return (
      <MotionBox
        maxW="80%"
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
        animate={isNew ? "sending" : "visible"}
        initial="hidden"
        variants={fadeInVariants}
        layout
      >
        <MotionBox
          bg={isUser ? userBgColor : botBgColor}
          color={isUser ? userTextColor : botTextColor}
          px={4}
          py={2}
          borderRadius="lg"
          my={1}
          boxShadow="sm"
          variants={isUser ? userMessageVariants : assistantMessageVariants}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.01 }}
        >
          <Box className="markdown-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        </MotionBox>
      </MotionBox>
    );
  };

  // Page de chargement
  if (!activeConversation) {
    return <Box p={4} bg={mainBgColor}>Chargement...</Box>;
  }

  // Structure principale du chat
  return (
    <Flex direction="column" h="calc(100vh - 64px)" position="relative" bg={mainBgColor}>
      <Box flex="1" overflowY="auto" position="relative" bg={chatBgColor} sx={markdownStyles}>
        <VStack
          spacing={4}
          p={4}
          pb="20px"
          alignItems="stretch"
        >
          {messages.map((message, index) => (
            <MessageBubble key={message.id || index} message={message} index={index} />
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {messages.length === 0 && (
        <Box 
          w="full"
          bg={chatBgColor}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Box 
            maxW="900px" 
            mx="auto"
            px={4}
            position="relative"
            sx={{
              maskImage: 'linear-gradient(to right, transparent, black 120px, black calc(100% - 120px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 120px, black calc(100% - 120px), transparent)'
            }}
          >
            <Box 
              overflowX="auto"
              position="relative"
              onMouseDown={(e) => {
                const ele = e.currentTarget;
                const startX = e.pageX + ele.scrollLeft;
                let isDragging = false;
                
                const onMouseMove = (e) => {
                  isDragging = true;
                  ele.scrollLeft = startX - e.pageX;
                  e.preventDefault();
                };
                
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                  
                  if (isDragging) {
                    const preventClick = (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      document.removeEventListener('click', preventClick, true);
                    };
                    document.addEventListener('click', preventClick, true);
                  }
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
              style={{ cursor: 'grab' }}
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              <Flex 
                gap={3} 
                pb={4}
                pt={2}
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
                    bg={suggestionBgColor}
                    color={suggestionTextColor}
                    _hover={{
                      bg: suggestionHoverBgColor,
                      transform: 'translateY(-1px)',
                    }}
                    transition="all 0.2s"
                    onClick={async () => {
                      if (isLoading || !activeConversation) return;
                      
                      setIsLoading(true);
                      const tempUserMessage = {
                        id: 'temp-' + Date.now(),
                        role: 'user',
                        content: suggestion,
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
                            message: suggestion,
                            conversationId: activeConversation.id,
                          }),
                        });

                        const data = await response.json();
                        
                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to get AI response');
                        }
                        
                        if (data.messages) {
                          setMessages(prev => {
                            const withoutTemp = prev.filter(msg => msg.id !== tempUserMessage.id);
                            return [...withoutTemp, ...data.messages];
                          });
                        }

                        if (data.conversation) {
                          setActiveConversation(data.conversation);
                          window.dispatchEvent(new CustomEvent('conversationUpdated', { 
                            detail: { 
                              id: data.conversation.id, 
                              title: data.conversation.title 
                            } 
                          }));
                        }
                      } catch (error) {
                        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
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

      <MotionFlex 
        p={4} 
        bg={chatBgColor}
        width="100%"
        borderTop={messages.length > 0 ? "1px" : "none"}
        borderColor={borderColor}
        boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
        position="relative"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Flex gap={2} maxW="900px" mx="auto">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={isLoading}
              bg={inputBgColor}
              _placeholder={{ color: placeholderColor }}
              borderColor={inputBorderColor}
              _hover={{
                borderColor: inputHoverBorderColor
              }}
              _focus={{
                borderColor: inputFocusBorderColor,
                boxShadow: inputFocusBoxShadow
              }}
            />
            <MotionBox
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton
                type="submit"
                icon={<ArrowUpIcon />}
                isLoading={isLoading}
                aria-label="Envoyer"
                colorScheme="brand"
              />
            </MotionBox>
          </Flex>
        </form>
      </MotionFlex>
    </Flex>
  );
};

export default Chat;