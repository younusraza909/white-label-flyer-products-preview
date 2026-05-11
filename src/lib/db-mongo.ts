import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Define the Review Schema
const ReviewSchema = new mongoose.Schema({
  flyer_product_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  id: {
    type: Number,
    required: true,
  },
  is_accepted: {
    type: Boolean,
    default: null,
  },
  comments: {
    type: String,
    default: '',
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at field on save
ReviewSchema.pre('save', function () {
  this.set('updated_at', new Date());
});

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default dbConnect;
