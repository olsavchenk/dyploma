# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution file
COPY Stride.slnx .

# Copy project files
COPY src/Stride.Api/Stride.Api.csproj src/Stride.Api/
COPY src/Stride.Core/Stride.Core.csproj src/Stride.Core/
COPY src/Stride.DataAccess/Stride.DataAccess.csproj src/Stride.DataAccess/
COPY src/Stride.Services/Stride.Services.csproj src/Stride.Services/

# Restore dependencies
RUN dotnet restore src/Stride.Api/Stride.Api.csproj

# Copy everything else
COPY src/ src/

# Build
WORKDIR /src/src/Stride.Api
RUN dotnet build Stride.Api.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish Stride.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Create non-root user
RUN groupadd -r strideapp && useradd -r -g strideapp strideapp

# Create logs directory
RUN mkdir -p /app/logs && chown -R strideapp:strideapp /app/logs

# Copy published app
COPY --from=publish /app/publish .

# Change ownership
RUN chown -R strideapp:strideapp /app

# Switch to non-root user
USER strideapp

# Expose port
EXPOSE 5000
EXPOSE 5001

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5000;https://+:5001
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application
ENTRYPOINT ["dotnet", "Stride.Api.dll"]
