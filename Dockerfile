FROM node:24-bookworm-slim AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src/ ./src/
COPY --from=frontend /app/dist/curry/browser/ ./src/main/resources/static/
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/curry-api-1.0.0.jar ./curry.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/curry.jar"]
