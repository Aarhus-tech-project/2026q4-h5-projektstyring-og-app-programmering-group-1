# LagerKlar



LagerKlar er en mobilapp til små restauranter, caféer og lignende spisesteder.



## Formål



Appen skal hjælpe medarbejdere med at holde styr på varer, lagerbeholdning og udløbsdatoer. Brugeren skal kunne registrere varer, følge lagerændringer og finde varer, der snart udløber eller er ved at løbe tør. En QR-kode skal kunne åbne et bestemt vareparti, så brugeren kan se og opdatere beholdningen.



## Foreløbig teknologi



- Mobilapp: React Native med Expo

- Backend: Go med Gin

- Database: PostgreSQL



## Sådan startes projektet

### Backend

Kræver [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cd Backend
cp .env.example .env   # udfyld passwords m.m. i .env
docker compose up -d --build
```

Det starter databasen, Go-API'et og Caddy. API'et kan nås på `https://localhost`.
Se [Backend/README.md](Backend/README.md) for flere detaljer.

### Frontend

Kræver [Node.js](https://nodejs.org/).

1. Opret filen `Frontend/.env`:

   ```
   EXPO_PUBLIC_SERVER_IP=https://<backend-adresse>
   EXPO_PUBLIC_MODE=development
   ```

2. Installer og start appen:

   ```bash
   cd Frontend
   npm install
   npm start
   ```

3. Scan QR-koden med Expo Go på telefonen, eller tryk `a` for Android-emulator.



## Gruppe



Adem, Minh og Nicklas
