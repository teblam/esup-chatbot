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
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const toast = useToast();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(username, password);

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
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <Stack spacing="6" textAlign="center">
          <Heading
            size="xl"
            bgGradient="linear(to-r, brand.400, brand.600)"
            bgClip="text"
          >
            ESUP Chatbot
          </Heading>
          <Text color="gray.600">
            Connectez-vous pour accéder à votre assistant
          </Text>
        </Stack>
        <Box
          py={{ base: '0', sm: '8' }}
          px={{ base: '4', sm: '10' }}
          bg={{ base: 'transparent', sm: 'white' }}
          boxShadow={{ base: 'none', sm: 'md' }}
          borderRadius={{ base: 'none', sm: 'xl' }}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing="6">
              <Stack spacing="5">
                <FormControl isRequired>
                  <FormLabel htmlFor="username">Nom d'utilisateur</FormLabel>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </FormControl>
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
        <Text textAlign="center">
          Pas encore de compte ?{' '}
          <ChakraLink as={RouterLink} to="/register" color="brand.500">
            S'inscrire
          </ChakraLink>
        </Text>
      </Stack>
    </Container>
  );
};

export default Login; 