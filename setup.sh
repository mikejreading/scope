#!/bin/bash
set -e

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from env.example..."
    cp env.example .env
    
    # Generate a random secret for NEXTAUTH_SECRET
    echo "Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|your-nextauth-secret-here|$SECRET|" .env
    rm .env.bak
    
    echo "\n✅ .env file created with a random NEXTAUTH_SECRET"
else
    echo "\nℹ️  .env file already exists, skipping creation"
fi

# Start the database
if ! docker ps | grep -q scope-platform-db; then
    echo "\nStarting PostgreSQL database with Docker..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo -n "Waiting for PostgreSQL to be ready..."
    until docker exec scope-platform-db pg_isready -U postgres > /dev/null 2>&1; do
        echo -n "."
        sleep 1
    done
    echo -e "\n✅ PostgreSQL is ready!"
else
    echo "\nℹ️  PostgreSQL container is already running"
fi

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "\nInstalling Node.js dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "\nℹ️  Node.js dependencies already installed"
fi

# Run database migrations
echo "\nRunning database migrations..."
npx prisma migrate dev --name init

# Build the project
echo "\nBuilding the project..."
npm run build

echo "\n✨ Setup complete! You can now start the development server with:"
echo "   npm run dev"
