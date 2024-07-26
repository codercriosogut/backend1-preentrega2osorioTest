import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

let productos = [];

// Rutas para las vistas
app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});

app.get('/form', (req, res) => {
    res.render('form');
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.emit('updateProducts', productos);

    socket.on('addProduct', (product) => {
        productos.push(product);
        io.emit('updateProducts', productos);
    });

    socket.on('deleteProduct', (productId) => {
        productos = productos.filter(product => product.id !== productId);
        io.emit('updateProducts', productos);
    });
});

const port = 8080;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
