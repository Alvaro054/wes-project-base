import mongoose, {Schema, Types} from 'mongoose';

export interface OrderItem{
  product: Types.ObjectId;
  qty: number;
  price: number;
}

export interface Order {
  date: Date;
  address: string;
  cardHolder: string;
  cardNumber: string;
  orderItems: OrderItem[];
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<Order>({
  date: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  cardHolder: {
    type: String,
    required: true,
  },
  cardNumber: {
    type: String,
    required: true,
  },
  orderItems: {
    type: [OrderItemSchema],
    required: true,
    validate: [(v: OrderItem[]) => v.length > 0, 'Order must have at least one item'],
  },
});

export default (mongoose.models.Order as mongoose.Model<Order>) ||
  mongoose.model<Order>('Order', OrderSchema);