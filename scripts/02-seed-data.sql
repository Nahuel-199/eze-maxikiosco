-- Insert default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@kiosco.com', '$2a$10$rKJ0xvFvYvZmvZvhvZvhvO7yKcCJQqKqKqKqKqKqKqKqKqKqKq', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description, icon) VALUES
  ('Bebidas', 'Gaseosas, jugos, aguas', '🥤'),
  ('Snacks', 'Papas fritas, galletitas, golosinas', '🍿'),
  ('Cigarrillos', 'Cigarrillos y tabacos', '🚬'),
  ('Almacén', 'Productos de almacén general', '🏪'),
  ('Lácteos', 'Leche, yogures, quesos', '🥛'),
  ('Congelados', 'Helados y productos congelados', '🍦'),
  ('Limpieza', 'Productos de limpieza', '🧹'),
  ('Librería', 'Artículos de librería', '📝')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, sku, barcode, category_id, price, cost, stock, min_stock) 
SELECT 
  'Coca Cola 500ml', 'Gaseosa Coca Cola 500ml', 'CC500', '7790001001', 
  (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1),
  1200.00, 800.00, 50, 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CC500');

INSERT INTO products (name, description, sku, barcode, category_id, price, cost, stock, min_stock)
SELECT 
  'Pepsi 500ml', 'Gaseosa Pepsi 500ml', 'PP500', '7790001002',
  (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1),
  1100.00, 750.00, 45, 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PP500');

INSERT INTO products (name, description, sku, barcode, category_id, price, cost, stock, min_stock)
SELECT 
  'Lays Clásicas', 'Papas fritas Lays sabor clásico', 'LAYS001', '7790002001',
  (SELECT id FROM categories WHERE name = 'Snacks' LIMIT 1),
  1500.00, 1000.00, 30, 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'LAYS001');

INSERT INTO products (name, description, sku, barcode, category_id, price, cost, stock, min_stock)
SELECT 
  'Oreo Original', 'Galletitas Oreo pack original', 'OREO001', '7790002002',
  (SELECT id FROM categories WHERE name = 'Snacks' LIMIT 1),
  2000.00, 1400.00, 25, 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'OREO001');

INSERT INTO products (name, description, sku, barcode, category_id, price, cost, stock, min_stock)
SELECT 
  'Marlboro Box', 'Cigarrillos Marlboro Box 20u', 'MARL001', '7790003001',
  (SELECT id FROM categories WHERE name = 'Cigarrillos' LIMIT 1),
  3500.00, 2800.00, 100, 20
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MARL001');
