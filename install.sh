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
    
    echo "=========================================="
    echo "تنظیمات اولیه"
    echo "=========================================="
    read -p "انتخاب پورت (پیشفرض: 3000): " USER_PORT < /dev/tty
    USER_PORT=${USER_PORT:-3000}
    
    read -p "شناسه کاربری ادمین (پیشفرض: admin): " ADMIN_USERNAME < /dev/tty
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    
    read -s -p "رمز عبور ادمین (پیشفرض: 1234): " ADMIN_PASSWORD < /dev/tty
    echo ""
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-1234}
    
    read -p "آیا دامنه ای برای اتصال دارید؟ (در صورت نداشتن اینتر بزنید تا رد شود): " DOMAIN_NAME < /dev/tty
    if [ ! -z "$DOMAIN_NAME" ]; then
        read -p "آیا میخواهید SSL (رایگان Certbot) نصب شود؟ (y/N) " INSTALL_SSL < /dev/tty
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
    fi
    grep -q "^APP_PORT=" .env || echo "APP_PORT=$USER_PORT" >> .env
    grep -q "^PORT=" .env || echo "PORT=$USER_PORT" >> .env
    grep -q "^ADMIN_USERNAME=" .env || echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> .env
    grep -q "^ADMIN_PASSWORD=" .env || echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> .env
    echo ".env file created and configured."

    echo "ساخت نسخه پروداکشن..."
    npm run build

    echo "نصب PM2 و اجرای سرور..."
    npm install -g pm2
    APP_PM2_NAME="digital-store-$USER_PORT"
    pm2 start dist/server.cjs --name $APP_PM2_NAME
    pm2 save
    pm2 startup
    
    echo "کانفیگ فایروال (Optional)..."
    ufw allow $USER_PORT

    if [ ! -z "$DOMAIN_NAME" ]; then
        echo "در حال تنظیمات Nginx (وب‌سرور)..."
        apt-get install -y nginx
        cat <<EOF > /etc/nginx/sites-available/$DOMAIN_NAME
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:$USER_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        ln -sf /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
        systemctl restart nginx
        ufw allow 'Nginx Full'

        if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
            echo "در حال نصب گواهی SSL..."
            apt-get install -y certbot python3-certbot-nginx
            certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME || echo "خطا در نصب SSL. مطمئن شوید دامنه به این سرور متصل است."
        fi
    fi

    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    if [ ! -z "$DOMAIN_NAME" ] && [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
        BASE_URL="https://$DOMAIN_NAME"
    elif [ ! -z "$DOMAIN_NAME" ]; then
        BASE_URL="http://$DOMAIN_NAME"
    else
        BASE_URL="http://$SERVER_IP:$USER_PORT"
    fi

    echo "=========================================="
    echo "نصب با موفقیت انجام شد!"
    echo "آدرس سایت شما:"
    echo "$BASE_URL"
    echo ""
    echo "آدرس پنل مدیریت:"
    echo "$BASE_URL/admin"
    echo "یوزرنیم: $ADMIN_USERNAME"
    echo "رمزعبور: $ADMIN_PASSWORD"
    echo "=========================================="
    read -p "Press enter to return..."
}

