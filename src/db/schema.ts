import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

export const staffRoleEnum = pgEnum("staff_role", ["super_admin", "admin", "staff"]);

export const orderTypeEnum = pgEnum("order_type", ["pickup", "delivery"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
]);

export const paymentProviderEnum = pgEnum("payment_provider", ["paystack", "cash"]);

export const customDesignStatusEnum = pgEnum("custom_design_status", [
  "pending",
  "reviewing",
  "contacted",
  "approved",
  "rejected",
  "completed",
]);

export const dropStatusEnum = pgEnum("drop_status", ["draft", "scheduled", "live", "ended"]);

export const promotionTypeEnum = pgEnum("promotion_type", ["percentage", "fixed"]);

// ─────────────────────────────────────────────────────────────
// Staff / Users
// ─────────────────────────────────────────────────────────────

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  // Email is required for super_admin/admin (used for password-reset flows).
  // Staff accounts log in by username instead and may not have an email.
  email: varchar("email", { length: 200 }).unique(),
  // Staff accounts log in by username. Admin/super_admin may also have one,
  // but they primarily authenticate with email.
  username: varchar("username", { length: 60 }).unique(),
  passwordHash: text("password_hash").notNull(),
  role: staffRoleEnum("role").notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  // Who created this account (Super Admin creates Admins, Admin creates Staff).
  // Null for the first bootstrapped account.
  createdByStaffId: integer("created_by_staff_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Password reset tokens (Admin / Super Admin self-service recovery)
// ─────────────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  // We only ever store a hash of the token, never the raw value.
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Activity log (who did what, for accountability across staff)
// ─────────────────────────────────────────────────────────────

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
  // Snapshotted so the log stays readable even if the account is later renamed/deleted.
  staffName: varchar("staff_name", { length: 120 }).notNull(),
  staffRole: staffRoleEnum("staff_role").notNull(),
  action: varchar("action", { length: 200 }).notNull(),
  entityType: varchar("entity_type", { length: 40 }),
  entityId: varchar("entity_id", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Promotions
// ─────────────────────────────────────────────────────────────

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  // Short badge shown on the storefront, e.g. "Friday Game Day — 15% off"
  badgeText: varchar("badge_text", { length: 120 }),
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  // stable slug used by the frontend, e.g. "special", "banku"
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  blurb: text("blurb"),
  // display layout hint the existing frontend uses: list | grid | triple
  layout: varchar("layout", { length: 20 }).notNull().default("list"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Menu Items
// ─────────────────────────────────────────────────────────────

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  // stored in GHS as a decimal, e.g. 70.00. Null when this item instead has
  // price options in `menu_item_variants` below (e.g. Loaded Fries GH₵70/100)
  // — an item has exactly one or the other, never both.
  price: numeric("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Menu Item Variants — price options for dishes SET APART sells at more
// than one size/portion (e.g. Loaded Fries GH₵70 or GH₵100, Banku
// Tilapia "Half"/"Full"). SET APART mostly judges the portion to prepare
// from the price itself rather than naming sizes, so `label` is
// optional: leave it blank to just show the price as the choice, or
// set it when there's a real printed name like "Half"/"Full".
// ─────────────────────────────────────────────────────────────

export const menuItemVariants = pgTable("menu_item_variants", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 60 }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// App Settings (legacy key/value store — superseded for delivery
// pricing by the per-area `delivery_zones` table below, kept here
// in case other settings get added later)
// ─────────────────────────────────────────────────────────────

export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Delivery Zones (Admin/Super Admin set a fee per delivery area,
// e.g. "Kojokrom" — GH₵15, "Anaji" — GH₵10, "BU Environs" — GH₵5,
// instead of one flat fee for every delivery order)
// ─────────────────────────────────────────────────────────────

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  fee: numeric("fee", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  // human readable, derived from id after insert, e.g. FOC-1048
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  // opaque, unguessable token used for public order-tracking links
  trackingToken: varchar("tracking_token", { length: 64 }).notNull().unique(),

  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),

  orderType: orderTypeEnum("order_type").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryNotes: text("delivery_notes"),
  // Which delivery area (and its fee) this order was placed under. Nullable
  // so pickup orders (and old rows from before zones existed) are unaffected;
  // set null on zone deletion since deliveryZoneName below already snapshots
  // the area's name/price at order time, so history stays correct even if
  // the zone is later renamed or removed.
  deliveryZoneId: integer("delivery_zone_id").references(() => deliveryZones.id, {
    onDelete: "set null",
  }),
  deliveryZoneName: varchar("delivery_zone_name", { length: 120 }),

  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  promotionCode: varchar("promotion_code", { length: 40 }),

  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  orderStatus: orderStatusEnum("order_status").notNull().default("pending"),
  paymentReference: varchar("payment_reference", { length: 120 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Order Items
// ─────────────────────────────────────────────────────────────

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").references(() => menuItems.id, {
    onDelete: "set null",
  }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productVariantId: integer("product_variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  customDesignId: integer("custom_design_id").references(() => customDesigns.id, { onDelete: "set null" }),
  size: varchar("size", { length: 20 }),
  color: varchar("color", { length: 40 }),
  // Which price option was ordered, if the item has any (see
  // menu_item_variants above). Snapshotted the same way as everything else
  // here so historical orders stay correct even if the option is later
  // renamed, repriced, or removed.
  variantId: integer("variant_id").references(() => menuItemVariants.id, {
    onDelete: "set null",
  }),
  variantLabel: varchar("variant_label", { length: 60 }),
  // snapshotted at order time so historical orders stay correct
  // even if the menu item is later renamed, repriced, or deleted
  itemName: varchar("item_name", { length: 160 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
});

// ─────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: paymentProviderEnum("provider").notNull().default("paystack"),
  reference: varchar("reference", { length: 120 }).notNull().unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("GHS"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  // raw Paystack payload for the latest event, kept for reconciliation/debugging
  rawData: text("raw_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Order Status History
// ─────────────────────────────────────────────────────────────

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  previousStatus: orderStatusEnum("previous_status"),
  newStatus: orderStatusEnum("new_status").notNull(),
  changedByStaffId: integer("changed_by_staff_id").references(() => staff.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


// ─────────────────────────────────────────────────────────────
// SET APART commerce domain
// ─────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).unique(),
  phone: varchar("phone", { length: 40 }),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 60 }),
  recipientName: varchar("recipient_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  notes: text("notes"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 80 }).notNull().default("graphic-tees"),
  tags: text("tags"),
  featured: boolean("featured").notNull().default(false),
  bestseller: boolean("bestseller").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("products_active_idx").on(t.active), index("products_category_idx").on(t.category)]);

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  publicId: text("public_id"),
  alt: varchar("alt", { length: 200 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  size: varchar("size", { length: 20 }).notNull(),
  color: varchar("color", { length: 40 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("product_variant_choice_idx").on(t.productId, t.size, t.color), index("product_variant_product_idx").on(t.productId)]);

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collectionProducts = pgTable("collection_products", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("collection_product_unique_idx").on(t.collectionId, t.productId)]);

export const drops = pgTable("drops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  description: text("description"),
  coverUrl: text("cover_url"),
  launchAt: timestamp("launch_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  status: dropStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dropProducts = pgTable("drop_products", {
  id: serial("id").primaryKey(),
  dropId: integer("drop_id").notNull().references(() => drops.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("drop_product_unique_idx").on(t.dropId, t.productId)]);

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().unique().references(() => customers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").notNull().references(() => wishlists.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("wishlist_product_unique_idx").on(t.wishlistId, t.productId)]);

export const customDesigns = pgTable("custom_designs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  shirtColor: varchar("shirt_color", { length: 40 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  artworkUrl: text("artwork_url"),
  artworkPublicId: text("artwork_public_id"),
  mockupUrl: text("mockup_url"),
  mockupPublicId: text("mockup_public_id"),
  transform: text("transform"),
  notes: text("notes"),
  status: customDesignStatusEnum("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("custom_design_status_idx").on(t.status)]);

export const savedDesigns = pgTable("saved_designs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  customDesignId: integer("custom_design_id").notNull().references(() => customDesigns.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promotionCodes = pgTable("promotion_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  description: text("description"),
  type: promotionTypeEnum("type").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minimumSubtotal: numeric("minimum_subtotal", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promotionUsage = pgTable("promotion_usage", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").notNull().references(() => promotionCodes.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homepageSections = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  sectionKey: varchar("section_key", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 180 }),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  data: text("data"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// Relations (used for Drizzle's relational query API)
// ─────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  variants: many(menuItemVariants),
}));

export const menuItemVariantsRelations = relations(menuItemVariants, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemVariants.menuItemId],
    references: [menuItems.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
  statusHistory: many(orderStatusHistory),
  deliveryZone: one(deliveryZones, {
    fields: [orders.deliveryZoneId],
    references: [deliveryZones.id],
  }),
}));

export const deliveryZonesRelations = relations(deliveryZones, ({ many }) => ({
  orders: many(orders),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
  variant: one(menuItemVariants, {
    fields: [orderItems.variantId],
    references: [menuItemVariants.id],
  }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  productVariant: one(productVariants, { fields: [orderItems.productVariantId], references: [productVariants.id] }),
  customDesign: one(customDesigns, { fields: [orderItems.customDesignId], references: [customDesigns.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  staff: one(staff, { fields: [orderStatusHistory.changedByStaffId], references: [staff.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  staff: one(staff, { fields: [passwordResetTokens.staffId], references: [staff.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  staff: one(staff, { fields: [activityLog.staffId], references: [staff.id] }),
}));


export const customersRelations = relations(customers, ({ many, one }) => ({
  addresses: many(addresses),
  wishlist: one(wishlists),
  customDesigns: many(customDesigns),
}));
export const addressesRelations = relations(addresses, ({ one }) => ({ customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }) }));
export const productsRelations = relations(products, ({ many }) => ({ images: many(productImages), variants: many(productVariants), collectionProducts: many(collectionProducts), dropProducts: many(dropProducts), wishlistItems: many(wishlistItems) }));
export const productImagesRelations = relations(productImages, ({ one }) => ({ product: one(products, { fields: [productImages.productId], references: [products.id] }) }));
export const productVariantsRelations = relations(productVariants, ({ one }) => ({ product: one(products, { fields: [productVariants.productId], references: [products.id] }) }));
export const collectionsRelations = relations(collections, ({ many }) => ({ products: many(collectionProducts) }));
export const collectionProductsRelations = relations(collectionProducts, ({ one }) => ({ collection: one(collections, { fields: [collectionProducts.collectionId], references: [collections.id] }), product: one(products, { fields: [collectionProducts.productId], references: [products.id] }) }));
export const dropsRelations = relations(drops, ({ many }) => ({ products: many(dropProducts) }));
export const dropProductsRelations = relations(dropProducts, ({ one }) => ({ drop: one(drops, { fields: [dropProducts.dropId], references: [drops.id] }), product: one(products, { fields: [dropProducts.productId], references: [products.id] }) }));
export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({ customer: one(customers, { fields: [wishlists.customerId], references: [customers.id] }), items: many(wishlistItems) }));
export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({ wishlist: one(wishlists, { fields: [wishlistItems.wishlistId], references: [wishlists.id] }), product: one(products, { fields: [wishlistItems.productId], references: [products.id] }) }));
export const customDesignsRelations = relations(customDesigns, ({ one, many }) => ({ customer: one(customers, { fields: [customDesigns.customerId], references: [customers.id] }), saved: many(savedDesigns) }));
export const savedDesignsRelations = relations(savedDesigns, ({ one }) => ({ customer: one(customers, { fields: [savedDesigns.customerId], references: [customers.id] }), design: one(customDesigns, { fields: [savedDesigns.customDesignId], references: [customDesigns.id] }) }));
export const promotionCodesRelations = relations(promotionCodes, ({ many }) => ({ usage: many(promotionUsage) }));
export const promotionUsageRelations = relations(promotionUsage, ({ one }) => ({ promotion: one(promotionCodes, { fields: [promotionUsage.promotionId], references: [promotionCodes.id] }), order: one(orders, { fields: [promotionUsage.orderId], references: [orders.id] }), customer: one(customers, { fields: [promotionUsage.customerId], references: [customers.id] }) }));

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type Staff = typeof staff.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type MenuItemVariant = typeof menuItemVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type OrderStatusHistoryRow = typeof orderStatusHistory.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type ActivityLogRow = typeof activityLog.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Drop = typeof drops.$inferSelect;
export type CustomDesign = typeof customDesigns.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export const STAFF_ROLES = ["super_admin", "admin", "staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ORDER_STATUS_FLOW = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
] as const;
