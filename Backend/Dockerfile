# ---- Build stage ----
FROM golang:1.27-alpine AS build
WORKDIR /src

# Download dependencies first so they are cached between builds
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/lagerklar .

# ---- Runtime stage ----
FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H app
WORKDIR /app

COPY --from=build /out/lagerklar ./lagerklar
# Served at GET / (main.go reads templates/index.html from the working directory)
COPY templates ./templates

USER app
EXPOSE 8080
ENTRYPOINT ["./lagerklar"]
