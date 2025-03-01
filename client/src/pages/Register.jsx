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
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    uphfUsername: '',
    uphfPassword: '',
    preferredLanguage: 'fr',
    preferredRestaurant: '1184', // Restaurant Universitaire Ronzier par défaut
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, user } = useAuth();
  const toast = useToast();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await register(formData);

    if (!result.success) {
      toast({
        title: 'Erreur d\'inscription',
        description: result.error || 'Une erreur est survenue lors de l\'inscription',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Inscription réussie',
        description: 'Vous allez être redirigé vers la page principale',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }

    setIsLoading(false);
  };

  const restaurants = [
    { id: '1184', name: 'Restaurant Universitaire Ronzier' },
    { id: '1165', name: 'Restaurant Universitaire Rambouillet' },
    { id: '1175', name: 'Cafétéria IUT' },
    { id: '1176', name: 'Cafétéria Matisse' },
    { id: '1182', name: 'Mont Houy 1' },
    { id: '1183', name: 'Mont Houy 2' },
    { id: '1188', name: 'Cafétéria Mousseron' },
    { id: '1265', name: 'Cafétéria Mont Houy 1' },
    { id: '1773', name: 'Cafétéria Mont Houy 2' },
    { id: '1689', name: 'RU Rubika' },
  ];

  return (
    <Box>
      <Navbar />
      <Box 
        bg={useColorModeValue('gray.50', 'gray.900')} 
        minH="100vh"
        pt="64px" // Add padding top to account for navbar height
      >
        <Container maxW="lg" py={{ base: '24', md: '32' }} px={{ base: '0', sm: '8' }}>
          <Stack spacing="8">
            <Stack spacing="6" textAlign="center">
              <Heading
                size="xl"
                bgGradient="linear(to-r, brand.400, brand.600)"
                bgClip="text"
              >
                ESUP Chatbot
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Créez votre compte pour commencer
              </Text>
            </Stack>
            <Box
              py={{ base: '0', sm: '8' }}
              px={{ base: '4', sm: '10' }}
              bg={useColorModeValue('white', 'gray.800')}
              boxShadow={{ base: 'none', sm: 'md' }}
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              <form onSubmit={handleSubmit}>
                <Stack spacing="6">
                  <Stack spacing="5">
                    <FormControl isRequired>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <Input
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Mot de passe</FormLabel>
                      <Input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Identifiant UPHF</FormLabel>
                      <Input
                        name="uphfUsername"
                        value={formData.uphfUsername}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Mot de passe UPHF</FormLabel>
                      <Input
                        name="uphfPassword"
                        type="password"
                        value={formData.uphfPassword}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Langue préférée</FormLabel>
                      <Select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleChange}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Restaurant préféré</FormLabel>
                      <Select
                        name="preferredRestaurant"
                        value={formData.preferredRestaurant}
                        onChange={handleChange}
                      >
                        {restaurants.map(restaurant => (
                          <option key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    fontSize="md"
                    isLoading={isLoading}
                  >
                    S'inscrire
                  </Button>
                </Stack>
              </form>
            </Box>
            <Text textAlign="center" color={useColorModeValue('gray.600', 'gray.400')}>
              Déjà un compte ?{' '}
              <ChakraLink as={RouterLink} to="/login" color="brand.500">
                Se connecter
              </ChakraLink>
            </Text>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Register; 