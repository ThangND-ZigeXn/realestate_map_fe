### DEPS
FROM node:24-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /realestate_map_fe

COPY package.json yarn.lock* ./

RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else echo "No lockfile found." && exit 1; \
  fi

### BUILDER
FROM node:24-alpine AS builder

WORKDIR /realestate_map_fe

# Build arguments for Next.js public env vars (inlined at build time)
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_GEMINI_API_KEY

# Set as environment variables for build
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY

COPY --from=deps /realestate_map_fe/node_modules ./node_modules

COPY . .

RUN yarn build

### RUNNER
FROM node:24-alpine AS runner

WORKDIR /realestate_map_fe

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# ENV NEXT_TELEMETRY_DISABLED 1

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /realestate_map_fe/public ./public

COPY --from=builder --chown=nextjs:nodejs /realestate_map_fe/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /realestate_map_fe/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
