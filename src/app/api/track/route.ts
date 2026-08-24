import { connectDB } from "@/lib/mongodb";
import { Event, Customer, TRACK_EVENTS, type TrackEvent } from "@/models";
import { verifyIdToken } from "@/lib/auth";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

const MAX_EVENTS = 20;
const MAX_STRING = 500;

function cleanStr(v: unknown, max = MAX_STRING): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().slice(0, max);
  return s || undefined;
}

type TrackBody = {
  events?: Array<{
    event?: string;
    productId?: string;
    productName?: string;
    collectionId?: string;
    path?: string;
    metadata?: Record<string, unknown>;
    durationMs?: number;
  }>;
  sessionId?: string;
  fbclid?: string;
  path?: string;
  referrer?: string;
};

/**
 * POST /api/track — batched frontend analytics (guest or auth).
 */
export async function POST(request: Request) {
  try {
    requireMongo();

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 32_000) {
      throw new ApiError("Payload too large", 413);
    }

    const body = (await request.json()) as TrackBody;
    const events = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : [];
    if (events.length === 0) {
      throw new ApiError("events array is required");
    }

    const sessionId = cleanStr(body.sessionId, 80);
    if (!sessionId) throw new ApiError("sessionId is required");

    let firebaseUid: string | undefined;
    let email: string | undefined;
    let customerId: string | undefined;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const user = await verifyIdToken(authHeader);
        firebaseUid = user.uid;
        email = user.email?.toLowerCase();
        await connectDB();
        const customer = await Customer.findOne({ firebaseUid }).lean();
        if (customer) customerId = customer._id.toString();
      } catch {
        // continue as guest
      }
    }

    await connectDB();

    const docs = events
      .map((e) => {
        const eventName = cleanStr(e.event, 40);
        if (!eventName || !(TRACK_EVENTS as readonly string[]).includes(eventName)) {
          return null;
        }
        return {
          customerId: customerId || undefined,
          firebaseUid,
          sessionId,
          email,
          event: eventName as TrackEvent,
          productId: cleanStr(e.productId, 80),
          productName: cleanStr(e.productName, 200),
          collectionId: cleanStr(e.collectionId, 80),
          path: cleanStr(e.path || body.path, 300),
          referrer: cleanStr(body.referrer, 500),
          metadata: e.metadata,
          durationMs:
            e.durationMs != null && e.durationMs >= 0 && e.durationMs < 86_400_000
              ? Math.round(e.durationMs)
              : undefined,
          fbclid: cleanStr(body.fbclid, 200),
        };
      })
      .filter(Boolean);

    if (docs.length === 0) {
      throw new ApiError("No valid events");
    }

    await Event.insertMany(docs);

    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $set: { lastVisit: new Date() },
      });
    }

    return jsonOk({ tracked: docs.length });
  } catch (error) {
    return handleApiError(error);
  }
}
