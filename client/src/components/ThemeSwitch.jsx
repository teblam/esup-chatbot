import {
  Box,
  Flex,
  Button,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { BsSun, BsMoonStars } from 'react-icons/bs';
import { MdComputer } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// on wrap le Box de chakra avec motion pour l'animation
const MotionBox = motion(Box);

const ThemeSwitch = () => {
  // hook pour gerer le theme light/dark
  const { colorMode, setColorMode } = useColorMode();
  // state local pour savoir quel bouton est selectionne - initialisé à 'system'
  const [selectedMode, setSelectedMode] = useState('system');
  
  useEffect(() => {
    // quand on choisit system, on check le theme du pc
    // sinon on met direct le theme choisi (light/dark)
    if (selectedMode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorMode(isDark ? 'dark' : 'light');
    } else {
      setColorMode(selectedMode);
    }
  }, [selectedMode, setColorMode]);

  const getButtonWidth = () => {
    // largeur totale (300px) - padding (4px) / 3 boutons
    return (300 - 4) / 3;
  };

  const getPositionX = () => {
    // calcule la position du selecteur selon le mode
    const buttonWidth = getButtonWidth();
    switch (selectedMode) {
      case 'light': return 0;
      case 'system': return buttonWidth;
      case 'dark': return buttonWidth * 2;
      default: return buttonWidth;
    }
  };
  
  return (
    // conteneur principal avec fond gris/fonce
    <Box
      bg={useColorModeValue('gray.100', 'gray.700')}
      p="2px"
      borderRadius="xl"
      position="relative"
      width="300px"
    >
      {/* le selecteur qui slide avec l'animation */}
      <MotionBox
        position="absolute"
        bg={useColorModeValue('white', 'gray.800')}
        width={`${getButtonWidth()}px`}
        height="calc(100% - 4px)"
        borderRadius="lg"
        initial={false}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30 
        }}
        animate={{ 
          x: getPositionX()
        }}
        boxShadow="0 1px 2px rgba(0, 0, 0, 0.1)"
        top="2px"
        left="2px"
      />
      
      {/* les 3 boutons clair/system/sombre */}
      <Flex position="relative" gap={0}>
        {/* bouton mode clair */}
        <Button
          flex={1}
          variant="ghost"
          leftIcon={<BsSun />}
          onClick={() => setSelectedMode('light')}
          color={selectedMode === 'light' ? useColorModeValue('gray.800', 'white') : useColorModeValue('gray.600', 'gray.400')}
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
          transition="color 0.2s"
          size="sm"
          height="32px"
        >
          Clair
        </Button>

        {/* bouton mode systeme */}
        <Button
          flex={1}
          variant="ghost"
          leftIcon={<MdComputer />}
          onClick={() => setSelectedMode('system')}
          color={selectedMode === 'system' ? useColorModeValue('gray.800', 'white') : useColorModeValue('gray.600', 'gray.400')}
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
          transition="color 0.2s"
          size="sm"
          height="32px"
        >
          Système
        </Button>

        {/* bouton mode sombre */}
        <Button
          flex={1}
          variant="ghost"
          leftIcon={<BsMoonStars />}
          onClick={() => setSelectedMode('dark')}
          color={selectedMode === 'dark' ? useColorModeValue('gray.800', 'white') : useColorModeValue('gray.600', 'gray.400')}
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
          transition="color 0.2s"
          size="sm"
          height="32px"
        >
          Sombre
        </Button>
      </Flex>
    </Box>
  );
};

export default ThemeSwitch; 