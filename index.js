const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const exphbs = require('express-handlebars');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db');
const path = require('path');
const cookieParser = require('cookie-parser'); // Importar cookie-parser

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; // Cambiar por una clave secreta segura



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static('public'));
app.use(cookieParser()); // Usar cookie-parser
// Configurar Handlebars
const hbs = exphbs.create({
  extname: '.handlebars',
  defaultLayout: 'main',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]; // Obtener token desde las cookies o encabezados de autorización
    if (!token) {
        return res.status(401).send('Acceso no autorizado: No se proporcionó un token.');
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).send('Acceso no autorizado: Token inválido o expirado.');
    }
};

// Ruta para la página de registro
app.get('/register', (req, res) => {
    res.render('register', { title: 'Registro de Participante' });
});

// Ruta para manejar el registro de usuario
app.post('/register', async (req, res) => {
    const { email, nombre, password, confirm_password, anos_experiencia, especialidad } = req.body;
    if (password !== confirm_password) {
        return res.status(400).send('Las contraseñas no coinciden');
    }
    
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No se subió ninguna imagen.');
    }

    const foto = req.files.foto;
    const uploadPath = path.join(__dirname, 'public/images', foto.name);

    try {
        await foto.mv(uploadPath);

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [email, nombre, hashedPassword, anos_experiencia, especialidad, foto.name, false]
        );

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar el participante');
    }
});

// Ruta para la página de login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión' });
});

// Ruta para manejar el login de usuario
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM skaters WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).send('Email o contraseña incorrectos');
        }

        const skater = result.rows[0];

        const match = await bcrypt.compare(password, skater.password);
        if (!match) {
            return res.status(401).send('Email o contraseña incorrectos');
        }

        const token = jwt.sign({ id: skater.id, email: skater.email }, SECRET_KEY, { expiresIn: '1m' });
        res.cookie('token', token, { httpOnly: true }); // Establecer la cookie del token
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al iniciar sesión');
    }
});

// Ruta para la página de inicio
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.render('home', { skaters: result.rows, title: 'Lista de Participantes' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar la página de inicio');
    }
});

// Ruta para la página de modificación de datos del participante
app.get('/datos', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters WHERE id = $1', [req.user.id]);
        const skater = result.rows[0];
        res.render('datos', { skater, title: 'Modificar Datos' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar la página de modificación de datos');
    }
});

// Ruta para manejar la modificación de datos del participante
app.post('/datos', verifyToken, async (req, res) => {
    const { nombre, password, confirm_password, anos_experiencia, especialidad } = req.body;
    if (password !== confirm_password) {
        return res.status(400).send('Las contraseñas no coinciden');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'UPDATE skaters SET nombre = $1, password = $2, anos_experiencia = $3, especialidad = $4 WHERE id = $5',
            [nombre, hashedPassword, anos_experiencia, especialidad, req.user.id]
        );

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al modificar los datos del participante');
    }
});

// Ruta para manejar la eliminación de la cuenta del participante
app.post('/delete-account', verifyToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM skaters WHERE id = $1', [req.user.id]);
        res.clearCookie('token');
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar la cuenta del participante');
    }
});


// Ruta para la página de administración
app.get('/admin', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.render('admin', { skaters: result.rows, title: 'Administración de Participantes' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar la página de administración');
    }
});

// Ruta para manejar la aprobación de participantes
app.post('/admin/aprobar', verifyToken, async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('UPDATE skaters SET estado = true WHERE id = $1', [id]);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al aprobar al participante');
    }
});

// Ruta para manejar el rechazo de participantes
app.post('/admin/rechazar', verifyToken, async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('UPDATE skaters SET estado = false WHERE id = $1', [id]);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al rechazar al participante');
    }
});

// API Routes

// Registrar un nuevo participante
app.post('/api/skaters', async (req, res) => {
    const { email, nombre, password, anos_experiencia, especialidad } = req.body;
    if (!email || !nombre || !password || !anos_experiencia || !especialidad) {
        return res.status(400).send('Todos los campos son requeridos');
    }
    const foto = req.files && req.files.foto ? req.files.foto.name : 'default.jpg'; // Usar 'default.jpg' si no se proporciona una imagen
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query(
            'INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [email, nombre, hashedPassword, anos_experiencia, especialidad, foto, false]
        );
        if (req.files && req.files.foto) {
            req.files.foto.mv(__dirname + '/public/images/' + foto, function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error al subir la imagen');
                }
            });
        }
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar el participante');
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Todos los campos son requeridos');
    }
    try {
        const result = await pool.query('SELECT * FROM skaters WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).send('Credenciales inválidas');
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send('Credenciales inválidas');
        }
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al iniciar sesión');
    }
});

// Obtener todos los participantes
app.get('/api/skaters', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los participantes');
    }
});

// Actualizar los datos de un participante
app.put('/api/skaters/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { nombre, password, anos_experiencia, especialidad } = req.body;
    if (!nombre || !password || !anos_experiencia || !especialidad) {
        return res.status(400).send('Todos los campos son requeridos');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query(
            'UPDATE skaters SET nombre = $1, password = $2, anos_experiencia = $3, especialidad = $4 WHERE id = $5 RETURNING *',
            [nombre, hashedPassword, anos_experiencia, especialidad, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar el participante');
    }
});

// Eliminar un participante
app.delete('/api/skaters/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM skaters WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar el participante');
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});