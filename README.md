E-Commerce Backend — Advanced Inventory & Pricing System

This project is a fully functional backend for an e-commerce platform with real-time inventory tracking, dynamic pricing, cart reservation, and checkout logic, built using:

Node.js

Express

Prisma ORM

PostgreSQL

This system goes beyond basic CRUD and implements real business rules used in real e-commerce platforms.

🚀 Features Implemented
✅ Products & Variants

Products belong to categories

Variants support size/color

Each variant has:

SKU

stockQuantity

reservedQuantity

priceAdjustment

💰 Dynamic Pricing Engine

Supports multiple pricing rules:

Bulk discount rules

Calculates final price based on:

Quantity

Product base price

Variant price adjustment

Returns full discount breakdown.

🛒 Cart Management System

Supports:

Add item to cart

Update item quantity

Remove item

View cart

Each add/update:

Reserves stock for 15 minutes

Uses transactions to prevent overselling

Creates price snapshot at time of adding

🛍 Checkout

Converts reserved stock → permanent stock reduction

Saves order + order items

Clears cart

Prevents checkout if insufficient inventory

📌 API Endpoints
Health
GET /health

Products & Pricing

Get dynamic price:

GET /products/:productId/variants/:variantId/price?quantity=5


Response contains:

Final unit price

Total price

Applied discounts

Cart

Add to cart:

POST /cart/items
{
  "variantId": 1,
  "quantity": 2
}


Update cart item:

PUT /cart/items/:itemId


Remove cart item:

DELETE /cart/items/:itemId


Get cart:

GET /cart


Checkout:

POST /cart/checkout

🗄 Database Schema (Prisma)

Models implemented:

Category

Product

Variant

PricingRule

Cart

CartItem

Order

OrderItem

Supports:

Hierarchical categories

Pricing rules

Stock reservation

Transactions

▶️ How to Run the Project
Install packages:
npm install

Run migrations:
npx prisma migrate dev

Start server:
npm run dev

🛠 Tech Stack
Component	Technology
Backend	Node.js + Express
ORM	Prisma
Database	PostgreSQL
Tools	Thunder Client / Postman
📦 Folder Structure
/src
  db.js
  index.js
  pricingEngine.js
/prisma
  schema.prisma
.env
package.json
prisma.config.ts

📝 Author

Mounika Bandharu
GitHub: https://github.com/Mounika4406
