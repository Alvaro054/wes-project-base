import Products, { Product } from '@/models/Product';
import connect from '@/lib/mongoose';
import { Types } from 'mongoose';
import Users, { User, CartItem } from '@/models/User';
import Orders, { Order, OrderItem } from '@/models/Order';

export interface ErrorResponse {
  error: string
  message: string
}
export interface GetProductsResponse {
  products: (Product & { _id: Types.ObjectId })[]
}
export interface CreateUserResponse {
  _id: Types.ObjectId
}

export async function createUser(user: {
  email: string;
  password: string;
  name: string;
  surname: string;
  address: string;
  birthdate: Date;
}): Promise<CreateUserResponse | null> {
  await connect();

  const prevUser = await Users.find({ email: user.email });

  if (prevUser.length !== 0) {
    return null;
  }

  const doc: User = {
    ...user,
    birthdate: new Date(user.birthdate),
    cartItems: [],
    orders: [],
  };

  const newUser = await Users.create(doc);

  return {
    _id: newUser._id,
  };
}

export async function getProducts(): Promise<GetProductsResponse> {
  await connect()

  const productsProjection = {
    __v: false
  }
  const products = await Products.find({}, productsProjection)

  return {
    products,
  }
}
export interface GetUserResponse
  extends Pick<User, 'email' | 'name' | 'surname' | 'address' | 'birthdate'> {
  _id: Types.ObjectId
}

export async function getUser(
  userId: Types.ObjectId | string
): Promise<GetUserResponse | null> {
  await connect()

  const userProjection = {
    email: true,
    name: true,
    surname: true,
    address: true,
    birthdate: true,
  }
  const user = await Users.findById(userId, userProjection)

  return user
}

export interface GetProductResponse extends Product {
  _id: Types.ObjectId;
}

export async function getProduct(
  productId: Types.ObjectId | string
): Promise<GetProductResponse | null> {
  await connect();

  const productProjection = { __v: false };
  const product = await Products.findById(productId, productProjection);

  return product;
}

// ===================== CARRITO =====================

export interface PopulatedCartItem extends Omit<CartItem, 'product'> {
  product: Product & { _id: Types.ObjectId };
}

export interface GetCartResponse {
  cartItems: PopulatedCartItem[];
}

export async function getCart(
  userId: Types.ObjectId | string
): Promise<GetCartResponse | null> {
  await connect();

  const user = await Users.findById(userId);
  if (user === null) {
    return null;
  }

  const userWithCart = await user.populate<{ cartItems: PopulatedCartItem[] }>(
    'cartItems.product',
    { __v: false }
  );

  return {
    cartItems: userWithCart.cartItems,
  };
}

export interface AddToCartResponse extends GetCartResponse {
  created: boolean;
}

export async function addProductToCart(
  userId: Types.ObjectId | string,
  productId: Types.ObjectId | string,
  qty: number
): Promise<AddToCartResponse | null> {
  await connect();

  const product = await Products.findById(productId);
  if (product === null) {
    return null;
  }

  const user = await Users.findById(userId);
  if (user === null) {
    return null;
  }

  const cartItem = user.cartItems.find(
    (item) => item.product.toString() === productId.toString()
  );

  let created: boolean;
  if (cartItem) {

    cartItem.qty = qty;
    created = false;
  } else {

    user.cartItems.push({
      product: new Types.ObjectId(productId.toString()),
      qty,
    });
    created = true;
  }

  await user.save();
  const userWithCart = await user.populate<{ cartItems: PopulatedCartItem[] }>(
    'cartItems.product',
    { __v: false }
  );

  return {
    cartItems: userWithCart.cartItems,
    created,
  };
}

export async function removeProductFromCart(
  userId: Types.ObjectId | string,
  productId: Types.ObjectId | string
): Promise<GetCartResponse | null> {
  await connect();

  const product = await Products.findById(productId);
  if (product === null) {
    return null;
  }

  const user = await Users.findById(userId);
  if (user === null) {
    return null;
  }


  user.cartItems = user.cartItems.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  await user.save();

  const userWithCart = await user.populate<{ cartItems: PopulatedCartItem[] }>(
    'cartItems.product',
    { __v: false }
  );

  return {
    cartItems: userWithCart.cartItems,
  };
}

// ===================== PEDIDOS =====================

export interface GetOrdersResponse {
  orders: (Order & { _id: Types.ObjectId })[];
}

export async function getOrders(
  userId: Types.ObjectId | string
): Promise<GetOrdersResponse | null> {
  await connect();

  const user = await Users.findById(userId);
  if (user === null) {
    return null;
  }

  const userWithOrders = await user.populate<{
    orders: (Order & { _id: Types.ObjectId })[];
  }>('orders', { __v: false });

  return {
    orders: userWithOrders.orders,
  };
}

export interface CreateOrderData {
  address: string;
  cardHolder: string;
  cardNumber: string;
}

export interface CreateOrderResponse {
  _id: Types.ObjectId;
}

export async function createOrder(
  userId: Types.ObjectId | string,
  orderData: CreateOrderData
): Promise<CreateOrderResponse | 'EMPTY_CART' | null> {
  await connect();

  const user = await Users.findById(userId);
  if (user === null) {
    return null;
  }

  if (user.cartItems.length === 0) {
    return 'EMPTY_CART';
  }


  const products = await Products.find({
    _id: { $in: user.cartItems.map((item) => item.product) },
  });
  const priceOf = new Map(
    products.map((product) => [product._id.toString(), product.price])
  );


  const orderItems: OrderItem[] = user.cartItems.map((item) => ({
    product: item.product,
    qty: item.qty,
    price: priceOf.get(item.product.toString())!,
  }));


  const order = await Orders.create({
    date: new Date(),
    address: orderData.address,
    cardHolder: orderData.cardHolder,
    cardNumber: orderData.cardNumber,
    orderItems,
  });


  user.cartItems = [];
  user.orders.push(order._id);
  await user.save();

  return {
    _id: order._id,
  };
}

export interface PopulatedOrderItem extends Omit<OrderItem, 'product'> {
  product: Product & { _id: Types.ObjectId };
}

export interface PopulatedOrder extends Omit<Order, 'orderItems'> {
  orderItems: PopulatedOrderItem[];
}

export async function getOrder(
  userId: Types.ObjectId | string,
  orderId: Types.ObjectId | string
): Promise<PopulatedOrder | null> {
  await connect();

  const user = await Users.findById(userId);
  if (user === null) {
    return null;
  }


  if (!user.orders.some((id) => id.toString() === orderId.toString())) {
    return null;
  }

  const order = await Orders.findById(orderId, { __v: false });
  if (order === null) {
    return null;
  }

  const populatedOrder = await order.populate<{
    orderItems: PopulatedOrderItem[];
  }>('orderItems.product', { __v: false });

  return populatedOrder;
}