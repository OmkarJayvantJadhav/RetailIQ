# Data Validation Report


## Primary Key Checks
- ✅ State Demographics `state` is unique
- ✅ Customers `customer_id` is unique
- ✅ Products `product_id` is unique
- ✅ Warehouses `warehouse_id` is unique
- ✅ Orders `order_id` is unique
- ✅ Order Items `order_item_id` is unique
- ✅ Returns `return_id` is unique
- ✅ Payments `payment_id` is unique
- ✅ Inventory `warehouse_id, product_id` is unique

## Foreign Key Checks
- ✅ Customer -> State: 0 invalid references
- ✅ Order -> Customer: 0 invalid references
- ✅ OrderItem -> Order: 0 invalid references
- ✅ OrderItem -> Product: 0 invalid references
- ✅ Inventory -> Warehouse: 0 invalid references
- ✅ Inventory -> Product: 0 invalid references
- ✅ Return -> Order: 0 invalid references
- ✅ Return -> Product: 0 invalid references
- ✅ Payment -> Order: 0 invalid references

## Value Constraints Checks
- ✅ Products: 0 negative prices
- ✅ Order Items: 0 negative quantities
- ✅ Inventory: 0 negative stock

## Business Logic Consistency
- ❌ Order Totals: 15693 mismatches with line items
- ✅ Payment Amounts: 0 mismatches with order totals

## Summary
**Result: FAIL** - Found 1 validation check failures. See above.