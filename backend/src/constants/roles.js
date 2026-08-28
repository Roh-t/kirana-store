export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_OWNER: 'STORE_OWNER',
  STORE_MANAGER: 'STORE_MANAGER',
  BILLING_STAFF: 'BILLING_STAFF',
  CASHIER: 'CASHIER'
};

export const DEFAULT_PERMISSIONS = [
  { code: 'STORES:READ', module: 'stores', description: 'View store profiles' },
  { code: 'STORES:WRITE', module: 'stores', description: 'Update store settings' },
  { code: 'PRODUCTS:READ', module: 'products', description: 'View catalog products' },
  { code: 'PRODUCTS:WRITE', module: 'products', description: 'Create and edit products' },
  { code: 'PRODUCTS:DELETE', module: 'products', description: 'Soft delete products' },
  { code: 'CATEGORIES:READ', module: 'categories', description: 'View category list' },
  { code: 'CATEGORIES:WRITE', module: 'categories', description: 'Manage categories' },
  { code: 'INVENTORY:READ', module: 'inventory', description: 'View stock levels' },
  { code: 'INVENTORY:WRITE', module: 'inventory', description: 'Adjust inventory balances' },
  { code: 'ORDERS:READ', module: 'orders', description: 'View live order queue' },
  { code: 'ORDERS:WRITE', module: 'orders', description: 'Update order lifecycle status' },
  { code: 'ORDERS:CANCEL', module: 'orders', description: 'Cancel placed orders' },
  { code: 'BILLING:WRITE', module: 'billing', description: 'Generate invoices and settlement' },
  { code: 'REPORTS:READ', module: 'reports', description: 'Access store performance analytics' }
];