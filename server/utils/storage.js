const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connexion à MongoDB réussie'))
    .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Schéma Utilisateur
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    uphf_username: { type: String, required: true },
    uphf_password: { type: String, required: true },
    role: { type: String, default: 'user' },
    preferred_language: { type: String, default: 'fr' },
    preferred_restaurant: String,
    created_at: { type: Date, default: Date.now }
});

// Schéma Conversation
const conversationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    created_at: { type: Date, default: Date.now }
});

// Schéma Message
const messageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    role: { type: String, required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Modèles
const User = mongoose.model('User', userSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

const storage = {
    async userExists(username) {
        const count = await User.countDocuments({ username });
        return count > 0;
    },

    async createUser(userData) {
        const { username, password, uphfUsername, uphfPassword, preferredLanguage, preferredRestaurant } = userData;
        
        const exists = await this.userExists(username);
        if (exists) {
            throw new Error('Cet utilisateur existe déjà');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            password: hashedPassword,
            uphf_username: uphfUsername,
            uphf_password: uphfPassword,
            preferred_language: preferredLanguage,
            preferred_restaurant: preferredRestaurant
        });

        await user.save();
        return { id: user._id, username };
    },

    async verifyUser(username, password) {
        const user = await User.findOne({ username });
        if (!user) return null;

        const match = await bcrypt.compare(password, user.password);
        if (!match) return null;

        // Convertir _id en id pour la compatibilité
        const userObj = user.toObject();
        userObj.id = userObj._id;
        delete userObj._id;
        return userObj;
    },

    async getUser(userId) {
        const user = await User.findById(userId);
        if (!user) return null;

        const userObj = user.toObject();
        delete userObj.password;
        userObj.id = userObj._id;
        delete userObj._id;
        return userObj;
    },

    async getAllUsers() {
        const users = await User.find();
        return users.map(user => {
            const userObj = user.toObject();
            // Fournir seulement le hash du mot de passe, pas le mot de passe complet
            userObj.password_hash = userObj.password;
            delete userObj.password;
            userObj.id = userObj._id;
            delete userObj._id;
            return userObj;
        });
    },

    async deleteUser(userId) {
        // Supprimer l'utilisateur et toutes ses conversations et messages
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        // Trouver toutes les conversations de l'utilisateur
        const conversations = await Conversation.find({ user_id: userId });
        const conversationIds = conversations.map(conv => conv._id);

        // Supprimer tous les messages associés à ces conversations
        await Message.deleteMany({ conversation_id: { $in: conversationIds } });

        // Supprimer toutes les conversations
        await Conversation.deleteMany({ user_id: userId });

        // Supprimer l'utilisateur
        await User.findByIdAndDelete(userId);

        return true;
    },

    async updateUserPassword(userId, newPassword) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return true;
    },

    async getUserUPHFCredentials(userId) {
        const user = await User.findById(userId).select('uphf_username uphf_password');
        return user;
    },

    async createConversation(userId, title = 'Nouvelle conversation') {
        const conversation = new Conversation({
            user_id: userId,
            title,
            created_at: new Date()
        });

        await conversation.save();
        const convObj = conversation.toObject();
        convObj.id = convObj._id;
        delete convObj._id;
        return convObj;
    },

    async getConversations(userId) {
        const conversations = await Conversation.find({ user_id: userId })
            .sort({ created_at: -1 });
        
        return conversations.map(conv => {
            const convObj = conv.toObject();
            convObj.id = convObj._id;
            delete convObj._id;
            return convObj;
        });
    },

    async getConversationMessages(conversationId, userId) {
        // Vérifier que la conversation appartient à l'utilisateur
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user_id: userId
        });

        if (!conversation) return [];

        const messages = await Message.find({ conversation_id: conversationId })
            .sort({ created_at: 1 });

        return messages.map(msg => {
            const msgObj = msg.toObject();
            msgObj.id = msgObj._id;
            delete msgObj._id;
            return msgObj;
        });
    },

    async addMessage(conversationId, role, content, created_at = new Date()) {
        const message = new Message({
            conversation_id: conversationId,
            role,
            content,
            created_at
        });

        await message.save();
        const msgObj = message.toObject();
        msgObj.id = msgObj._id;
        delete msgObj._id;
        return msgObj;
    },

    async getConversation(conversationId, userId) {
        const conversation = await Conversation.findOne({
            _id: conversationId,
            user_id: userId
        });

        if (!conversation) return null;

        const convObj = conversation.toObject();
        convObj.id = convObj._id;
        delete convObj._id;
        return convObj;
    },

    async updateConversationTitle(conversationId, title) {
        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { title },
            { new: true }
        );

        if (!conversation) return null;

        const convObj = conversation.toObject();
        convObj.id = convObj._id;
        delete convObj._id;
        return convObj;
    },

    async deleteConversation(conversationId) {
        // Supprimer d'abord tous les messages associés
        await Message.deleteMany({ conversation_id: conversationId });
        // Puis supprimer la conversation
        await Conversation.findByIdAndDelete(conversationId);
    }
};

module.exports = storage; 