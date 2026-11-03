FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY projects/backend/pom.xml .
RUN mvn -q -B dependency:go-offline
COPY projects/backend/src/ ./src/
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /build/target/proforma-api-1.0.0.jar app.jar
RUN mkdir -p /app/uploads && chown -R app:app /app
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]