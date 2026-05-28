import { db } from "../db/index.js";
import { favorites, customers, products, activityLog } from "../db/schema.server.js";
import { eq, desc, and } from "drizzle-orm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const shopifyCustomerId = url.searchParams.get("customerId");

    let query = db
      .select({
        id: favorites.id,
        customerId: favorites.customerId,
        productId: favorites.productId,
        productHandle: products.handle,
        createdAt: favorites.createdAt,
        customerName: customers.name,
        productTitle: products.title,
        productImage: products.imageUrl,
        productPrice: products.price,
      })
      .from(favorites)
      .leftJoin(customers, eq(favorites.customerId, customers.id))
      .leftJoin(products, eq(favorites.productId, products.id))
      .orderBy(desc(favorites.createdAt));

    if (shopifyCustomerId) {
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.shopifyCustomerId, shopifyCustomerId))
        .limit(1);

      if (customer.length > 0) {
        query = query.where(eq(favorites.customerId, customer[0].id));
      } else {
        return new Response(
          JSON.stringify({ success: true, favorites: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const allFavorites = await query;

    return new Response(
      JSON.stringify({ success: true, favorites: allFavorites }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const method = request.method;
  const body = await request.json();

  try {
    if (method === "POST") {
      // ── Upsert customer ────────────────────────────────────────
      let customer = await db
        .select()
        .from(customers)
        .where(eq(customers.shopifyCustomerId, body.customerId))
        .limit(1);

      if (customer.length === 0) {
        await db.insert(customers).values({
          shopifyCustomerId: body.customerId,
          name: (body.customerName && body.customerName.trim()) || body.customerEmail || "Guest",
          email: body.customerEmail || "",
        });
        customer = await db
          .select()
          .from(customers)
          .where(eq(customers.shopifyCustomerId, body.customerId))
          .limit(1);
      } else if (body.customerName && body.customerName.trim()) {
        // ✅ UPDATE name
        await db.update(customers)
          .set({ name: body.customerName.trim() })
          .where(eq(customers.shopifyCustomerId, body.customerId));
      }

      // ── Upsert product (FIX: update price/image if missing) ───
      let product = await db
        .select()
        .from(products)
        .where(eq(products.shopifyProductId, body.productId))
        .limit(1);

      if (product.length === 0) {
        await db.insert(products).values({
          shopifyProductId: body.productId,
          title: body.productTitle || "",
          handle: body.productHandle || "",
          imageUrl: body.productImage || "",
          price: body.productPrice || "",
        });
        product = await db
          .select()
          .from(products)
          .where(eq(products.shopifyProductId, body.productId))
          .limit(1);
      } else {
        // Product already exists — update price/image if they were empty on first insert
        const needsUpdate =
          ((!product[0].price || product[0].price === "") && body.productPrice) ||
          ((!product[0].imageUrl || product[0].imageUrl === "") && body.productImage);

        if (needsUpdate) {
          await db
            .update(products)
            .set({
              price: body.productPrice || product[0].price || "",
              imageUrl: body.productImage || product[0].imageUrl || "",
              handle: body.productHandle || product[0].handle || "",
            })
            .where(eq(products.shopifyProductId, body.productId));

          product = await db
            .select()
            .from(products)
            .where(eq(products.shopifyProductId, body.productId))
            .limit(1);
        }
      }

      // ── Check duplicate before inserting ──────────────────────
      const existing = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.customerId, customer[0].id),
            eq(favorites.productId, product[0].id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Already in favorites" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await db.insert(favorites).values({
        customerId: customer[0].id,
        productId: product[0].id,
      });

      await db.insert(activityLog).values({
        customerId: customer[0].id,
        productId: product[0].id,
        action: "added",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Added to favorites" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (method === "DELETE") {
      const { customerId, productId } = body;

      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.shopifyCustomerId, customerId))
        .limit(1);

      const product = await db
        .select()
        .from(products)
        .where(eq(products.shopifyProductId, productId))
        .limit(1);

      if (customer.length === 0 || product.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Favorite not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.customerId, customer[0].id),
            eq(favorites.productId, product[0].id)
          )
        );

      // FIX: Log "removed" so it shows in Activity Log
      await db.insert(activityLog).values({
        customerId: customer[0].id,
        productId: product[0].id,
        action: "removed",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Removed from favorites" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}