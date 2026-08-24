import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import mongoose from "mongoose";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function requireMongo() {
  if (!process.env.MONGODB_URI) {
    throw new ApiError(
      "MongoDB is not configured. Set MONGODB_URI in .env.local.",
      503
    );
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    return NextResponse.json(
      { error: "Duplicate key — slug or code already exists" },
      { status: 409 }
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof Error) {
    if (error.message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[api]", error.message);
  } else {
    console.error("[api]", error);
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Map a Mongoose doc to the frontend Product/Collection shape (`id` string). */
export function withId<T extends { _id: { toString(): string } }>(
  doc: T
): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DH-${stamp}-${rand}`;
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}
