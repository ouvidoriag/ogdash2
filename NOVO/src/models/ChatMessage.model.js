/**
 * Model: ChatMessage
 * 
 * Substitui: Prisma ChatMessage model
 * Collection: chat_messages
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  
  sender: {
    type: String,
    required: true,
    enum: ['user', 'cora']
  }
}, {
  timestamps: true,
  collection: 'chat_messages'
});

// Índice em createdAt para queries ordenadas
chatMessageSchema.index({ createdAt: -1 });

// Métodos estáticos
chatMessageSchema.statics.findBySender = function(sender) {
  return this.find({ sender }).sort({ createdAt: -1 });
};

chatMessageSchema.statics.findRecent = function(limit = 50) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

// Método de instância: Formatar para resposta API
chatMessageSchema.methods.toAPIFormat = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  return obj;
};

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;