update_app() {
    if [ ! -d "$APP_DIR" ]; then
        echo "پروژه‌ای برای بروزرسانی یافت نشد!"
        read -p "Press enter to return..."
        return
    fi
    
    echo "=========================================="
    echo "بروزرسانی و تنظیمات مجدد"
    echo "=========================================="
    # Load existing env if available
    local CURRENT_PORT=3000
    local CURRENT_ADMIN="admin"
    local CURRENT_PASS="1234"
    if [ -f "$APP_DIR/.env" ]; then
        CURRENT_PORT=$(grep "APP_PORT=" "$APP_DIR/.env" | cut -d '=' -f2) || true
        CURRENT_ADMIN=$(grep "ADMIN_USERNAME=" "$APP_DIR/.env" | cut -d '=' -f2) || true
        CURRENT_PASS=$(grep "ADMIN_PASSWORD=" "$APP_DIR/.env" | cut -d '=' -f2) || true
    fi
    CURRENT_PORT=${CURRENT_PORT:-3000}
    CURRENT_ADMIN=${CURRENT_ADMIN:-admin}
    CURRENT_PASS=${CURRENT_PASS:-1234}
    
    read -p "انتخاب پورت (پیشفرض: $CURRENT_PORT): " USER_PORT < /dev/tty
    USER_PORT=${USER_PORT:-$CURRENT_PORT}
    
    read -p "شناسه کاربری ادمین (پیشفرض: $CURRENT_ADMIN): " ADMIN_USERNAME < /dev/tty
    ADMIN_USERNAME=${ADMIN_USERNAME:-$CURRENT_ADMIN}
    
    read -s -p "رمز عبور ادمین (در صورت خالی گذاشتن تغییر نمیکند): " ADMIN_PASSWORD < /dev/tty
    echo ""
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-$CURRENT_PASS}
    
    read -p "آیا دامنه ای برای اتصال دارید؟ (در صورت نداشتن اینتر بزنید تا رد شود): " DOMAIN_NAME < /dev/tty
    if [ ! -z "$DOMAIN_NAME" ]; then
        read -p "آیا میخواهید SSL (رایگان Certbot) نصب/بروز رسانی شود؟ (y/N) " INSTALL_SSL < /dev/tty
    fi
    
    echo "در حال دریافت آخرین تغییرات..."
    cd $APP_DIR
    git reset --hard
    git pull origin main

    echo "نصب پکیج‌ها..."
    npm install
    
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    
    # Update .env file safely
    grep -q "^APP_PORT=" .env && sed -i "s/^APP_PORT=.*/APP_PORT=$USER_PORT/" .env || echo "APP_PORT=$USER_PORT" >> .env
    grep -q "^PORT=" .env && sed -i "s/^PORT=.*/PORT=$USER_PORT/" .env || echo "PORT=$USER_PORT" >> .env
    grep -q "^ADMIN_USERNAME=" .env && sed -i "s/^ADMIN_USERNAME=.*/ADMIN_USERNAME=$ADMIN_USERNAME/" .env || echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> .env
    grep -q "^ADMIN_PASSWORD=" .env && sed -i "s/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" .env || echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> .env

    echo "بیلد مجدد..."
    npm run build

    echo "ری‌استارت سرور..."
    APP_PM2_NAME="digital-store-$USER_PORT"
    pm2 restart $APP_PM2_NAME || pm2 start dist/server.cjs --name $APP_PM2_NAME
    pm2 save
    
    ufw allow $USER_PORT

    if [ ! -z "$DOMAIN_NAME" ]; then
        echo "در حال تنظیمات Nginx (وب‌سرور)..."
        apt-get install -y nginx
        cat <<EOF > /etc/nginx/sites-available/$DOMAIN_NAME
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:$USER_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        ln -sf /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
        systemctl restart nginx
        ufw allow 'Nginx Full'

        if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
            echo "در حال نصب/بروزرسانی گواهی SSL..."
            apt-get install -y certbot python3-certbot-nginx
            certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME || echo "خطا در نصب SSL. مطمئن شوید دامنه به این سرور متصل است."
        fi
    fi

    SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
    
    if [ ! -z "$DOMAIN_NAME" ] && [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
        BASE_URL="https://$DOMAIN_NAME"
    elif [ ! -z "$DOMAIN_NAME" ]; then
        BASE_URL="http://$DOMAIN_NAME"
    else
        BASE_URL="http://$SERVER_IP:$USER_PORT"
    fi

    echo "=========================================="
    echo "بروزرسانی با موفقیت انجام شد!"
    echo "آدرس سایت شما:"
    echo "$BASE_URL"
    echo ""
    echo "آدرس پنل مدیریت:"
    echo "$BASE_URL/admin"
    echo "یوزرنیم: $ADMIN_USERNAME"
    echo "رمزعبور: $ADMIN_PASSWORD"
    echo "=========================================="
    read -p "Press enter to return..."
}

uninstall_app() {
    echo "اخطار: این عملیات قابل بازگشت نیست و تمامی اطلاعات و فایل‌ها پاک خواهند شد!"
    read -p "آیا مطمان هستید؟ (y/N) " confirm < /dev/tty
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo "در حال متوقف کردن سرور..."
        if [ -f "$APP_DIR/.env" ]; then
            P_USER_PORT=$(grep -E "^APP_PORT=" "$APP_DIR/.env" | cut -d '=' -f2) || true
            if [ ! -z "$P_USER_PORT" ]; then
                pm2 stop "digital-store-$P_USER_PORT" || true
                pm2 delete "digital-store-$P_USER_PORT" || true
            fi
        fi
        pm2 stop digital-store || true
        pm2 delete digital-store || true
        pm2 save || true
        
        echo "حذف فایل‌ها..."
        rm -rf $APP_DIR
        
        echo "حذف با موفقیت انجام شد."
    else
        echo "عملیات لغو شد."
    fi
    read -p "Press enter to return..." < /dev/tty
}

while true; do
    print_header
    echo "1) نصب (Install)"
    echo "2) بروزرسانی (Update)"
    echo "3) حذف نصب (Uninstall)"
    echo "0) خروج"
    echo ""
    read -p "انتخاب شما: " choice < /dev/tty

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
