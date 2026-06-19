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

detect_public_ip() {
    local IP_TEMP=""
    local IP_PROVIDERS=(
        "https://api.ipify.org"
        "https://ifconfig.me/ip"
        "https://icanhazip.com"
        "https://ipinfo.io/ip"
    )
    for provider in "${IP_PROVIDERS[@]}"; do
        local clean_ip=""
        clean_ip=$(curl -s --max-time 3 "$provider" | tr -d '[:space:]' || true)
        # Ensure it has something and only contains valid IP characters (0-9, a-f, dots, colons)
        if [[ ! -z "$clean_ip" && "$clean_ip" =~ ^[0-9a-fA-F\.:]+$ ]]; then
            # Must contain at least two dots (for IPv4) or two colons (for IPv6)
            if [[ "$clean_ip" =~ \..*\. || "$clean_ip" =~ :.*: ]]; then
                IP_TEMP="$clean_ip"
                break
            fi
        fi
    done

    if [ -z "$IP_TEMP" ]; then
        IP_TEMP=$(hostname -I | awk '{print $1}' | tr -d '[:space:]' || true)
    fi
    
    # Final check if IP_TEMP is empty or contains garbage (non-IP chars)
    if [[ -z "$IP_TEMP" || ! "$IP_TEMP" =~ ^[0-9a-fA-F\.:]+$ || ! ( "$IP_TEMP" =~ \..*\. || "$IP_TEMP" =~ :.*: ) ]]; then
        IP_TEMP="127.0.0.1"
    fi
    echo "$IP_TEMP"
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

    # Ensure correct ownership/permissions
    echo "تنظیم دسترسی‌های دایرکتوری پروژه..."
    chmod -R 777 "$APP_DIR" || true

    echo "نصب پکیج‌ها..."
    npm install

    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    grep -q "^APP_PORT=" .env || echo "APP_PORT=$USER_PORT" >> .env
    grep -q "^PORT=" .env || echo "PORT=$USER_PORT" >> .env
    grep -q "^ADMIN_USERNAME=" .env || echo "ADMIN_USERNAME=$ADMIN_USERNAME" >> .env
    grep -q "^ADMIN_PASSWORD=" .env || echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> .env
    grep -q "^DOMAIN_NAME=" .env || echo "DOMAIN_NAME=$DOMAIN_NAME" >> .env
    grep -q "^INSTALL_SSL=" .env || echo "INSTALL_SSL=$INSTALL_SSL" >> .env
    chmod 666 .env || true
    echo ".env file created and configured."

    echo "ساخت نسخه پروداکشن..."
    npm run build

    # Stop Apache if it is running and blocking port 80
    if systemctl is-active --quiet apache2 || which apache2 &>/dev/null; then
        echo "توقف وب‌سرور Apache جهت جلوگیری از تداخل با Nginx..."
        systemctl stop apache2 &>/dev/null || true
        systemctl disable apache2 &>/dev/null || true
    fi

    echo "نصب PM2 و اجرای سرور..."
    npm install -g pm2
    APP_PM2_NAME="digital-store-$USER_PORT"
    pm2 delete "$APP_PM2_NAME" &>/dev/null || true
    pm2 start dist/server.cjs --name "$APP_PM2_NAME" --cwd "$APP_DIR"
    pm2 save
    pm2 startup
    
    # PM2 Startup Diagnostics Checking
    echo "در حال بررسی وضعیت فرآیند در PM2..."
    sleep 3
    if ! pm2 status "$APP_PM2_NAME" | grep -q "online"; then
        echo "⚠️ فرآیند در PM2 آنلاین نیست! لاگ‌های خطا را بررسی کنید:"
        pm2 logs "$APP_PM2_NAME" --lines 15 --no-daemon &
        PID_LOGS=$!
        sleep 3
        kill $PID_LOGS &>/dev/null || true
    else
        echo "✅ فرآیند با موفقیت در PM2 اجرا شد و آنلاین است."
        echo "آخرین لاگ‌های سرور برای اطمینان از سلامت اجرا:"
        pm2 logs "$APP_PM2_NAME" --lines 10 --no-daemon &
        PID_LOGS=$!
        sleep 3
        kill $PID_LOGS &>/dev/null || true
    fi

    # Local Connection Check
    echo "در حال بررسی پاسخ‌دهی سرور داخلی..."
    local_test=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$USER_PORT || true)
    if [ "$local_test" = "200" ] || [ "$local_test" = "301" ] || [ "$local_test" = "302" ]; then
        echo "✅ سرور داخلی روی پورت $USER_PORT پاسخگو است. (کد وضعیت: $local_test)"
    else
        echo "⚠️ هشدار: سرور داخلی پاسخ مناسبی نمی‌دهد (کد وضعیت: $local_test)."
    fi

    echo "کانفیگ فایروال..."
    ufw allow $USER_PORT || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true

    # Oracle Cloud and general iptables fix
    if command -v iptables &>/dev/null; then
        echo "تنظیم قوانین فایروال iptables جهت بازگشایی پورت‌ها..."
        iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
        iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
        iptables -I INPUT 1 -p tcp --dport $USER_PORT -j ACCEPT || true
        
        # Save iptables if iptables-persistent is installed
        if dpkg -s iptables-persistent &>/dev/null; then
            netfilter-persistent save || true
        fi
    fi

    echo "در حال تنظیمات Nginx (وب‌سرور)..."
    apt-get install -y nginx || true
    systemctl enable nginx || true
    local NGINX_STATUS="success"
    
    if [ ! -z "$DOMAIN_NAME" ]; then
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
        systemctl restart nginx || NGINX_STATUS="failed"
        ufw allow 'Nginx Full' || true

        if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
            echo "در حال نصب گواهی SSL..."
            apt-get install -y certbot python3-certbot-nginx || true
            certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME || echo "خطا در نصب SSL. مطمئن شوید دامنه به این سرور متصل است."
        fi
    else
        echo "در حال پیکربندی Nginx روی پورت پیشفرض ۸۰ به عنوان ریورس پروکسی..."
        cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

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
        ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default || true
        systemctl restart nginx || NGINX_STATUS="failed"
    fi

    # Nginx Verification
    echo "بررسی وضعیت وب‌سرور Nginx..."
    if ! systemctl is-active --quiet nginx; then
         echo "⚠️ خطا: وب‌سرور Nginx راه‌اندازی نشد."
         echo "تلاش برای تشخیص خطا با دستور nginx -t:"
         nginx -t || true
         echo "سرویس‌های در حال اجرا روی پورت ۸۰:"
         netstat -tulpen | grep :80 || ss -tulpn | grep :80 || lsof -i :80 || true
         NGINX_STATUS="failed"
    else
         echo "✅ وب‌سرور Nginx با موفقیت فعال شد."
    fi

    SERVER_IP=$(detect_public_ip)
    SERVER_IP=$(echo "$SERVER_IP" | xargs)
    
    if [ ! -z "$DOMAIN_NAME" ] && [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
        BASE_URL="https://$DOMAIN_NAME"
    elif [ ! -z "$DOMAIN_NAME" ]; then
        BASE_URL="http://$DOMAIN_NAME"
    else
        if [ "$NGINX_STATUS" = "success" ]; then
            BASE_URL="http://$SERVER_IP"
        else
            BASE_URL="http://$SERVER_IP:$USER_PORT"
        fi
    fi

    echo "=========================================="
    echo "نصب با موفقیت انجام شد!"
    echo "آدرس سایت شما:"
    echo "$BASE_URL"
    if [ -z "$DOMAIN_NAME" ] && [ "$NGINX_STATUS" = "success" ]; then
        echo "آدرس جایگزین مستقیم (پورت): http://$SERVER_IP:$USER_PORT"
    fi
    echo ""
    echo "آدرس پنل مدیریت:"
    echo "$BASE_URL/admin"
    if [ -z "$DOMAIN_NAME" ] && [ "$NGINX_STATUS" = "success" ]; then
        echo "آدرس جایگزین مدیریت (پورت): http://$SERVER_IP:$USER_PORT/admin"
    fi
    echo "یوزرنیم: $ADMIN_USERNAME"
    echo "رمزعبور: $ADMIN_PASSWORD"
    echo "=========================================="
    read -p "Press enter to return..."
}

