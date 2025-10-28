#!/bin/bash

# CalorieCam Production Deployment Script
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

log "Starting CalorieCam deployment for $ENVIRONMENT environment"

# Check requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose >/dev/null 2>&1; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [[ ! -f ".env.production" ]]; then
        warn ".env.production file not found. Creating from template..."
        create_env_template
    fi
    
    log "✅ Requirements check passed"
}

# Create environment template
create_env_template() {
    cat > .env.production << 'EOF'
# Database Configuration
DATABASE_USER=caloriecam_user
DATABASE_PASSWORD=secure_password_change_me
DATABASE_URL=postgresql://caloriecam_user:secure_password_change_me@postgres:5432/caloriecam

# Redis Configuration
REDIS_PASSWORD=redis_secure_password

# JWT Configuration
JWT_SECRET=jwt_super_secret_key_change_me
JWT_REFRESH_SECRET=jwt_refresh_super_secret_key_change_me

# API Keys (replace with your actual keys)
OPENAI_API_KEY=your-openai-api-key
USDA_API_KEY=your-usda-api-key

# Server Configuration
API_BASE_URL=https://api.caloriecam.com
CORS_ORIGIN=https://caloriecam.com,https://www.caloriecam.com

# Monitoring
GRAFANA_PASSWORD=admin_password_change_me

# Domain Configuration (update these with your actual domains)
DOMAIN=caloriecam.com
API_DOMAIN=api.caloriecam.com
MONITORING_DOMAIN=monitoring.caloriecam.com
EOF

    warn "Please edit .env.production with your actual configuration before continuing!"
    read -p "Press Enter when you've updated the .env.production file..."
}

# SSL Certificate setup
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p nginx/ssl
    
    # Check if certificates exist
    if [[ ! -f "nginx/ssl/caloriecam.com.crt" ]] || [[ ! -f "nginx/ssl/api.caloriecam.com.crt" ]]; then
        warn "SSL certificates not found."
        echo "You need to obtain SSL certificates. Options:"
        echo "1. Use Let's Encrypt (recommended)"
        echo "2. Use existing certificates"
        echo "3. Generate self-signed certificates (development only)"
        
        read -p "Choose option (1-3): " ssl_option
        
        case $ssl_option in
            1)
                setup_letsencrypt
                ;;
            2)
                echo "Please place your certificates in the nginx/ssl/ directory:"
                echo "  - caloriecam.com.crt and caloriecam.com.key"
                echo "  - api.caloriecam.com.crt and api.caloriecam.com.key"
                echo "  - monitoring.caloriecam.com.crt and monitoring.caloriecam.com.key"
                read -p "Press Enter when certificates are in place..."
                ;;
            3)
                generate_selfsigned_certs
                ;;
            *)
                error "Invalid option"
                exit 1
                ;;
        esac
    fi
    
    log "✅ SSL certificates configured"
}

# Let's Encrypt setup
setup_letsencrypt() {
    log "Setting up Let's Encrypt certificates..."
    
    # Install certbot if not present
    if ! command -v certbot >/dev/null 2>&1; then
        log "Installing certbot..."
        if command -v apt >/dev/null 2>&1; then
            sudo apt update && sudo apt install -y certbot
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y certbot
        else
            error "Please install certbot manually"
            exit 1
        fi
    fi
    
    # Get certificates
    domains=("caloriecam.com" "www.caloriecam.com" "api.caloriecam.com" "monitoring.caloriecam.com")
    
    for domain in "${domains[@]}"; do
        log "Obtaining certificate for $domain..."
        sudo certbot certonly --standalone -d "$domain" --agree-tos --register-unsafely-without-email
        
        # Copy certificates to nginx directory
        sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" "nginx/ssl/$domain.crt"
        sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" "nginx/ssl/$domain.key"
        sudo chown $USER:$USER "nginx/ssl/$domain.crt" "nginx/ssl/$domain.key"
    done
}

