# MrDrawing - Çiz & Tahmin Düellosu

**Flutter + Go | E2.Micro (1GB RAM) optimize**

## Oyun
Split-screen: solda canvas, sağda chat. Hızlı eşleşme → biri çizer (kelime görünür) diğeri tahmin eder → doğru bilince roller değişir, 90sn timeout.

## Neden hafif?
- Go binary ~7MB, RAM ~12-20MB, GC=50, GOMAXPROCS=1
- No DB, in-memory rooms, mesaj 1KB limit
- Flutter Canvas sadece Offset list, 60fps
- Binary minimal: `CGO_ENABLED=0 -ldflags="-s -w"`

## Çalıştır
```bash
# Backend
go mod tidy && go run main.go # :8080

# Frontend
flutter pub get
flutter run -d chrome --web-port 8081
# veya build: flutter build web && cp -r build/web/* public/
```

## OCI E2.Micro Deploy
```bash
scp -i ~/.ssh/oci server public/* ubuntu@<IP>:/opt/mrdrawing/
ssh ubuntu@<IP> "sudo cp mrdrawing.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now mrdrawing"
# nginx reverse proxy 80->8080 + certbot
```

## Ampere (A1) çıkınca
`GOMAXPROCS=4`, `MemoryMax=1G` yap, ölçek 4x.
