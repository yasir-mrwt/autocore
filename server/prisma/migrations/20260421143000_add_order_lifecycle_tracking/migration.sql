ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_TO_DISPATCH';

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "ready_for_dispatch_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "courier_name" TEXT,
  ADD COLUMN IF NOT EXISTS "tracking_number" TEXT,
  ADD COLUMN IF NOT EXISTS "tracking_url" TEXT,
  ADD COLUMN IF NOT EXISTS "shipment_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "delivery_confirmation_due_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delivery_confirmation_sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "delivery_confirmed_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "order_status_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "admin_id" UUID,
  "status" "OrderStatus",
  "label" TEXT NOT NULL,
  "message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_status_events_order_id_idx" ON "order_status_events"("order_id");
CREATE INDEX IF NOT EXISTS "order_status_events_admin_id_idx" ON "order_status_events"("admin_id");
CREATE INDEX IF NOT EXISTS "order_status_events_created_at_idx" ON "order_status_events"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_status_events_order_id_fkey'
  ) THEN
    ALTER TABLE "order_status_events"
      ADD CONSTRAINT "order_status_events_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_status_events_admin_id_fkey'
  ) THEN
    ALTER TABLE "order_status_events"
      ADD CONSTRAINT "order_status_events_admin_id_fkey"
      FOREIGN KEY ("admin_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
