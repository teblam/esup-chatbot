import {
  Box,
  Flex,
  Button,
  useColorMode,
  useColorModeValue,
  useBreakpointValue,
  IconButton,
} from '@chakra-ui/react';
import { BsSun, BsMoonStars } from 'react-icons/bs';
import { MdComputer } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// on wrap le Box de chakra avec motion pour l'animation
const MotionBox = motion(Box);

const ThemeSwitch = () => {
  // hooks pour la gestion des thèmes
  const { setColorMode } = useColorMode();
  // state local pour savoir quel bouton est sélectionné - initialisé à 'system'
  const [selectedMode, setSelectedMode] = useState('system');
  
  // Afficher seulement les icônes sur les petits écrans
  const showIconsOnly = useBreakpointValue({ base: true, sm: false });
  
  // Couleurs pour les différents états - définies en dehors des branches conditionnelles
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const sliderBgColor = useColorModeValue('white', 'gray.800');
  const activeTextColor = useColorModeValue('gray.800', 'white');
  const inactiveTextColor = useColorModeValue('gray.600', 'gray.400');
  
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
    // largeur totale (en mode desktop: 300px, en mode mobile: 120px) - padding (4px) / 3 boutons
    const totalWidth = showIconsOnly ? 120 : 300;
    return (totalWidth - 4) / 3;
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
  
  // Fonction pour déterminer la couleur selon l'état actif/inactif
  const getTextColor = (mode) => {
    return selectedMode === mode ? activeTextColor : inactiveTextColor;
  };

  // Rendu conditionnel en fonction de la taille d'écran
  if (showIconsOnly) {
    return (
      <Box
        bg={bgColor}
        p="2px"
        borderRadius="xl"
        position="relative"
        width="120px"
      >
        <MotionBox
          position="absolute"
          bg={sliderBgColor}
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
        
        <Flex position="relative" gap={0}>
          <IconButton
            flex={1}
            variant="ghost"
            icon={<BsSun />}
            onClick={() => setSelectedMode('light')}
            color={getTextColor('light')}
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
            transition="color 0.2s"
            size="sm"
            height="32px"
            aria-label="Mode clair"
          />
          <IconButton
            flex={1}
            variant="ghost"
            icon={<MdComputer />}
            onClick={() => setSelectedMode('system')}
            color={getTextColor('system')}
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
            transition="color 0.2s"
            size="sm"
            height="32px"
            aria-label="Mode système"
          />
          <IconButton
            flex={1}
            variant="ghost"
            icon={<BsMoonStars />}
            onClick={() => setSelectedMode('dark')}
            color={getTextColor('dark')}
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
            transition="color 0.2s"
            size="sm"
            height="32px"
            aria-label="Mode sombre"
          />
        </Flex>
      </Box>
    );
  }
  
  // Version desktop avec texte
  return (
    <Box
      bg={bgColor}
      p="2px"
      borderRadius="xl"
      position="relative"
      width="300px"
    >
      <MotionBox
        position="absolute"
        bg={sliderBgColor}
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
      
      <Flex position="relative" gap={0}>
        <Button
          flex={1}
          variant="ghost"
          leftIcon={<BsSun />}
          onClick={() => setSelectedMode('light')}
          color={getTextColor('light')}
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
          transition="color 0.2s"
          size="sm"
          height="32px"
        >
          Clair
        </Button>

        <Button
          flex={1}
          variant="ghost"
          leftIcon={<MdComputer />}
          onClick={() => setSelectedMode('system')}
          color={getTextColor('system')}
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
          transition="color 0.2s"
          size="sm"
          height="32px"
        >
          Système
        </Button>

        <Button
          flex={1}
          variant="ghost"
          leftIcon={<BsMoonStars />}
          onClick={() => setSelectedMode('dark')}
          color={getTextColor('dark')}
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