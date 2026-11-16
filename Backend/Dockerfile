# LagerKlar – Go/Gin backend
# ---------- Build stage ----------
FROM golang:1.27-alpine AS build
WORKDIR /src

# Download dependencies first so they are cached between builds
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server .

# ---------- Runtime stage ----------
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Europe/Copenhagen \
    GIN_MODE=release \
    PORT=8080
WORKDIR /app

COPY --from=build /out/server ./server
# Served by the "/" route (email templates are embedded in the binary)
COPY templates/ ./templates/

RUN adduser -D -H appuser
USER appuser

EXPOSE 8080
CMD ["./server"]
