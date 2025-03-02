import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  useToast,
  Container,
  Heading,
  Link as ChakraLink,
  useColorModeValue, // Hook pour gerer les couleurs en fonction du mode (clair/sombre)
} from '@chakra-ui/react';

// Import des hooks React et composants React Router
import { useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';

// Import des contextes personnalisés
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const Login = () => {
  // etat locaux pour gerer le formulaire
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Récupération des fonctions d'authentification depuis le contexte
  const { login, user } = useAuth();
  const toast = useToast(); // Hook pour afficher des notifications

  // Redirection si l'utilisateur est déjà connecté
  if (user) {
    return <Navigate to="/" />;
  }

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Tentative de connexion
    const result = await login(username, password);

    // Affichage d'une erreur si la connexion échoue
    if (!result.success) {
      toast({
        title: 'Erreur de connexion',
        description: 'Nom d\'utilisateur ou mot de passe incorrect',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }

    setIsLoading(false);
  };

  return (
    <Box>
      {/* Barre de navigation */}
      <Navbar />
      
      {/* Container principal avec fond adaptatif */}
      <Box 
        bg={useColorModeValue('gray.50', 'gray.900')} 
        minH="100vh"
        pt="64px" // Padding pour compenser la hauteur de la navbar
      >
        {/* Container pour centrer le contenu */}
        <Container maxW="lg" py={{ base: '24', md: '32' }} px={{ base: '0', sm: '8' }}>
          <Stack spacing="8">
            {/* Entete avec titre et sous titre */}
            <Stack spacing="6" textAlign="center">
              <Heading
                size="xl"
                bgGradient="linear(to-r, brand.400, brand.600)"
                bgClip="text"
              >
                ESUP Chatbot
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Connectez-vous pour accéder à votre assistant
              </Text>
            </Stack>

            {/* Boite du formulaire */}
            <Box
              py={{ base: '0', sm: '8' }}
              px={{ base: '4', sm: '10' }}
              bg={useColorModeValue('white', 'gray.800')}
              boxShadow={{ base: 'none', sm: 'md' }}
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              {/* Formulaire de connexion */}
              <form onSubmit={handleSubmit}>
                <Stack spacing="6">
                  <Stack spacing="5">
                    {/* Champ nom d'utilisateur */}
                    <FormControl isRequired>
                      <FormLabel htmlFor="username">Nom d'utilisateur</FormLabel>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </FormControl>

                    {/* Champ mot de passe */}
                    <FormControl isRequired>
                      <FormLabel htmlFor="password">Mot de passe</FormLabel>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </FormControl>
                  </Stack>

                  {/* Bouton de connexion */}
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    fontSize="md"
                    isLoading={isLoading}
                  >
                    Se connecter
                  </Button>
                </Stack>
              </form>
            </Box>

            {/* lien vers la page d'inscription */}
            <Text textAlign="center" color={useColorModeValue('gray.600', 'gray.400')}>
              Pas encore de compte ?{' '}
              <ChakraLink as={RouterLink} to="/register" color="brand.500">
                S'inscrire
              </ChakraLink>
            </Text>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;