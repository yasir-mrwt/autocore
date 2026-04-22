ALTER TABLE "orders"
ADD COLUMN "estimated_delivery_at" TIMESTAMP(3),
ADD COLUMN "shipped_at" TIMESTAMP(3),
ADD COLUMN "delivered_at" TIMESTAMP(3);
