const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mssql = require('mssql');

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
    saveUninitialized: true,
    secret: 'supersecret',
    resave: false
}));

const dbConfig = {
    server: 'MAKS\\SQLEXPRESS',
    database: 'ATB',
    user: '222',
    password: '222',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        await mssql.connect(dbConfig);
        
        const query = 'SELECT * FROM ATB_USER WHERE Login = @username AND Password = @password';
        const request = new mssql.Request();
        request.input('username', mssql.NVarChar(50), username);
        request.input('password', mssql.NVarChar(50), password);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            req.session.username = username;
            console.log("Login succeeded: ", req.session.username);
            res.send(`Login successful: sessionID: ${req.session.id}; user: ${req.session.username}`);
        } else {
            console.log("Login failed: ", username);
            res.status(401).send('Login error');
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('Database connection error');
    }
});

app.get('/logout', (req, res) => {
    req.session.username = '';
    console.log('Logged out');
    res.send('Logged out!');
});

app.get('/admin', (req, res) => {
    if (req.session.username === 'admin') {
        console.log(req.session.username + ' requested admin page');
        res.sendFile(path.join(__dirname, 'pages', 'admin_page.html'));
    } else {
        res.status(403).send('Access Denied!');
    }
});

app.get('/user', (req, res) => {
    if (req.session.username) {
        console.log(req.session.username + ' requested user page');
        res.sendFile(path.join(__dirname, 'pages', 'user_page.html'));
    } else {
        res.status(403).send('Access Denied!');
    }
});

app.listen(port, () => {
    console.log('app running on port ' + port);
});
