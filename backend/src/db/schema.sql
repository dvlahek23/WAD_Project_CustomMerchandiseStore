-- Creator:       MySQL Workbench 8.0.44/ExportSQLite Plugin 0.1.0
-- Author:        domag
-- Caption:       New Model
-- Project:       Name of the project
-- Changed:       2026-01-12 16:08
-- Created:       2026-01-12 14:49
PRAGMA foreign_keys = OFF;

-- Schema: mydb
ATTACH "mydb.sdb" AS "mydb";
BEGIN;
CREATE TABLE IF NOT EXISTS "mydb"."Role"(
  "role_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" VARCHAR(30) NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  CONSTRAINT "name_UNIQUE"
    UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS"mydb"."User"(
  "user_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "email" VARCHAR(50) NOT NULL,
  "username" VARCHAR(50) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role_id" INTEGER NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_UNIQUE"
    UNIQUE("email"),
  CONSTRAINT "username_UNIQUE"
    UNIQUE("username"),
  CONSTRAINT "role_id"
    FOREIGN KEY("role_id")
    REFERENCES "Role"("role_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."User.role_id_idx" ON "User" ("role_id");
CREATE TABLE IF NOT EXISTS "mydb"."RegularUserType"(
  "user_type_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS"mydb"."User_RegularUserType"(
  "user_id" INTEGER NOT NULL,
  "user_type_id" INTEGER NOT NULL,
  PRIMARY KEY("user_id","user_type_id"),
  CONSTRAINT "user_id"
    FOREIGN KEY("user_id")
    REFERENCES "User"("user_id"),
  CONSTRAINT "user_type_id"
    FOREIGN KEY("user_type_id")
    REFERENCES "RegularUserType"("user_type_id")
);
CREATE INDEX IF NOT EXISTS"mydb"."User_RegularUserType.user_type_id_idx" ON "User_RegularUserType" ("user_type_id");
CREATE TABLE IF NOT EXISTS"mydb"."Category"(
  "category_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "manager_id" INTEGER NOT NULL,
  CONSTRAINT "manager_id"
    FOREIGN KEY("manager_id")
    REFERENCES "User"("user_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."Category.manager_id_idx" ON "Category" ("manager_id");
CREATE TABLE IF NOT EXISTS "mydb"."Product"(
  "product_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "base_price" DECIMAL NOT NULL,
  "product_type" VARCHAR(50) NOT NULL,
  "category_id" INTEGER NOT NULL,
  "picture_url" VARCHAR(300) NOT NULL,
  CONSTRAINT "category_id"
    FOREIGN KEY("category_id")
    REFERENCES "Category"("category_id")
);
CREATE INDEX IF NOT EXISTS"mydb"."Product.category_id_idx" ON "Product" ("category_id");
CREATE TABLE IF NOT EXISTS "mydb"."DesignTemplate"(
  "template_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "description" VARCHAR(50) NOT NULL,
  "designer_id" INTEGER NOT NULL,
  "category_id" INTEGER NOT NULL,
  "preview_image_url" VARCHAR(300) NOT NULL,
  "is_approved" INTEGER,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "designer_id"
    FOREIGN KEY("designer_id")
    REFERENCES "User"("user_id"),
  CONSTRAINT "category_id"
    FOREIGN KEY("category_id")
    REFERENCES "Category"("category_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."DesignTemplate.designer_id_idx" ON "DesignTemplate" ("designer_id");
CREATE INDEX IF NOT EXISTS "mydb"."DesignTemplate.category_id_idx" ON "DesignTemplate" ("category_id");
CREATE TABLE IF NOT EXISTS "mydb"."CustomDesign"(
  "design_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "customer_id" INTEGER NOT NULL,
  "template_id" INTEGER NOT NULL,
  "design_data" VARCHAR(255),
  "status" VARCHAR(50) NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_id"
    FOREIGN KEY("customer_id")
    REFERENCES "User"("user_id"),
  CONSTRAINT "template_id"
    FOREIGN KEY("template_id")
    REFERENCES "DesignTemplate"("template_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."CustomDesign.customer_id_idx" ON "CustomDesign" ("customer_id");
CREATE INDEX IF NOT EXISTS "mydb"."CustomDesign.template_id_idx" ON "CustomDesign" ("template_id");
CREATE TABLE IF NOT EXISTS "mydb"."Order"(
  "order_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "customer_id" INTEGER NOT NULL,
  "order_date" DATETIME NOT NULL,
  "total_amount" DECIMAL NOT NULL,
  "status" VARCHAR(45) NOT NULL,
  "payment_method" VARCHAR(45) NOT NULL,
  CONSTRAINT "customer_id"
    FOREIGN KEY("customer_id")
    REFERENCES "User"("user_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."Order.customer_id_idx" ON "Order" ("customer_id");
CREATE TABLE IF NOT EXISTS "mydb"."OrderItem"(
  "order_item_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "order_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "design_id" INTEGER,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL NOT NULL,
  CONSTRAINT "order_id"
    FOREIGN KEY("order_id")
    REFERENCES "Order"("order_id"),
  CONSTRAINT "product_id"
    FOREIGN KEY("product_id")
    REFERENCES "Product"("product_id"),
  CONSTRAINT "design_id"
    FOREIGN KEY("design_id")
    REFERENCES "CustomDesign"("design_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."OrderItem.order_id_idx" ON "OrderItem" ("order_id");
CREATE INDEX IF NOT EXISTS "mydb"."OrderItem.product_id_idx" ON "OrderItem" ("product_id");
CREATE INDEX IF NOT EXISTS "mydb"."OrderItem.design_id_idx" ON "OrderItem" ("design_id");
CREATE TABLE IF NOT EXISTS "mydb"."Review"(
  "review_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "customer_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "rating" INTEGER,
  "comment" VARCHAR(255),
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_id"
    FOREIGN KEY("customer_id")
    REFERENCES "User"("user_id"),
  CONSTRAINT "product_id"
    FOREIGN KEY("product_id")
    REFERENCES "Product"("product_id")
);
CREATE INDEX IF NOT EXISTS"mydb"."Review.customer_id_idx" ON "Review" ("customer_id");
CREATE INDEX IF NOT EXISTS "mydb"."Review.product_id_idx" ON "Review" ("product_id");
CREATE TABLE IF NOT EXISTS "mydb"."Log"(
  "log_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "actor_user_id" INTEGER NOT NULL,
  "entity_type" VARCHAR(32) NOT NULL,
  "entity_id" INTEGER,
  "action" VARCHAR(50),
  "old_value" VARCHAR(255),
  "new_value" VARCHAR(255),
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "actor_user_id"
    FOREIGN KEY("actor_user_id")
    REFERENCES "User"("user_id")
);
CREATE INDEX IF NOT EXISTS "mydb"."Log.actor_user_id_idx" ON "Log" ("actor_user_id");
COMMIT;
