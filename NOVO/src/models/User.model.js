/**
 * Model: User
 * 
 * Substitui: Prisma User model
 * Collection: users
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  password: {
    type: String,
    required: true // Hash bcrypt
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Índice único já criado automaticamente pelo unique: true

// Métodos estáticos
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Método de instância: Formatar para resposta API (sem senha)
userSchema.methods.toAPIFormat = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.password; // NUNCA retornar senha
  return obj;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