update_app() {
    if [ ! -d "$APP_DIR" ]; then
        echo "پروژه‌ای برای بروزرسانی یافت نشد!"
        read -p "Press enter to return..." < /dev/tty
        return
    fi
    
    echo "=========================================="
    echo "بروزرسانی و تنظیمات مجدد"
    echo "=========================================="
    
    # Load existing env if available
    local USER_PORT=3000
    local ADMIN_USERNAME="admin"
    local ADMIN_PASSWORD="1234"
    local DOMAIN_NAME=""
    local INSTALL_SSL="n"
    
    if [ -f "$APP_DIR/.env" ]; then
        USER_PORT=$(grep "^APP_PORT=" "$APP_DIR/.env" | cut -d '=' -f2) || USER_PORT=$(grep "^PORT=" "$APP_DIR/.env" | cut -d '=' -f2) || true
        ADMIN_USERNAME=$(grep "^ADMIN_USERNAME=" "$APP_DIR/.env" | cut -d '=' -f2) || true
        ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" "$APP_DIR/.env" | cut -d '=' -f2) || true
        DOMAIN_NAME=$(grep "^DOMAIN_NAME=" "$APP_DIR/.env" | cut -d '=' -f2) || true
        INSTALL_SSL=$(grep "^INSTALL_SSL=" "$APP_DIR/.env" | cut -d '=' -f2) || true
    fi
    
    USER_PORT=${USER_PORT:-3000}
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-1234}
    
    echo "تنظیمات شناسایی شده قبلی:"
    echo "- پورت: $USER_PORT"
    echo "- یوزرنیم ادمین: $ADMIN_USERNAME"
    if [ ! -z "$DOMAIN_NAME" ]; then
        echo "- دامنه متصل: $DOMAIN_NAME (SSL: $INSTALL_SSL)"
    fi
    echo ""
    echo "در حال دریافت آخرین تغییرات و به روز رسانی مخزن..."
    
    cd $APP_DIR
    git reset --hard
    git pull origin main

    # Ensure correct ownership/permissions
    echo "تنظیم مجدد دسترسی‌های دایرکتوری پروژه..."
    chmod -R 777 "$APP_DIR" || true

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
    grep -q "^DOMAIN_NAME=" .env && sed -i "s/^DOMAIN_NAME=.*/DOMAIN_NAME=$DOMAIN_NAME/" .env || echo "DOMAIN_NAME=$DOMAIN_NAME" >> .env
    grep -q "^INSTALL_SSL=" .env && sed -i "s/^INSTALL_SSL=.*/INSTALL_SSL=$INSTALL_SSL/" .env || echo "INSTALL_SSL=$INSTALL_SSL" >> .env
    chmod 666 .env || true

    echo "بیلد مجدد..."
    npm run build

    # Stop Apache if it is running and blocking port 80
    if systemctl is-active --quiet apache2 || which apache2 &>/dev/null; then
        echo "توقف وب‌سرور Apache جهت جلوگیری از تداخل با Nginx..."
        systemctl stop apache2 &>/dev/null || true
        systemctl disable apache2 &>/dev/null || true
    fi

    echo "ری‌استارت سرور..."
    APP_PM2_NAME="digital-store-$USER_PORT"
    pm2 delete "$APP_PM2_NAME" &>/dev/null || true
    pm2 start dist/server.cjs --name "$APP_PM2_NAME" --cwd "$APP_DIR"
    pm2 save
    
    # PM2 Startup Diagnostics Checking
    echo "در حال بررسی وضعیت فرآیند در PM2..."
    sleep 3
    if ! pm2 status "$APP_PM2_NAME" | grep -q "online"; then
        echo "⚠️ فرآیند در PM2 آنلاین نیست! لاگ‌های خطا را بررسی کنید:"
        pm2 logs "$APP_PM2_NAME" --lines 15 --no-daemon &
        PID_LOGS=$!
        sleep 3
        kill $PID_LOGS &>/dev/null || true
    else
        echo "✅ فرآیند با موفقیت در PM2 اجرا شد و آنلاین است."
        echo "آخرین لاگ‌های سرور برای اطمینان از سلامت اجرا:"
        pm2 logs "$APP_PM2_NAME" --lines 10 --no-daemon &
        PID_LOGS=$!
        sleep 3
        kill $PID_LOGS &>/dev/null || true
    fi

    # Local Connection Check
    echo "در حال بررسی پاسخ‌دهی سرور داخلی..."
    local_test=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$USER_PORT || true)
    if [ "$local_test" = "200" ] || [ "$local_test" = "301" ] || [ "$local_test" = "302" ]; then
        echo "✅ سرور داخلی روی پورت $USER_PORT پاسخگو است. (کد وضعیت: $local_test)"
    else
        echo "⚠️ هشدار: سرور داخلی پاسخ مناسبی نمی‌دهد (کد وضعیت: $local_test)."
    fi

    echo "کانفیگ فایروال..."
    ufw allow $USER_PORT || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true

    # Oracle Cloud and general iptables fix
    if command -v iptables &>/dev/null; then
        echo "تنظیم قوانین فایروال iptables جهت بازگشایی پورت‌ها..."
        iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT || true
        iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT || true
        iptables -I INPUT 1 -p tcp --dport $USER_PORT -j ACCEPT || true
        
        # Save iptables if iptables-persistent is installed
        if dpkg -s iptables-persistent &>/dev/null; then
            netfilter-persistent save || true
        fi
    fi

    echo "در حال تنظیم مجدد و اعمال وب‌سرور Nginx..."
    apt-get install -y nginx || true
    systemctl enable nginx || true
    local NGINX_STATUS="success"

    if [ ! -z "$DOMAIN_NAME" ]; then
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
        systemctl restart nginx || NGINX_STATUS="failed"
        ufw allow 'Nginx Full' || true

        if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
            echo "در حال نصب/بروزرسانی گواهی SSL..."
            apt-get install -y certbot python3-certbot-nginx || true
            certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME || echo "خطا در نصب SSL."
        fi
    else
        echo "در حال پیکربندی Nginx روی پورت پیشفرض ۸۰ به عنوان ریورس پروکسی..."
        cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

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
        ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default || true
        systemctl restart nginx || NGINX_STATUS="failed"
    fi

    # Nginx Verification
    echo "بررسی وضعیت وب‌سرور Nginx..."
    if ! systemctl is-active --quiet nginx; then
         echo "⚠️ خطا: وب‌سرور Nginx راه‌اندازی نشد."
         echo "تلاش برای تشخیص خطا با دستور nginx -t:"
         nginx -t || true
         echo "سرویس‌های در حال اجرا روی پورت ۸۰:"
         netstat -tulpen | grep :80 || ss -tulpn | grep :80 || lsof -i :80 || true
         NGINX_STATUS="failed"
    else
         echo "✅ وب‌سرور Nginx با موفقیت فعال شد."
    fi

    SERVER_IP=$(detect_public_ip)
    SERVER_IP=$(echo "$SERVER_IP" | xargs)
    
    if [ ! -z "$DOMAIN_NAME" ] && [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
        BASE_URL="https://$DOMAIN_NAME"
    elif [ ! -z "$DOMAIN_NAME" ]; then
        BASE_URL="http://$DOMAIN_NAME"
    else
        if [ "$NGINX_STATUS" = "success" ]; then
            BASE_URL="http://$SERVER_IP"
        else
            BASE_URL="http://$SERVER_IP:$USER_PORT"
        fi
    fi

    echo "=========================================="
    echo "بروزرسانی با موفقیت انجام شد!"
    echo "آدرس سایت شما:"
    echo "$BASE_URL"
    if [ -z "$DOMAIN_NAME" ] && [ "$NGINX_STATUS" = "success" ]; then
        echo "آدرس جایگزین مستقیم (پورت): http://$SERVER_IP:$USER_PORT"
    fi
    echo ""
    echo "آدرس پنل مدیریت:"
    echo "$BASE_URL/admin"
    if [ -z "$DOMAIN_NAME" ] && [ "$NGINX_STATUS" = "success" ]; then
        echo "آدرس جایگزین مدیریت (پورت): http://$SERVER_IP:$USER_PORT/admin"
    fi
    echo "یوزرنیم: $ADMIN_USERNAME"
    echo "رمزعبور: $ADMIN_PASSWORD"
    echo "=========================================="
    read -p "Press enter to return..." < /dev/tty
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
