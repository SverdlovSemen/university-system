FROM openjdk:17-jdk-slim
WORKDIR /app
COPY build.gradle settings.gradle gradlew /app/
COPY gradle /app/gradle
COPY src /app/src
RUN chmod +x gradlew
RUN ./gradlew build -x test
EXPOSE 8080
CMD ["java", "-jar", "/app/build/libs/university-system-0.0.1-SNAPSHOT.jar"]