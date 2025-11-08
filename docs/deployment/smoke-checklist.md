# Post-Deploy Smoke Checklist

Run these checks after every production deploy (API + mobile build). Record results in the release ticket.

## API

- [ ] `GET /health` → `200`
- [ ] OTP request (`POST /auth/request-otp`) returns success + rate-limit headers
- [ ] OTP verification issues JWTs and creates user if new
- [ ] USDA search fallback works (`node apps/api/test-api.js usda:search "greek yogurt"`)
- [ ] Text analysis pipeline works (`node apps/api/test-api.js analyze-text "oatmeal 60g with milk"`)
- [ ] Articles feed (`GET /articles`) cached response
- [ ] AI assistant session start + resume
- [ ] Notifications preference GET/PUT round-trip

## Storage & Assets

- [ ] MinIO bucket contains uploaded meal photos
- [ ] Uploaded media returns signed URLs/display in mobile client

## Mobile Client (TestFlight build)

- [ ] OTP login completes (email arrives via SendGrid)
- [ ] Camera capture + analysis result (health score, feedback, recently list)
- [ ] Articles screen renders featured + search
- [ ] Profile screen toggles daily push notifications and persists
- [ ] Push token registered in `/notifications/push-token`
- [ ] AI assistant flow can be stopped/resumed

## Observability

- [ ] Railway logs show successful boot + no unhandled rejections
- [ ] Redis connected and cache hit logs present
- [ ] Prisma migrations applied (no pending)
- [ ] SendGrid dashboard shows transactional email volume

Sign off once all boxes are checked. If an item fails, create an incident or roll back immediately.
