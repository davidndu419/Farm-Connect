import { processImage } from "../../services/image.service.js";
import { publicStorageUrl, removeStoredFile } from "../../services/storage.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { decodeCursor, encodeCursor } from "../../utils/cursor.js";
import { marketplaceDataError } from "./products.errors.js";

const productSelect = `
  *,
  product_images (id, storage_path, display_order, alt_text),
  profiles!products_farmer_id_fkey (id, full_name, state, city, avatar_path)
`;

const marketplaceStatuses = ["active", "sold_out"];
const ownedProductStatuses = ["active", "sold_out", "archived"];
const allowedStatusTransitions = {
  draft: new Set(["active"]),
  active: new Set(["sold_out", "archived"]),
  sold_out: new Set(["active", "archived"]),
  archived: new Set(["active"])
};

function serializeProduct(supabase, product) {
  return {
    ...product,
    product_images: [...(product.product_images ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => ({
        ...image,
        url: publicStorageUrl(supabase, "product-images", image.storage_path)
      })),
    profiles: product.profiles
      ? {
          ...product.profiles,
          avatarUrl: product.profiles.avatar_path
            ? publicStorageUrl(supabase, "avatars", product.profiles.avatar_path)
            : null
        }
      : undefined
  };
}

function mapInput(input) {
  const mapped = {};
  const names = {
    title: "title",
    description: "description",
    category: "category",
    price: "price",
    unit: "unit",
    availableQuantity: "available_quantity",
    state: "state",
    city: "city",
    status: "status"
  };
  for (const [key, column] of Object.entries(names)) {
    if (input[key] !== undefined) mapped[column] = input[key];
  }
  return mapped;
}

export async function listProducts(supabase, filters) {
  const cursor = decodeCursor(filters.cursor);
  
  if (filters.q) {
    const cleanQuery = filters.q.trim().replace(/\s+/g, " ").toLowerCase();
    const terms = cleanQuery.split(" ").filter(Boolean);
    
    if (terms.length === 0) {
      return listProductsWithoutSearch(supabase, filters, cursor);
    }

    let query = supabase
      .from("products")
      .select(productSelect)
      .in("status", marketplaceStatuses);

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.state) query = query.eq("state", filters.state);
    if (filters.city) query = query.ilike("city", filters.city);
    if (filters.unit) query = query.eq("unit", filters.unit);
    if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
    if (filters.farmerId) query = query.eq("farmer_id", filters.farmerId);

    const { data, error } = await query.limit(2000);
    if (error) throw marketplaceDataError(error);

    const scoredProducts = data.map((product) => {
      const title = (product.title || "").toLowerCase();
      const category = (product.category || "").toLowerCase().replace(/_/g, " ");
      const city = (product.city || "").toLowerCase();
      const state = (product.state || "").toLowerCase();
      const farmerName = (product.profiles?.full_name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();

      const isMatch = terms.every(term => 
        title.includes(term) ||
        category.includes(term) ||
        city.includes(term) ||
        state.includes(term) ||
        farmerName.includes(term) ||
        description.includes(term)
      );

      if (!isMatch) return null;

      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) {
          score += 100000;
        } else if (category.includes(term)) {
          score += 10000;
        } else if (city.includes(term) || state.includes(term)) {
          score += 1000;
        } else if (farmerName.includes(term)) {
          score += 100;
        } else if (description.includes(term)) {
          score += 1;
        }
      }

      return { product, score };
    }).filter(Boolean);

    const priceSort = filters.sort.startsWith("price");
    const column = priceSort ? "price" : "created_at";
    const ascending = filters.sort === "price_asc";

    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      
      const valA = a.product[column];
      const valB = b.product[column];
      
      if (valA === valB) {
        return a.product.id.localeCompare(b.product.id);
      }
      
      if (ascending) {
        return valA < valB ? -1 : 1;
      } else {
        return valA > valB ? -1 : 1;
      }
    });

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = scoredProducts.findIndex(p => p.product.id === cursor.id);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const pageSlice = scoredProducts.slice(startIndex, startIndex + filters.limit + 1);
    const hasMore = pageSlice.length > filters.limit;
    const page = pageSlice.slice(0, filters.limit);
    const last = page.at(-1);

    return {
      products: page.map(({ product }) => serializeProduct(supabase, product)),
      meta: {
        hasMore,
        nextCursor: hasMore && last
          ? encodeCursor({ value: last.score, id: last.product.id })
          : null
      }
    };
  } else {
    return listProductsWithoutSearch(supabase, filters, cursor);
  }
}

async function listProductsWithoutSearch(supabase, filters, cursor) {
  let query = supabase
    .from("products")
    .select(productSelect)
    .in("status", marketplaceStatuses);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.city) query = query.ilike("city", filters.city);
  if (filters.unit) query = query.eq("unit", filters.unit);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.farmerId) query = query.eq("farmer_id", filters.farmerId);

  const priceSort = filters.sort.startsWith("price");
  const column = priceSort ? "price" : "created_at";
  const ascending = filters.sort === "price_asc";
  query = query.order(column, { ascending }).order("id", { ascending });

  if (cursor) {
    query = ascending
      ? query.or(`${column}.gt.${cursor.value},and(${column}.eq.${cursor.value},id.gt.${cursor.id})`)
      : query.or(`${column}.lt.${cursor.value},and(${column}.eq.${cursor.value},id.lt.${cursor.id})`);
  }

  const { data, error } = await query.limit(filters.limit + 1);
  if (error) throw marketplaceDataError(error);

  const hasMore = data.length > filters.limit;
  const page = data.slice(0, filters.limit);
  const last = page.at(-1);
  return {
    products: page.map((product) => serializeProduct(supabase, product)),
    meta: {
      hasMore,
      nextCursor: hasMore
        ? encodeCursor({ value: last[column], id: last.id })
        : null
    }
  };
}

