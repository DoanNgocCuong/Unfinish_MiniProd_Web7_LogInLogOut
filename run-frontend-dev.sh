#!/bin/bash

# Cài Node.js trong WSL (nếu chưa có)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Kiểm tra version
node --version
npm --version

# Chuyển đến thư mục frontend
cd frontend

# # Xóa node_modules cũ nếu cần
# rm -rf node_modules package-lock.json

# Cài đặt lại dependencies
npm install

# Thêm các biến môi trường cho WSL
export CHOKIDAR_USEPOLLING=true
export WATCHPACK_POLLING=true
export WDS_SOCKET_PORT=0

# Start frontend application
npm start