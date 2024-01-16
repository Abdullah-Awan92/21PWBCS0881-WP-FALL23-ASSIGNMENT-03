// database.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { comparePasswords } = require('../middleware/authMiddleware');

// MongoDB code
async function connectDb() {
  try {
    await mongoose.connect('mongodb://localhost:27017/E-commerce-Web', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

// Define MongoDB Schemas and Models
//productSchema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  productcolor: String,

});
//userSchema
const userSchema = new mongoose.Schema({
  username: String,
  phonenumber:String,
  email: String,
  password: String,
  address: String,
  phonenumber: String,
  role: { type: String, default: 'user' },
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
});

//adminSchema
const adminSchema = new mongoose.Schema({
  username: String,
  phonenumber:String,
  email: String,
  password: String,
  address: String,
  phonenumber: String,
  role: { type: String, default: 'user' },
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
});
//cartSchema
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
});

userSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.pre('save', async function (next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

//orderschema(checkout)
const orderSchema= new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered'],
    default: 'pending',
  },
  paymentMethod: { // Add this line
    type: String,
    enum: ['cod', 'card'], // Adjust the enum based on your available payment methods
    default: 'cod',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);
module.exports = { connectDb, Product, User, Admin,Cart,Order};
