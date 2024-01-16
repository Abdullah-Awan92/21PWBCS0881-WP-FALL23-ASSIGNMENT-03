// index.js

const express = require('express');
const app = express();
const session = require('express-session');
const { connectDb, Product, User, Admin, Cart,Order } = require('./models/database');
const { authUser, authAdmin, comparePasswords } = require('./middleware/authMiddleware');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const port = 3000;

connectDb();

// Express Middleware
app.use(express.json());
app.use(session({ secret: '#7yj2338sm8!ghg@yege7', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport Configuration
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  const user = await User.findOne({ email });

  if (!user || !(await comparePasswords(password, user.password))) {
    return done(null, false, { message: 'Incorrect email or password.' });
  }

  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Express Routes

// Authentication Routes
app.get('/', (req, res) => {
  res.send('Welcome! If you want to sign up, go to the path (/signup)');
});

//singup route
app.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const newUser = new User({ username, email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User is successfully created' });
  } catch (error) {
    res.status(500).json({ message: 'Error, please try again', error: error.message });
  }
});

//login route
app.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'Login successful', user: req.user });
});

//add product route
app.post('/products', authAdmin, async (req, res) => {
  const { name, price, description,productcolor } = req.body;

  try {
    const newProduct = new Product({name, price,description,productcolor });
    await newProduct.save();
    res.status(201).json({ message: 'Product is added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding the product', error: error.message });
  }
});


//see products route
app.get('/products', authUser, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Product not found', error: error.message });
  }
});

//get single product
app.get('/products/:productId', authUser, async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error ', error: error.message });
  }
});

//Cart routes
app.get('/cart/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const cartItems = await Cart.find({ user: userId }).populate('product');

    if (!cartItems) {
      return res.status(404).json({ error: 'Cart not found for the user' });
    }

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/cart/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const existingCartItem = await Cart.findOne({ user: userId, product: productId });

    if (existingCartItem) {
      existingCartItem.quantity += 1;
      await existingCartItem.save();
      res.json(existingCartItem);
    } else {
      const cartItem = new Cart({
        user: userId,
        product: productId,
        quantity: 1,
      });

      await cartItem.save();
      res.json(cartItem);
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//deletecart
app.delete('/delcart/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const result = await Cart.deleteOne({ user: userId, product: productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found in the user\'s cart' });
    }

    res.json({ message: 'Product deleted from the cart successfully' });
  } catch (error) {
    console.error('Error deleting product from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//checkout route
app.post('/checkout/:userId', async (req, res) => {
  const { userId } = req.params;
  const { paymentMethod } = req.body;

  try {
    const cartItems = await Cart.find({ user: userId }).populate('product');

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ error: 'Cart is empty' });
    }

    const orderProducts = cartItems.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const totalPrice = orderProducts.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    const selectedPaymentMethod = paymentMethod || 'cod';

    const order = new Order({
      user: userId,
      products: orderProducts,
      totalPrice,
      paymentMethod: selectedPaymentMethod,
    });

    await order.save();

    // Update cart items with order reference
     await Cart.updateMany({ user: userId }, { $set: { order: order._id } });

    // Send the payment method back in the response
    res.json({
      order: { ...order.toObject(), paymentMethod: selectedPaymentMethod },
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//orderhistory route
app.get('/orderHistory/:userId', authUser, async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ user: userId }).populate('products.product');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
//logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'You are successfully logged out' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
