set -e

cd "$(dirname "$(realpath "$0")")" || exit
cd ..

git reset --hard HEAD
git pull origin main
docker build --tag nestjs-boilerplate-prod:latest . --no-cache
pnpm docker:prod:down
pnpm docker:prod:up
docker volume prune -f