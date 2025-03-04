const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://phamthuong1426:Thuong2003%40@thuong.l7ego.mongodb.net/mydatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/', require('./routes/users'));

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
});

app.listen(3000, () => console.log('Server running on port 3000'));