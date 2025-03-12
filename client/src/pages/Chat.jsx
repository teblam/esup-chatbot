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
  Tooltip
} from '@chakra-ui/react';
import { ArrowUpIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useConversation } from '../contexts/ConversationContext';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import React from 'react';

// Wrapper de motion pour animation
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Composant de saisie isolé
const ChatInput = React.memo(({ onSubmit, isLoading, inputBgColor, placeholderColor, inputBorderColor, inputHoverBorderColor, inputFocusBorderColor, inputFocusBoxShadow }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSubmit(inputValue);
    setInputValue('');
  };

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLoading]);

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <Flex gap={2} maxW="900px" mx="auto">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
  );
});

const Chat = () => {
  // Récupérer tous les contextes nécessaires d'abord pour maintenir l'ordre des hooks
  const { activeConversation, setActiveConversation } = useConversation();
  const toast = useToast();

  // Etats pour gérer les messages et le chargement
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isAutoScrollingRef = useRef(false);
  
  // Liste des messages suggérés
  const suggestions = [
    "📅 Quels sont mes cours cette semaine ?",
    "🍽️ Que mange-t-on à la cantine ce midi ?",
    "📍 Quels sont les services les plus proches ?",
    "🧑‍🏫 Quel est le contact de Robert Tomczak ?",
  ];

  // Couleurs pour le theme clair/sombre
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mainBgColor = useColorModeValue('gray.50', 'gray.900');
  const chatBgColor = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const suggestionBgColor = useColorModeValue('gray.100', 'gray.700');
  const suggestionTextColor = useColorModeValue('gray.700', 'gray.100');
  const suggestionHoverBgColor = useColorModeValue('gray.200', 'gray.600');
  const userBgColor = useColorModeValue('brand.500', 'brand.400');
  const botBgColor = useColorModeValue('gray.100', 'gray.600');
  const userTextColor = useColorModeValue('white', 'white');
  const botTextColor = useColorModeValue('gray.800', 'gray.100');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inputHoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const inputFocusBorderColor = useColorModeValue('brand.500', 'brand.400');
  const inputFocusBoxShadow = useColorModeValue(
    '0 0 0 1px var(--chakra-colors-brand-500)',
    '0 0 0 1px var(--chakra-colors-brand-400)'
  );
  const scrollTrackBg = useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)');
  const scrollThumbBg = useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.2)');
  const scrollThumbHoverBg = useColorModeValue('rgba(0,0,0,0.3)', 'rgba(255,255,255,0.3)');

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

  // Extraire toutes les valeurs pour le style de l'élément markdown
  const markdownCodeBg = useColorModeValue('gray.100', 'gray.700');
  const markdownPreBg = useColorModeValue('gray.100', 'gray.700');
  const markdownBlockquoteBorderColor = useColorModeValue('gray.300', 'gray.500');
  
  // Mise à jour des styles markdown avec les variables
  const updatedMarkdownStyles = {
    ...markdownStyles,
    '.markdown-content code': {
      ...markdownStyles['.markdown-content code'],
      backgroundColor: markdownCodeBg,
    },
    '.markdown-content pre': {
      ...markdownStyles['.markdown-content pre'],
      backgroundColor: markdownPreBg,
    },
    '.markdown-content blockquote': {
      ...markdownStyles['.markdown-content blockquote'],
      borderLeftColor: markdownBlockquoteBorderColor,
    },
  };

  // Fonction pour charger les messages
  const loadMessages = useCallback(async (conversationId) => {
    try {
      // Ajouter un indicateur de chargement pour éviter l'écran noir
      setIsLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        // Utiliser une transition douce pour éviter les flashs
        requestAnimationFrame(() => {
          setMessages(data);
          setIsLoading(false);
        });
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
      setIsLoading(false);
    }
  }, [toast]);

  // Scroll automatique vers le bas avec option de préserver la position
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (force || !userHasScrolled)) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  }, [userHasScrolled]);

  // Vérifier quand afficher le bouton de remontée et suivre la position de défilement
  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return; // Ignorer les événements pendant un défilement automatique
    
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      
      // Sauvegarder la position actuelle
      setScrollPosition(scrollTop);
      
      // Détecter si l'utilisateur est près du bas (moins de 100px du bas)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Mettre à jour le statut de défilement seulement si l'utilisateur a défilé significativement
      if (!isNearBottom && scrollTop > 50) {
        setUserHasScrolled(true);
      } else if (isNearBottom) {
        setUserHasScrolled(false);
      }
      
      // Afficher le bouton de remontée si on a défilé vers le bas
      setShowScrollTop(scrollTop > 300);
    }
  }, []);

  // Fonction pour remonter en haut
  const scrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      isAutoScrollingRef.current = true;
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 500);
    }
  }, []);

  // Chargement des messages quand la conversation change
  useEffect(() => {
    if (activeConversation) {
      // Vider les messages seulement après que les nouveaux soient chargés
      loadMessages(activeConversation.id);
    }
  }, [activeConversation, loadMessages]);

  // S'assurer que le gestionnaire d'événements de défilement est correctement attaché/détaché
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => {
        messagesContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Gestion de la position de défilement lors de l'ajout de nouveaux messages
  useEffect(() => {
    // Ne rien faire s'il n'y a pas de messages
    if (messages.length === 0) return;
    
    // Ne déclenche pas d'auto-scroll si un message de réflexion est en cours
    const hasThinkingMessage = messages.some(m => m.thinking);
    if (hasThinkingMessage) return;

    // Si un nouveau message de l'assistant apparaît et que l'utilisateur avait défilé vers le haut
    const lastMessage = messages[messages.length - 1];
    const isNewAssistantMessage = lastMessage && 
                                 lastMessage.role === 'assistant' && 
                                 !lastMessage.id?.toString().includes('thinking-');
    
    if (isNewAssistantMessage && userHasScrolled) {
      // Maintenir la position actuelle, ne pas scroller
      if (messagesContainerRef.current && scrollPosition > 0) {
        messagesContainerRef.current.scrollTop = scrollPosition;
      }
    } else if (!userHasScrolled || 
              (lastMessage && lastMessage.role === 'user' && lastMessage.id?.toString().includes('temp-'))) {
      // C'est un nouveau message utilisateur ou l'utilisateur n'a pas défilé - scroller en bas
      isAutoScrollingRef.current = true;
      setTimeout(() => {
        scrollToBottom(true);
        isAutoScrollingRef.current = false;
      }, 100);
    }
  }, [messages, scrollToBottom, scrollPosition, userHasScrolled]);

  // Envoi du message
  const handleSubmit = async (userMessage) => {
    if (!userMessage.trim() || isLoading || !activeConversation) return;

    setIsLoading(true);

    // Message temporaire de l'utilisateur
    const tempUserMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    
    // Ajouter le message utilisateur et désactiver le défilement manuel pour cet ajout
    setUserHasScrolled(false);
    setMessages(prev => [...prev, tempUserMessage]);
    
    // Ajouter un message temporaire de réflexion
    const thinkingMessage = {
      id: 'thinking-' + Date.now(),
      role: 'assistant',
      content: '...',
      thinking: true,
      created_at: new Date().toISOString()
    };
    
    // Ajouter après un court délai pour permettre le défilement après le message utilisateur
    setTimeout(() => {
      setMessages(prev => [...prev, thinkingMessage]);
    }, 300);
    
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
      
      if (data.messages) {
        // Supprimer les messages temporaires et ajouter les messages réels
        setMessages(prev => {
          const withoutTemp = prev.filter(msg => 
            msg.id !== tempUserMessage.id && 
            msg.id !== thinkingMessage.id
          );
          // Remplacer sans forcer de défilement
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
      setMessages(prev => prev.filter(msg => 
        msg.id !== tempUserMessage.id && 
        msg.id !== thinkingMessage.id
      ));
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
  const MessageBubble = React.memo(({ message, index }) => {
    const isUser = message.role === 'user';
    const isNew = message.id && message.id.toString().includes('temp-');
    const isThinking = message.thinking;
    
    // Extraire les valeurs de useColorModeValue en dehors de la condition
    const thinkingBgColor = useColorModeValue('gray.100', 'gray.700');
    
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
    
    // Animation spéciale pour le message de réflexion
    if (isThinking) {
      return (
        <MotionFlex
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          maxW={{ base: "90%", md: "70%" }}
          alignSelf="flex-start"
          bg={thinkingBgColor}
          p={3}
          borderRadius="lg"
          mb={3}
        >
          <Text fontSize="md" position="relative">
            <Box className="thinking-dots">
              <Text as="span" className="dot">.</Text>
              <Text as="span" className="dot">.</Text>
              <Text as="span" className="dot">.</Text>
            </Box>
            <style jsx="true">{`
              .thinking-dots {
                display: inline-block;
              }
              .dot {
                animation: wave 1.3s linear infinite;
                display: inline-block;
              }
              .dot:nth-child(2) {
                animation-delay: -1.1s;
              }
              .dot:nth-child(3) {
                animation-delay: -0.9s;
              }
              @keyframes wave {
                0%, 60%, 100% {
                  transform: initial;
                }
                30% {
                  transform: translateY(-5px);
                }
              }
            `}</style>
          </Text>
        </MotionFlex>
      );
    }
    
    return (
      <MotionBox
        maxW="80%"
        alignSelf={isUser ? 'flex-end' : 'flex-start'}
        animate={isNew ? "sending" : "visible"}
        initial="hidden"
        variants={fadeInVariants}
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
          <Box className="markdown-content" sx={updatedMarkdownStyles}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        </MotionBox>
      </MotionBox>
    );
  });

  // Page de chargement
  if (!activeConversation) {
    return (
      <Flex 
        justifyContent="center" 
        alignItems="center" 
        h="calc(100vh - 64px)" 
        bg={mainBgColor}
      >
        <Box textAlign="center" p={8}>
          <Text fontSize="lg">Chargement de vos conversations...</Text>
        </Box>
      </Flex>
    );
  }

  // Structure principale du chat
  return (
    <Flex direction="column" h="calc(100vh - 64px)" position="relative" bg={mainBgColor}>
      <Box
        ref={messagesContainerRef}
        flex="1"
        overflowY="auto"
        bg={chatBgColor}
        p={4}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        position="relative"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: scrollTrackBg,
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollThumbBg,
            borderRadius: '8px',
            '&:hover': {
              background: scrollThumbHoverBg,
            },
          },
          // Optimiser le rendu avec les propriétés en camelCase au lieu de kebab-case
          willChange: 'auto',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          transform: 'translateZ(0)',
          // Empêcher les flashs noirs sur Safari/Chrome
          backgroundAttachment: 'local'
        }}
      >
        <VStack
          spacing={4}
          p={4}
          pb="20px"
          alignItems="stretch"
          minH="100%"
          w="100%"
        >
          {messages.map((message, index) => (
            <MessageBubble key={message.id || index} message={message} index={index} />
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      
      {/* Bouton pour remonter en haut - maintenant en dehors du Box pour éviter les problèmes de rendu */}
      {showScrollTop && (
        <Box
          position="fixed" 
          zIndex={9999}
          bottom="120px"
          right="30px"
          pointerEvents="auto"
        >
          <IconButton
            icon={<ChevronUpIcon boxSize="6" />}
            borderRadius="full"
            boxShadow="lg"
            colorScheme="blue"
            size="lg"
            onClick={scrollToTop}
            opacity={0.9}
            _hover={{ opacity: 1, transform: 'scale(1.1)' }}
            _active={{ transform: 'scale(0.95)' }}
            aria-label="Remonter en haut"
            transition="all 0.2s"
          />
        </Box>
      )}

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
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          inputBgColor={inputBgColor}
          placeholderColor={placeholderColor}
          inputBorderColor={inputBorderColor}
          inputHoverBorderColor={inputHoverBorderColor}
          inputFocusBorderColor={inputFocusBorderColor}
          inputFocusBoxShadow={inputFocusBoxShadow}
        />
      </MotionFlex>
    </Flex>
  );
};

export default Chat;