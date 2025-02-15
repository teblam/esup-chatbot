const { createApp } = Vue;

createApp({
    data() {
        return {
            messages: [],
            userInput: '',
            isLoading: false
        }
    },
    mounted() {
        // Ajouter un message de bienvenue au démarrage
        this.messages.push({
            id: Date.now(),
            role: 'assistant',
            content: 'Bonjour ! Je suis le chatbot de l\'UPHF. Comment puis-je vous aider ?'
        });
    },
    methods: {
        marked(text) {
            return window.marked.parse(text); // Utilisation correcte de marked
        },
        async sendMessage() {
            if (!this.userInput.trim()) return;

            // Ajouter le message de l'utilisateur
            this.messages.push({
                id: Date.now(),
                role: 'user',
                content: this.userInput
            });

            const userMessage = this.userInput;
            this.userInput = '';
            this.isLoading = true;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: userMessage })
                });

                const data = await response.json();

                // Ajouter la réponse du chatbot
                this.messages.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: data.response
                });
            } catch (error) {
                console.error('Erreur:', error);
                this.messages.push({
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: "Désolé, une erreur s'est produite."
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