# Generate self-signed certificates
generate_selfsigned_certs() {
    warn "Generating self-signed certificates (not suitable for production!)"
    
    domains=("caloriecam.com" "api.caloriecam.com" "monitoring.caloriecam.com")
    
    for domain in "${domains[@]}"; do
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "nginx/ssl/$domain.key" \
            -out "nginx/ssl/$domain.crt" \
            -subj "/C=US/ST=CA/L=San Francisco/O=CalorieCam/CN=$domain"
    done
}

# Build and deploy
deploy() {
    log "Building and deploying services..."
    
    # Load environment
    set -a
    source .env.production
    set +a
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f $COMPOSE_FILE pull
    
    # Build custom images
    log "Building API image..."
    docker-compose -f $COMPOSE_FILE build api
    
    # Start services
    log "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec -T api npx prisma migrate deploy || warn "Migration failed - database might already be up to date"
    
    # Health check
    health_check
}

# Health check
health_check() {
    log "Running health checks..."
    
    services=("postgres:5432" "redis:6379" "api:3000")
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        log "Checking $service_name..."
        if docker-compose -f $COMPOSE_FILE exec -T $service_name nc -z localhost $port; then
            log "✅ $service_name is healthy"
        else
            error "❌ $service_name health check failed"
        fi
    done
    
    # Check API endpoint
    log "Checking API endpoint..."
    sleep 5
    if curl -sf http://localhost:3000/health > /dev/null; then
        log "✅ API health check passed"
    else
        warn "❌ API health check failed - checking logs..."
        docker-compose -f $COMPOSE_FILE logs api --tail 20
    fi
}

# Show status
show_status() {
    log "Deployment status:"
    docker-compose -f $COMPOSE_FILE ps
    
    echo
    log "Service URLs:"
    echo "🌐 API: https://api.caloriecam.com"
    echo "📊 Monitoring: https://monitoring.caloriecam.com"
    echo "📈 Grafana: https://monitoring.caloriecam.com"
    echo "🔍 Prometheus: https://monitoring.caloriecam.com/prometheus"
    
    echo
    log "Useful commands:"
    echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "🔄 Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
    echo "🛑 Stop all: docker-compose -f $COMPOSE_FILE down"
    echo "🗑️  Clean up: docker-compose -f $COMPOSE_FILE down -v --remove-orphans"
}

# Backup function
backup() {
    log "Creating backup..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="backups/backup_$timestamp"
    mkdir -p $backup_dir
    
    # Database backup
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U caloriecam_user caloriecam > "$backup_dir/database.sql"
    
    # Redis backup
    docker-compose -f $COMPOSE_FILE exec -T redis redis-cli BGSAVE
    docker cp $(docker-compose -f $COMPOSE_FILE ps -q redis):/data/dump.rdb "$backup_dir/redis.rdb"
    
    # Environment backup
    cp .env.production "$backup_dir/"
    
    log "✅ Backup created in $backup_dir"
}

# Main execution
case "${2:-deploy}" in
    "check")
        check_requirements
        ;;
    "ssl")
        setup_ssl
        ;;
    "deploy")
        check_requirements
        setup_ssl
        deploy
        show_status
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup
        ;;
    "logs")
        docker-compose -f $COMPOSE_FILE logs -f ${3:-}
        ;;
    "restart")
        docker-compose -f $COMPOSE_FILE restart ${3:-}
        ;;
    "stop")
        docker-compose -f $COMPOSE_FILE down
        ;;
    "clean")
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        ;;
    *)
        echo "Usage: $0 [environment] [command]"
        echo "Commands:"
        echo "  check   - Check system requirements"
        echo "  ssl     - Setup SSL certificates"
        echo "  deploy  - Full deployment (default)"
        echo "  status  - Show deployment status"
        echo "  backup  - Create backup"
        echo "  logs    - View logs"
        echo "  restart - Restart services"
        echo "  stop    - Stop all services"
        echo "  clean   - Stop and remove all data"
        exit 1
        ;;
esac
