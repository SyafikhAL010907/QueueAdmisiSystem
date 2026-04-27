FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    supervisor \
    nginx

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr


# Copy existing application directory contents
COPY . /var/www

# Install dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Copy supervisor configuration
COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port 8000
EXPOSE 8000

# Start fresh migration, seed data from SQL, and then supervisor
CMD sed -i "s/listen 8000;/listen ${PORT:-8000};/g" /var/www/nginx.conf && php -d memory_limit=512M artisan migrate:fresh --seed --force && /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf





