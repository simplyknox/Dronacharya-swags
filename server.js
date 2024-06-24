const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.'));

app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
    },
}));

mongoose.connect('mongodb+srv://miniproject:miniproject@miniproject.pk7t7rd.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = mongoose.model('User', {
    username: String,
    email: String,
    password: String,
});

const Address = mongoose.model('Address', {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});





app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/address', async (req, res) => {
    const { fullName, addressLine1, addressLine2, city, state, zipCode } = req.body;

    try {

        if (!req.session.user || !req.session.user.id) {
            return res.status(401).send('Unauthorized');
        }


        const newAddress = new Address({
            fullName,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            user: req.session.user.id,
        });


        await newAddress.save();

        res.redirect('/merchandise');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.use(express.static('public'));


app.use(bodyParser.urlencoded({ extended: true }));

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.get('/previous-orders', (req, res) => {
    res.sendFile(__dirname + '/previous-orders.html');
});


app.get('/contact-us', (req, res) => {
    res.sendFile(__dirname + '/contact-us.html');
});

app.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    try {
        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }

        const newUser = new User({ username, email, password });
        await newUser.save();


        res.redirect('/merchandise');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
});


app.use(limiter);



app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/address', (req, res) => {
    res.sendFile(__dirname + '/address.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/changeemail', (req, res) => {
    res.sendFile(__dirname + '/changeemail.html');
});

app.get('/changepassword', (req, res) => {
    res.sendFile(__dirname + '/changepassword.html');
});

app.post('/change-email', async (req, res) => {
    const newEmail = req.body.newEmail;

    try {

        if (!req.session.user || !req.session.user.id) {
            return res.status(401).send('Unauthorized');
        }


        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            { email: newEmail },
            { new: true }
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Email updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/change-password', async (req, res) => {
    const newPassword = req.body.newpassword;

    try {

        if (!req.session.user || !req.session.user.id) {
            return res.status(401).send('Unauthorized');
        }


        const user = await User.findByIdAndUpdate(
            req.session.user.id,
            { password: newPassword },
            { new: true }
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Password updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });

        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        req.session.user = {
            id: user._id,
            username: user.username,
        };

        res.redirect('/merchandise');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/logout', (req, res) => {
    req.session = null;

    res.redirect('/login');
});



app.get('/merchandise', (req, res) => {
    if (req.session.user && req.session.user.username) {
        res.render('merchandise', {
            username: req.session.user.username
        });
    } else {
        res.redirect('/login');
    }
});


app.get('/about', (req, res) => {
    const aboutFilePath = path.join(__dirname, 'about.html');
    res.sendFile(aboutFilePath);
});

app.get('/cart', (req, res) => {
    const cartt = path.join(__dirname, 'cart.html');
    res.sendFile(cartt);
});

app.get('/account', async (req, res) => {
    try {
        if (req.session.user && req.session.user.username) {
            const user = await User.findOne({ username: req.session.user.username });
            const address = await Address.findOne({ user: user._id });

            res.render('account', {
                username: user.username,
                email: user.email,
                address: {
                    fullName: address.fullName,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode,
                },
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
