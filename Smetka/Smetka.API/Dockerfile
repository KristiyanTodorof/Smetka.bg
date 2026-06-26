FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копираме всички проекти
COPY ["Smetka.API/Smetka.API.csproj", "Smetka.API/"]
COPY ["Smetka.Core/Smetka.Core.csproj", "Smetka.Core/"]
COPY ["Smetka.Data/Smetka.Data.csproj", "Smetka.Data/"]
COPY ["Smetka.Infrastructure/Smetka.Infrastructure.csproj", "Smetka.Infrastructure/"]

RUN dotnet restore "Smetka.API/Smetka.API.csproj"

COPY . .

RUN dotnet publish "Smetka.API/Smetka.API.csproj" -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Smetka.API.dll"]