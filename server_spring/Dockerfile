# syntax=docker/dockerfile:1

FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy Maven descriptor and go offline for deps
COPY pom.xml .
RUN mvn -q -B -DskipTests dependency:go-offline

# Copy sources and build
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV JAVA_OPTS=""

COPY --from=build /workspace/target/chaa-i-server-spring-0.1.0.jar /app/app.jar

EXPOSE 8081
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]

