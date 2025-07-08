# backend/Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

# Копируем gradle-файлы из корня проекта
COPY ../build.gradle.kts ../settings.gradle.kts ../gradlew /app/
COPY ../gradle /app/gradle

# Копируем исходный код
COPY ../src /app/src

# Даём права и собираем .jar
RUN chmod +x gradlew
RUN ./gradlew build -x test

EXPOSE 8080

CMD ["java", "-jar", "/app/build/libs/university-system-0.0.1-SNAPSHOT.jar"]
