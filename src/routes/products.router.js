import express from 'express';
import { promises as fs } from 'fs';

const router = express.Router();

let productos = [];
let currentId = 1;

async function readProductos() {
    try {
        const data = await fs.readFile('productos.json', 'utf8');
        productos = JSON.parse(data);
        currentId = productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1;
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile('productos.json', JSON.stringify([]));
        } else {
            console.error("Error al leer el archivo", error);
        }
    }
}

async function writeProductos() {
    try {
        await fs.writeFile('productos.json', JSON.stringify(productos, null, 2));
    } catch (error) {
        console.error("Error al escribir en el archivo", error);
    }
}

readProductos();

router.get('/', (req, res) => {
    res.json(productos);
});

router.get('/:pid', (req, res) => {
    const productoID = parseInt(req.params.pid);
    const producto = productos.find((producto) => producto.id === productoID);
    if (producto) {
        res.json(producto);
    } else {
        res.status(404).json({ mensaje: "Producto no encontrado" });
    }
});

router.post('/', async (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;

    if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({
            mensajes: [
                "Debe ingresar todos los campos: title, description, code, price, stock, category",
                "A excepción de thumbnails y status que por defecto es true",
            ]
        });
    }

    const nuevoProducto = {
        id: currentId++,
        title,
        description,
        code,
        price,
        status: true,
        stock,
        category,
        thumbnails: thumbnails || []
    };

    productos.push(nuevoProducto);
    await writeProductos();
    res.status(201).json(nuevoProducto);
});

router.put('/:pid', async (req, res) => {
    const productoID = parseInt(req.params.pid);
    const producto = productos.find((producto) => producto.id === productoID);

    if (producto) {
        const { title, description, code, price, stock, category, thumbnails, status } = req.body;

        if (title !== undefined) producto.title = title;
        if (description !== undefined) producto.description = description;
        if (code !== undefined) producto.code = code;
        if (price !== undefined) producto.price = price;
        if (stock !== undefined) producto.stock = stock;
        if (category !== undefined) producto.category = category;
        if (thumbnails !== undefined) producto.thumbnails = thumbnails;
        if (status !== undefined) producto.status = status;

        await writeProductos();
        res.json(producto);
    } else {
        res.status(404).json({ mensaje: "Producto no encontrado" });
    }
});

router.delete('/:pid', async (req, res) => {
    const productoID = parseInt(req.params.pid);
    const productoIndex = productos.findIndex((producto) => producto.id === productoID);

    if (productoIndex !== -1) {
        productos.splice(productoIndex, 1);
        await writeProductos();
        res.json({ mensaje: `Producto ${productoID} eliminado` });
    } else {
        res.status(404).json({ mensaje: "Producto no encontrado" });
    }
});

export default router;
