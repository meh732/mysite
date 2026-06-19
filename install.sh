#!/usr/bin/env bash

# Digital Store - Installer Script

set -e

APP_DIR="/opt/digital-store"
REPO_URL="https://github.com/meh732/mysite.git"
NODE_VERSION="20"

print_header() {
    clear
    echo "=========================================="
    echo "        Digital Store Server Setup        "
    echo "=========================================="
    echo ""
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "لطفا این اسکریپت را با دسترسی root اجرا کنید: sudo bash install.sh"
        exit 1
    fi
}

install_app() {
    if [ -d "$APP_DIR" ]; then
        echo "اسکریپت نصب قبلا اجرا شده است. مسیر $APP_DIR وجود دارد."
        echo "برای بروزرسانی لطفا از منوی اول گزینه 2 را انتخاب کنید."
        read -p "Press enter to return..."
        return
    fi
    
    echo "در حال آپدیت سیستم و نصب پیش‌نیازها..."
    apt-get update -y
    apt-get install -y curl git ufw

    echo "در حال نصب Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    apt-get install -y nodejs
    
    echo "کلون کردن پروژه..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR

    echo "نصب پکیج‌ها..."
    npm install

    if [ ! -f .env ]; then
        cp .env.example .env
        echo ".env file created. لطفا توکن‌ها را در آن وارد کنید."
    fi

    echo "ساخت نسخه پروداکشن..."
    npm run build

    echo "نصب PM2 و اجرای سرور..."
    npm install -g pm2
    pm2 start dist/server.cjs --name digital-store
    pm2 save
    pm2 startup
    
    echo "کانفیگ فایروال (Optional)..."
    ufw allow 3000

    echo "=========================================="
    echo "نصب با موفقیت انجام شد!"
    echo "سایت شما روی پورت 3000 در دسترس است."
    echo "جهت امنیت، پیشنهاد میشود یک Reverse Proxy مثل Nginx با SSL نصب کنید."
    echo "=========================================="
    read -p "Press enter to return..."
}

update_app() {
    if [ ! -d "$APP_DIR" ]; then
        echo "پروژه‌ای برای بروزرسانی یافت نشد!"
        read -p "Press enter to return..."
        return
    fi
    
    echo "در حال دریافت آخرین تغییرات..."
    cd $APP_DIR
    git pull origin main

    echo "نصب پکیج‌ها..."
    npm install

    echo "بیلد مجدد..."
    npm run build

    echo "ری‌استارت سرور..."
    pm2 restart digital-store
    
    echo "بروزرسانی با موفقیت انجام شد."
    read -p "Press enter to return..."
}

uninstall_app() {
    echo "اخطار: این عملیات قابل بازگشت نیست و تمامی اطلاعات و فایل‌ها پاک خواهند شد!"
    read -p "آیا مطمان هستید؟ (y/N) " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo "در حال متوقف کردن سرور..."
        pm2 stop digital-store || true
        pm2 delete digital-store || true
        pm2 save || true
        
        echo "حذف فایل‌ها..."
        rm -rf $APP_DIR
        
        echo "حذف با موفقیت انجام شد."
    else
        echo "عملیات لغو شد."
    fi
    read -p "Press enter to return..."
}

while true; do
    print_header
    echo "1) نصب (Install)"
    echo "2) بروزرسانی (Update)"
    echo "3) حذف نصب (Uninstall)"
    echo "0) خروج"
    echo ""
    read -p "انتخاب شما: " choice

    case $choice in
        1)
            check_root
            install_app
            ;;
        2)
            check_root
            update_app
            ;;
        3)
            check_root
            uninstall_app
            ;;
        0)
            echo "خروج..."
            exit 0
            ;;
        *)
            echo "انتخاب نامعتبر"
            sleep 1
            ;;
    esac
done
