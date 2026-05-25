import { db } from "../db/index.js";
import { favorites } from "../db/schema.js";
import { eq } from "drizzle-orm";

const CUSTOMER_ID = "customer_001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const data = await db
    .select()
    .from(favorites)
    .where(eq(favorites.customerId, CUSTOMER_ID));

  return Response.json({ favorites: data }, { headers: corsHeaders });
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const method = request.method;

if (method === "POST") {
    const body = await request.json();
    const { productId, productTitle, productImage, productHandle } = body;

    // Check for duplicate
    const existing = await db
      .select()
      .from(favorites)
      .where(eq(favorites.productId, productId));

    if (existing.length > 0) {
      return Response.json(
        { success: false, message: "Already in favorites!" },
        { headers: corsHeaders }
      );
    }

    await db.insert(favorites).values({
      customerId: CUSTOMER_ID,
      productId,
      productTitle,
      productImage,
      productHandle,
    });

    return Response.json({ success: true, message: "Added to favorites!" }, { headers: corsHeaders });
  }

  if (method === "DELETE") {
    const body = await request.json();
    const { productId } = body;

    await db
      .delete(favorites)
      .where(eq(favorites.productId, productId));

    return Response.json({ success: true, message: "Removed from favorites!" }, { headers: corsHeaders });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
}