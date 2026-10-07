import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq, ilike, and, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { products, productImages, productVariants, collections, collectionProducts, drops, dropProducts } from "@/db/schema";
import { requireStaff } from "./auth";
import { logActivity } from "@/lib/activity-log";

const productInput = z.object({
  id: z.number().optional(), name: z.string().min(1).max(180), slug: z.string().min(1).max(220),
  description: z.string().max(5000).optional().nullable(), price: z.number().positive(), compareAtPrice: z.number().positive().optional().nullable(),
  category: z.string().min(1).max(80), tags: z.array(z.string()).default([]), featured: z.boolean().default(false), bestseller: z.boolean().default(false), active: z.boolean().default(true), sortOrder: z.number().int().default(0),
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional().nullable(), alt: z.string().optional().nullable() })).default([]),
  variants: z.array(z.object({ id: z.number().optional(), sku: z.string().min(1).max(80), size: z.string().min(1).max(20), color: z.string().min(1).max(40), price: z.number().positive().optional().nullable(), stock: z.number().int().min(0), active: z.boolean().default(true) })).default([]),
});

function shapeProduct(p: any) {
  return { ...p, price: Number(p.price), compareAtPrice: p.compareAtPrice == null ? null : Number(p.compareAtPrice), tags: p.tags ? p.tags.split(",").filter(Boolean) : [], images: p.images ?? [], variants: (p.variants ?? []).map((v: any) => ({ ...v, price: v.price == null ? null : Number(v.price) })) };
}

export const getProducts = createServerFn({ method: "GET" }).validator(z.object({ query: z.string().optional(), category: z.string().optional(), collection: z.string().optional(), sort: z.enum(["newest","price-asc","price-desc","featured"]).default("newest"), limit: z.number().int().min(1).max(100).default(48) })).handler(async ({ data }) => {
  const conditions = [eq(products.active, true)];
  if (data.category) conditions.push(eq(products.category, data.category));
  if (data.query?.trim()) conditions.push(or(ilike(products.name, `%${data.query.trim()}%`), ilike(products.description, `%${data.query.trim()}%`))!);
  let rows = await db.query.products.findMany({ where: and(...conditions), with: { images: { orderBy: asc(productImages.sortOrder) }, variants: { orderBy: asc(productVariants.id) } }, orderBy: data.sort === "price-asc" ? asc(products.price) : data.sort === "price-desc" ? desc(products.price) : data.sort === "featured" ? desc(products.featured) : desc(products.createdAt), limit: data.limit });
  if (data.collection) {
    const links = await db.query.collectionProducts.findMany({ where: eq(collectionProducts.collectionId, Number(data.collection)) });
    const ids = new Set(links.map(x => x.productId)); rows = rows.filter(x => ids.has(x.id));
  }
  return rows.map(shapeProduct);
});

export const getProductBySlug = createServerFn({ method: "GET" }).validator(z.object({ slug: z.string() })).handler(async ({ data }) => {
  const p = await db.query.products.findFirst({ where: and(eq(products.slug, data.slug), eq(products.active, true)), with: { images: { orderBy: asc(productImages.sortOrder) }, variants: { orderBy: asc(productVariants.id) } } });
  return p ? shapeProduct(p) : null;
});

export const getCollections = createServerFn({ method: "GET" }).handler(async () => db.query.collections.findMany({ where: eq(collections.active, true), orderBy: asc(collections.sortOrder) }));
export const getDrops = createServerFn({ method: "GET" }).handler(async () => db.query.drops.findMany({ where: or(eq(drops.status, "live"), eq(drops.status, "scheduled")), orderBy: desc(drops.launchAt) }));
export const getAllDrops = createServerFn({ method: "GET" }).handler(async () => { await requireStaff({ role: ["admin", "super_admin"] }); return db.query.drops.findMany({ orderBy: desc(drops.createdAt) }); });

