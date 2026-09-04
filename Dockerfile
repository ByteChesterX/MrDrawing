FROM golang:1.22-alpine AS go
WORKDIR /app
COPY go.mod main.go ./
RUN go mod tidy && CGO_ENABLED=0 go build -ldflags="-s -w" -o server .

FROM scratch
COPY --from=go /app/server /server
COPY public /public
EXPOSE 8080
CMD ["/server"]
