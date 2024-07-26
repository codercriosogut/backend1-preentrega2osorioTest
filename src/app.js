import express from 'express';
import { engine } from 'express-handlebars';
import { Server as HttpServer } from 'http';
import { Server as IoServer } from 'socket.io';
import productsRouter, { productos } from './routes/products.router.js'; // Importa productos
import cartsRouter from './routes/carts.router.js';

const app = express();
const httpServer = new HttpServer(app);
const io = new IoServer(httpServer);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de handlebars
app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Rutas para vistas
app.get('/form', (req, res) => {
    res.render('form');
});

app.get('/realtimeproducts', (req, res) => {
    res.render('realtimeproducts');
});

// Configura el servidor para escuchar
httpServer.listen(8080, () => {
    console.log('Server is running on port 8080');
});

// Socket.io
io.on('connection', (socket) => {
    console.log('New client connected');

    // Envía la lista de productos al cliente
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
