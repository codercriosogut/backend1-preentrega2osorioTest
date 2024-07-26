import express from 'express';
import { promises as fs } from 'fs';

const router = express.Router();

let carritos = [];
let currentCartId = 1;
let productos = [];

async function readCarritos() {
    try {
        const data = await fs.readFile('carritos.json', 'utf8');
        carritos = JSON.parse(data);
        currentCartId = carritos.length ? Math.max(...carritos.map(c => c.id)) + 1 : 1;
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('carritos.json', JSON.stringify([]));
        } else {
            console.error("Error al leer el archivo", error);
        }
    }
}

async function writeCarritos() {
    try {
        await fs.writeFile('carritos.json', JSON.stringify(carritos, null, 2));
    } catch (error) {
        console.error("Error al escribir en el archivo", error);
    }
}

readCarritos();

router.post('/', async (req, res) => {
    const nuevoCarrito = {
        id: currentCartId++,
        products: []
    };

    carritos.push(nuevoCarrito);
    await writeCarritos();
    res.status(201).json(nuevoCarrito);
});

router.get('/', (req, res) => {
    const carritosConDetalles = carritos.map(carrito => {
        const productosDetallados = carrito.products.map(item => {
            const producto = productos.find(p => p.id === item.product);
            return { ...producto, quantity: item.quantity };
        });
        return { ...carrito, products: productosDetallados };
    });
    res.json(carritosConDetalles);
});

router.get('/:cid', (req, res) => {
    const carritoID = parseInt(req.params.cid);
    const carrito = carritos.find((carrito) => carrito.id === carritoID);
    if (carrito) {
        const productosDetallados = carrito.products.map(item => {
            const producto = productos.find(p => p.id === item.product);
            return { ...producto, quantity: item.quantity };
        });
        res.json(productosDetallados);
    } else {
        res.status(404).json({ mensaje: "Carrito no encontrado" });
    }
});

router.post('/:cid/product/:pid', async (req, res) => {
    const carritoID = parseInt(req.params.cid);
    const productoID = parseInt(req.params.pid);

    const carrito = carritos.find((carrito) => carrito.id === carritoID);
    if (!carrito) {
        return res.status(404).json({ mensaje: "Carrito no encontrado" });
    }

    const producto = productos.find((producto) => producto.id === productoID);
    if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    const item = carrito.products.find(p => p.product === productoID);
    if (item) {
        item.quantity += 1;
    } else {
        carrito.products.push({ product: productoID, quantity: 1 });
    }

    await writeCarritos();
    res.status(201).json(carrito);
});

export default router;
