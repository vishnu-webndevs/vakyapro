FROM composer:2 AS composer_build
WORKDIR /app
COPY . .
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

FROM php:8.2-apache AS app
WORKDIR /var/www/html

RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq-dev libzip-dev unzip \
 && docker-php-ext-install pdo_mysql pdo_pgsql pgsql zip opcache \
 && a2enmod rewrite headers expires \
 && rm -rf /var/lib/apt/lists/*
RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
 && sed -ri 's/AllowOverride\\s+None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY --from=composer_build /app /var/www/html

RUN php artisan storage:link || true

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["bash", "-lc", "set -e; mkdir -p storage/app/public storage/app/public/app-settings storage/app/public/avatars storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache; chown -R www-data:www-data storage bootstrap/cache; chmod -R ug+rwX storage bootstrap/cache; php artisan storage:link || true; apache2-foreground"]