export const saveProduct = createServerFn({ method: "POST" }).validator(productInput).handler(async ({ data }) => {
  const staff = await requireStaff({ role: ["admin", "super_admin"] });
  const values = { name: data.name, slug: data.slug, description: data.description ?? null, price: data.price.toFixed(2), compareAtPrice: data.compareAtPrice == null ? null : data.compareAtPrice.toFixed(2), category: data.category, tags: data.tags.join(","), featured: data.featured, bestseller: data.bestseller, active: data.active, sortOrder: data.sortOrder, updatedAt: new Date() };
  let id = data.id;
  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else { const [r] = await db.insert(products).values(values).returning({ id: products.id }); id = r.id; }
  await db.delete(productImages).where(eq(productImages.productId, id));
  if (data.images.length) await db.insert(productImages).values(data.images.map((x,i)=>({ productId:id!, url:x.url, publicId:x.publicId ?? null, alt:x.alt ?? data.name, sortOrder:i })));
  await db.delete(productVariants).where(eq(productVariants.productId, id));
  if (data.variants.length) await db.insert(productVariants).values(data.variants.map(v=>({ productId:id!, sku:v.sku, size:v.size, color:v.color, price:v.price == null ? null : v.price.toFixed(2), stock:v.stock, active:v.active })));
  await logActivity({ staffId:staff.id, staffName:staff.name, staffRole:staff.role, action:`${data.id ? "Updated" : "Created"} product "${data.name}"`, entityType:"product", entityId:id });
  return { id };
});

export const updateInventory = createServerFn({ method: "POST" }).validator(z.object({ variantId:z.number(), stock:z.number().int().min(0) })).handler(async ({data})=>{ const staff=await requireStaff({role:["admin","super_admin"]}); await db.update(productVariants).set({stock:data.stock,updatedAt:new Date()}).where(eq(productVariants.id,data.variantId)); await logActivity({staffId:staff.id,staffName:staff.name,staffRole:staff.role,action:`Updated inventory for variant #${data.variantId}`,entityType:"product_variant",entityId:data.variantId}); return {success:true}; });

export const saveCollection = createServerFn({ method:"POST" }).validator(z.object({id:z.number().optional(),name:z.string().min(1),slug:z.string().min(1),description:z.string().optional().nullable(),imageUrl:z.string().optional().nullable(),active:z.boolean().default(true),sortOrder:z.number().int().default(0)})).handler(async({data})=>{await requireStaff({role:["admin","super_admin"]}); if(data.id){await db.update(collections).set({...data,updatedAt:new Date()}).where(eq(collections.id,data.id));return {id:data.id}} const [r]=await db.insert(collections).values(data).returning({id:collections.id});return r;});

export const setCollectionProducts = createServerFn({method:"POST"}).validator(z.object({collectionId:z.number(),productIds:z.array(z.number())})).handler(async({data})=>{await requireStaff({role:["admin","super_admin"]});await db.delete(collectionProducts).where(eq(collectionProducts.collectionId,data.collectionId));if(data.productIds.length)await db.insert(collectionProducts).values(data.productIds.map(productId=>({collectionId:data.collectionId,productId})));return {success:true}});

export const setProductActive = createServerFn({method:"POST"}).validator(z.object({id:z.number(),active:z.boolean()})).handler(async({data})=>{await requireStaff({role:["admin","super_admin"]});await db.update(products).set({active:data.active,updatedAt:new Date()}).where(eq(products.id,data.id));return {success:true};});

export const saveDrop = createServerFn({method:"POST"}).validator(z.object({id:z.number().optional(),name:z.string().min(1).max(160),slug:z.string().min(1).max(180),description:z.string().optional().nullable(),coverUrl:z.string().optional().nullable(),launchAt:z.string().optional().nullable(),endAt:z.string().optional().nullable(),status:z.enum(["draft","scheduled","live","ended"])})).handler(async({data})=>{await requireStaff({role:["admin","super_admin"]});const v={name:data.name,slug:data.slug,description:data.description??null,coverUrl:data.coverUrl??null,launchAt:data.launchAt?new Date(data.launchAt):null,endAt:data.endAt?new Date(data.endAt):null,status:data.status,updatedAt:new Date()};if(data.id){await db.update(drops).set(v).where(eq(drops.id,data.id));return{id:data.id}}const[r]=await db.insert(drops).values(v).returning({id:drops.id});return r});
