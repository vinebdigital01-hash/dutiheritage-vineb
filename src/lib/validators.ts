import { z } from "zod";

export const placeOrderSchema = z.object({
  paymentMethod: z.enum(["prepaid", "cod", "partial"]),
  customer: z.object({
    email: z.string().email().optional().or(z.literal("")),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().min(1).max(20),
    address: z.string().min(1),
    apartment: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pinCode: z.string().min(1),
    country: z.string().optional(),
  }).passthrough(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(100),
      size: z.string().optional(),
      color: z.string().optional(),
    }).passthrough()
  ).min(1),
  couponCode: z.string().optional().nullable(),
  saveToProfile: z.boolean().optional(),
  razorpay: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    signature: z.string(),
  }).optional().nullable(),
  bypassPayment: z.boolean().optional(),
}).passthrough();

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(50).trim(),
  subtotal: z.number().min(0),
}).passthrough();

export const createRazorpayOrderSchema = z.object({
  amount: z.number().positive(),
}).passthrough();

export const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  address: z.any().optional(),
}).passthrough();

export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string()).optional(),
}).passthrough();
