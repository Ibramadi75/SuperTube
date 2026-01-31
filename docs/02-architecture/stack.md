# Stack Technologique

## Technologies

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | React 18 + Vite | Moderne, rapide, composants reutilisables |
| UI | Tailwind CSS | Utility-first, leger, responsive |
| State | Zustand | Leger, simple, pas de boilerplate |
| Backend | .NET 8 Minimal API | Performant, AOT, typage natif C# |
| BDD | SQLite + EF Core | ORM leger, migrations integrees |
| Conteneur | Docker multi-stage | Image optimisee < 50 Mo (AOT) |

## Structure du Projet

```
supertube/
├── src/
│   ├── client/                 # Frontend React
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   └── App.tsx
│   └── SuperTube.Api/          # Backend .NET 8
│       ├── Endpoints/          # Minimal API endpoints
│       ├── Services/           # Logique metier
│       ├── Data/               # DbContext + Entities
│       ├── Program.cs
│       └── SuperTube.Api.csproj
├── client/
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile
├── nginx.conf
└── docker-compose.yml
```

## Backend .NET 8 Minimal API

### Program.cs (exemple)

```csharp
var builder = WebApplication.CreateSlimBuilder(args);

// SQLite + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=/app/data/supertube.db"));

// Services
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<IDownloadService, DownloadService>();

var app = builder.Build();

// Endpoints
app.MapVideoEndpoints();
app.MapDownloadEndpoints();
app.MapSettingsEndpoints();
app.MapStatsEndpoints();

app.Run();
```

### Endpoint exemple

```csharp
public static class VideoEndpoints
{
    public static void MapVideoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/videos");

        group.MapGet("/", async (IVideoService service) =>
            Results.Ok(await service.GetAllAsync()));

        group.MapGet("/{id}", async (string id, IVideoService service) =>
            await service.GetByIdAsync(id) is { } video
                ? Results.Ok(video)
                : Results.NotFound());

        group.MapDelete("/{id}", async (string id, IVideoService service) =>
        {
            await service.DeleteAsync(id);
            return Results.NoContent();
        });
    }
}
```

## Dockerfile (Multi-Stage AOT)

```dockerfile
# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Build backend AOT
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend
WORKDIR /src
COPY src/SuperTube.Api/*.csproj ./
RUN dotnet restore
COPY src/SuperTube.Api/ ./
RUN dotnet publish -c Release -r linux-musl-x64 \
    --self-contained true \
    -p:PublishAot=true \
    -p:StripSymbols=true \
    -o /app/publish

# Production
FROM alpine:3.19
WORKDIR /app

# Deps minimales + nginx
RUN apk add --no-cache libstdc++ libgcc nginx

COPY --from=frontend /app/dist /usr/share/nginx/html
COPY --from=backend /app/publish/SuperTube.Api ./
COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "nginx && ./SuperTube.Api"]
```

> **Note AOT** : L'image finale fait ~30-40 Mo. Pas de runtime .NET necessaire.

## nginx.conf

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Fichier .csproj (AOT-ready)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <PublishAot>true</PublishAot>
    <InvariantGlobalization>true</InvariantGlobalization>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
  </ItemGroup>
</Project>
```

---

[Retour a l'Architecture](./README.md)
