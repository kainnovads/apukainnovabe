#!/bin/bash

# Script untuk setup production environment
echo "Setting up production environment..."

# Buat direktori uploads jika belum ada
echo "Creating upload directories..."
mkdir -p public/uploads/{perusahaan,customers,vendors,products,pegawai,sales_orders}

# Set permission yang tepat
echo "Setting permissions..."
chmod -R 755 public/uploads

# Buat file .gitkeep di setiap direktori
echo "Creating .gitkeep files..."
touch public/uploads/.gitkeep
touch public/uploads/perusahaan/.gitkeep
touch public/uploads/customers/.gitkeep
touch public/uploads/vendors/.gitkeep
touch public/uploads/products/.gitkeep
touch public/uploads/pegawai/.gitkeep
touch public/uploads/sales_orders/.gitkeep

echo "Production setup completed!"
echo "Upload directories created:"
ls -la public/uploads/
