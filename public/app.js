const { createApp } = Vue;

createApp({
    data() {
        return {
            user: null,
            isRegistering: false,
            authForm: {
                username: '',
                password: '',
                uphfUsername: '',
                uphfPassword: '',
                preferredLanguage: 'fr',
                preferredRestaurant: '1184'
            },
            conversations: [],
            currentConversation: null,
            messages: [],
            userInput: '',
            isLoading: false,
            showSidebar: true
        }
    },
    async mounted() {
        await this.checkAuth();
        if (this.user) {
            await this.loadConversations();
            if (this.conversations.length === 0) {
                await this.createNewConversation();
            } else {
                await this.selectConversation(this.conversations[0]);
            }
        }
    },
    methods: {
        async checkAuth() {
            try {
                const response = await fetch('/api/me');
                if (response.ok) {
                    this.user = await response.json();
                }
            } catch (error) {
                console.error('Erreur de vérification de l\'authentification:', error);
            }
        },
        async login() {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.authForm.username,
                        password: this.authForm.password
                    })
                });

                if (response.ok) {
                    this.user = await response.json();
                    await this.loadConversations();
                    if (this.conversations.length === 0) {
                        await this.createNewConversation();
                    } else {
                        await this.selectConversation(this.conversations[0]);
                    }
                } else {
                    const error = await response.json();
                    alert(error.message || 'Erreur de connexion');
                }
            } catch (error) {
                console.error('Erreur de connexion:', error);
                alert('Erreur de connexion');
            }
        },
        async register() {
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.authForm)
                });

                if (response.ok) {
                    alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                    this.isRegistering = false;
                    this.authForm = {
                        username: '',
                        password: '',
                        uphfUsername: '',
                        uphfPassword: '',
                        preferredLanguage: 'fr',
                        preferredRestaurant: '1184'
                    };
                } else {
                    const error = await response.json();
                    alert(error.message || "Erreur lors de l'inscription");
                }
            } catch (error) {
                console.error('Erreur d\'inscription:', error);
                alert('Erreur d\'inscription');
            }
        },
        async logout() {
            try {
                await fetch('/api/logout', { method: 'POST' });
                this.user = null;
                this.conversations = [];
                this.currentConversation = null;
                this.messages = [];
            } catch (error) {
                console.error('Erreur de déconnexion:', error);
            }
        },
        async loadConversations() {
            try {
                const response = await fetch('/api/conversations');
                if (response.ok) {
                    this.conversations = await response.json();
                }
            } catch (error) {
                console.error('Erreur de chargement des conversations:', error);
            }
        },
        async createNewConversation() {
            try {
                const response = await fetch('/api/conversations', {
                    method: 'POST'
                });
                if (response.ok) {
                    const conversation = await response.json();
                    this.conversations.unshift(conversation);
                    await this.selectConversation(conversation);
                }
            } catch (error) {
                console.error('Erreur création conversation:', error);
            }
        },
        async selectConversation(conversation) {
            try {
                const response = await fetch(`/api/conversations/${conversation.id}/messages`);
                if (response.ok) {
                    this.messages = await response.json();
                    this.currentConversation = conversation;
                }
            } catch (error) {
                console.error('Erreur chargement messages:', error);
            }
        },
        toggleSidebar() {
            this.showSidebar = !this.showSidebar;
        },
        marked(text) {
            return window.marked.parse(text);
        },
        async sendMessage() {
            if (!this.userInput.trim() || !this.currentConversation) return;

            const userMessage = this.userInput;
            this.userInput = '';
            
            // Ajouter le message de l'utilisateur localement
            const userMessageObj = {
                role: 'user',
                content: userMessage,
                created_at: new Date().toISOString()
            };
            this.messages.push(userMessageObj);

            this.isLoading = true;

            try {
                // Envoyer le message au serveur
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        message: userMessage,
                        conversationId: this.currentConversation.id
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    // Ajouter la réponse du chatbot
                    const assistantMessageObj = {
                        role: 'assistant',
                        content: data.response,
                        created_at: new Date().toISOString()
                    };
                    this.messages.push(assistantMessageObj);
                } else {
                    throw new Error('Erreur serveur');
                }
            } catch (error) {
                console.error('Erreur:', error);
                this.messages.push({
                    role: 'assistant',
                    content: "Désolé, une erreur s'est produite.",
                    created_at: new Date().toISOString()
                });
            } finally {
                this.isLoading = false;
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            }
        },
        scrollToBottom() {
            const container = this.$refs.messagesContainer;
            container.scrollTop = container.scrollHeight;
        }
    }
}).mount('#app'); 