import Products, { Product } from '@/models/Product';
import Users, { User } from '@/models/User';
import Orders, { Order } from '@/models/Order';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: `.env.local`, override: true });
const MONGODB_URI = process.env.MONGODB_URI;

const products: Product[] = [
  {
    name: 'Clean Code',
    price: 32.5,
    img: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
    description: 'Robert C. Martin enseña a escribir código limpio, legible y mantenible.',
  },
  {
    name: 'El Quijote',
    price: 18.95,
    img: 'https://covers.openlibrary.org/b/isbn/9788424116388-L.jpg',
    description: 'La obra maestra de Cervantes: las aventuras de don Quijote y Sancho Panza.',
  },
  {
    name: 'The Pragmatic Programmer',
    price: 45.0,
    img: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg',
    description: 'Guía práctica para tu viaje hacia la maestría en la programación.',
  },
  {
    name: 'Cien años de soledad',
    price: 21.75,
    img: 'https://covers.openlibrary.org/b/isbn/9788497592208-L.jpg',
    description: 'La saga de los Buendía en el mítico pueblo de Macondo, de García Márquez.',
  },
  {
    name: 'Design Patterns',
    price: 54.99,
    img: 'https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg',
    description: 'El catálogo clásico de patrones de diseño orientados a objetos (GoF).',
  },
  {
    name: 'La sombra del viento',
    price: 15.5,
    img: 'https://covers.openlibrary.org/b/isbn/9788408163389-L.jpg',
    description: 'Carlos Ruiz Zafón nos lleva al Cementerio de los Libros Olvidados de Barcelona.',
  },
];

async function seed() {
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  const opts = {
    bufferCommands: false,
  };
  const conn = await mongoose.connect(MONGODB_URI, opts);

  
  if (!conn.connection.db) {
    throw new Error('Could not connect to the database.');
  }
  await conn.connection.db.dropDatabase();

  
  await Orders.createCollection();

  
  const insertedProducts = await Products.insertMany(products);

  
  const order: Order = {
    date: new Date(),
    address: '123 Main St, 12345 New York, United States',
    cardHolder: 'John Doe',
    cardNumber: '1111222233334444',
    orderItems: [
      {
        product: insertedProducts[1]._id,
        qty: 2,
        price: insertedProducts[1].price, 
      },
      {
        product: insertedProducts[3]._id,
        qty: 1,
        price: insertedProducts[3].price,
      },
    ],
  };
  const insertedOrder = await Orders.create(order);

  
  const user: User = {
    email: 'johndoe@example.com',
    password: '1234',
    name: 'John',
    surname: 'Doe',
    address: '123 Main St, 12345 New York, United States',
    birthdate: new Date('1970-01-01'),
    cartItems: [
      {
        product: insertedProducts[0]._id,
        qty: 2,
      },
      {
        product: insertedProducts[2]._id,
        qty: 5,
      },
    ],
    orders: [insertedOrder._id],
  };
  await Users.create(user);

  
  const retrievedUser = await Users
    .findOne({ email: 'johndoe@example.com' }, { name: true, surname: true, email: true })
    .populate('cartItems.product', { name: true, price: true });
  console.log(JSON.stringify(retrievedUser, null, 2));

  const retrievedOrders = await Orders.find().populate('orderItems.product', { name: true });
  console.log(JSON.stringify(retrievedOrders, null, 2));

  await conn.disconnect();
}

seed().catch(console.error);