# UNTESTED. Written for self-hosting on a VPS; build and try it on a staging box before relying on it.
# NEXT_PUBLIC_* values are baked into the browser code at BUILD time, so pass them as build args:
#   docker build -t lexdesk \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://app.example.com .
# Secrets (SUPABASE_SERVICE_ROLE_KEY, SMTP_*, CRON_SECRET) are passed at RUN time:
#   docker run -p 3000:3000 --env-file .env.local lexdesk
# A container has no scheduler: call /api/cron/daily daily (see docs/DEPLOY.md, GitHub Actions workflow).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_NAME=LexDesk
ARG NEXT_PUBLIC_COMPANY_NAME
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP
ARG NEXT_PUBLIC_JURISDICTION=Pakistan
ARG NEXT_PUBLIC_TIMEZONE=Asia/Karachi
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME \
    NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL \
    NEXT_PUBLIC_SUPPORT_WHATSAPP=$NEXT_PUBLIC_SUPPORT_WHATSAPP \
    NEXT_PUBLIC_JURISDICTION=$NEXT_PUBLIC_JURISDICTION \
    NEXT_PUBLIC_TIMEZONE=$NEXT_PUBLIC_TIMEZONE \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# runs `next start` (not the standalone output, which would need output: 'standalone' in next.config.ts)
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
