/**
 * Model: SecretariaInfo
 * 
 * Substitui: Prisma SecretariaInfo model
 * Collection: secretarias_info
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const secretariaInfoSchema = new Schema({
  name: {
    type: String,
    required: false,
    index: true
  },
  
  acronym: {
    type: String,
    required: false
  },
  
  email: {
    type: String,
    required: false,
    index: true
  },
  
  alternateEmail: {
    type: String,
    required: false
  },
  
  phone: {
    type: String,
    required: false
  },
  
  phoneAlt: {
    type: String,
    required: false
  },
  
  address: {
    type: String,
    required: false
  },
  
  bairro: {
    type: String,
    required: false
  },
  
  district: {
    type: String,
    required: false,
    index: true
  },
  
  notes: {
    type: String,
    required: false
  },
  
  rawData: {
    type: Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true,
  collection: 'secretarias_info'
});

// Métodos estáticos
secretariaInfoSchema.statics.findByName = function(name) {
  return this.findOne({ name: { $regex: name, $options: 'i' } });
};

secretariaInfoSchema.statics.findByDistrict = function(district) {
  return this.find({ district });
};

secretariaInfoSchema.statics.findByEmail = function(email) {
  return this.findOne({ 
    $or: [
      { email },
      { alternateEmail: email }
    ]
  });
};

// Método de instância: Formatar para resposta API
secretariaInfoSchema.methods.toAPIFormat = function() {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  return obj;
};

const SecretariaInfo = mongoose.models.SecretariaInfo || mongoose.model('SecretariaInfo', secretariaInfoSchema);

export default SecretariaInfo;

