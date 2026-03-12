FROM node:20-alpine AS node_build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY vite.config.js ./
COPY resources ./resources
COPY public ./public
RUN npm run build

FROM composer:2 AS composer_build
WORKDIR /app
COPY . .
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

FROM php:8.2-apache AS app
WORKDIR /var/www/html

RUN apt-get update \
 && apt-get install -y --no-install-recommends libzip-dev unzip \
 && docker-php-ext-install pdo_mysql zip opcache \
 && a2enmod rewrite \
 && rm -rf /var/lib/apt/lists/*

RUN sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
 && sed -ri 's/AllowOverride\\s+None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY --from=composer_build /app /var/www/html
COPY --from=node_build /app/public/build /var/www/html/public/build

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