export async function getProduct(supabase, productId) {
  const { data, error } = await supabase
    .from("products").select(productSelect).eq("id", productId)
    .in("status", marketplaceStatuses).single();
  if (error?.code === "PGRST116") {
    throw ApiError.notFound("Product not found.");
  }
  if (error) throw marketplaceDataError(error);
  if (!data) throw ApiError.notFound("Product not found.");
  return serializeProduct(supabase, data);
}

export async function listOwnedProducts(supabase, userId, filters) {
  let query = supabase.from("products").select(productSelect)
    .eq("farmer_id", userId).in("status", ownedProductStatuses)
    .order("created_at", { ascending: false }).limit(filters.limit);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw marketplaceDataError(error);
  return data.map((product) => serializeProduct(supabase, product));
}

export async function createProduct(supabase, userId, input) {
  const { data, error } = await supabase.from("products")
    .insert({ farmer_id: userId, ...mapInput(input) }).select(productSelect).single();
  if (error) throw ApiError.badRequest("The product draft could not be created.");
  return serializeProduct(supabase, data);
}

export async function updateProduct(supabase, userId, productId, input) {
  const { data, error } = await supabase.from("products").update(mapInput(input))
    .eq("id", productId).eq("farmer_id", userId).select(productSelect).single();
  if (error || !data) throw ApiError.badRequest(error?.message ?? "The product could not be updated.");
  return serializeProduct(supabase, data);
}

export async function changeProductStatus(
  supabase,
  userId,
  productId,
  targetStatus
) {
  const { data: product, error } = await supabase
    .from("products")
    .select("status, available_quantity")
    .eq("id", productId)
    .eq("farmer_id", userId)
    .single();

  if (error || !product || product.status === "deleted") {
    throw ApiError.notFound("Product not found.");
  }

  if (product.status === targetStatus) {
    throw ApiError.badRequest(`This product is already ${targetStatus.replace("_", " ")}.`);
  }

  if (!allowedStatusTransitions[product.status]?.has(targetStatus)) {
    throw ApiError.badRequest(
      `Product status cannot change from ${product.status.replace("_", " ")} to ${targetStatus.replace("_", " ")}.`
    );
  }

  if (targetStatus === "active" && Number(product.available_quantity) <= 0) {
    throw ApiError.badRequest(
      "Set a positive available quantity before marking this product active."
    );
  }

  return updateProduct(supabase, userId, productId, {
    status: targetStatus
  });
}

export async function softDeleteProduct(supabase, userId, productId) {
  await updateProduct(supabase, userId, productId, { status: "deleted" });
}

export async function addProductImages(supabase, userId, productId, files) {
  if (!files?.length) throw ApiError.badRequest("Choose at least one product image.");
  const { data: existing, error: readError } = await supabase.from("product_images")
    .select("id, display_order").eq("product_id", productId);
  if (readError) throw ApiError.notFound("Product not found.");
  if (existing.length + files.length > 5) throw ApiError.badRequest("A product may have at most five images.");

  const created = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const image = await processImage(files[index].buffer, { maxWidth: 1600, maxHeight: 1600 });
      const path = `${userId}/${productId}/${crypto.randomUUID()}.webp`;
      const upload = await supabase.storage.from("product-images").upload(path, image, {
        contentType: "image/webp", cacheControl: "31536000", upsert: false
      });
      if (upload.error) throw upload.error;
      const inserted = await supabase.from("product_images").insert({
        product_id: productId, storage_path: path, display_order: existing.length + index
      }).select("*").single();
      if (inserted.error) {
        await removeStoredFile(supabase, "product-images", path).catch(() => {});
        throw inserted.error;
      }
      created.push(inserted.data);
    }
  } catch {
    if (created.length) {
      await supabase.from("product_images").delete().in("id", created.map(({ id }) => id));
      await supabase.storage.from("product-images").remove(created.map(({ storage_path }) => storage_path));
    }
    throw ApiError.badRequest("The product images could not be uploaded.");
  }
  return created.map((image) => ({
    ...image, url: publicStorageUrl(supabase, "product-images", image.storage_path)
  }));
}

export async function reorderImages(supabase, productId, imageIds) {
  const { data, error } = await supabase.rpc("reorder_product_images", {
    target_product_id: productId, ordered_image_ids: imageIds
  });
  if (error) throw ApiError.badRequest("The images could not be reordered.");
  return data;
}

export async function deleteProductImage(supabase, productId, imageId) {
  const { data, error } = await supabase.from("product_images").delete()
    .eq("id", imageId).eq("product_id", productId).select("storage_path").single();
  if (error || !data) throw ApiError.notFound("Product image not found.");
  await removeStoredFile(supabase, "product-images", data.storage_path).catch(() => {});
}
