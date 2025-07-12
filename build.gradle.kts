plugins {
	java
	id("org.springframework.boot") version "3.5.3"
	id("io.spring.dependency-management") version "1.1.7"
	id("org.flywaydb.flyway") version "11.10.0"
}

group = "com.unidata"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-web")
	compileOnly("org.projectlombok:lombok")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	runtimeOnly("org.postgresql:postgresql:42.7.7")
	annotationProcessor("org.projectlombok:lombok")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	implementation("org.flywaydb:flyway-core:11.10.0")
	implementation("org.flywaydb:flyway-database-postgresql:11.10.0")
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")
	implementation("com.auth0:java-jwt:4.4.0")
	testImplementation("org.junit.jupiter:junit-jupiter-api")
	testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine")
	implementation("com.opencsv:opencsv:5.11.2")
	implementation("commons-io:commons-io:2.19.0") {
		exclude(group = "commons-logging", module = "commons-logging")
	}
}

flyway {
	url = "jdbc:postgresql://localhost:5432/university_db"
	user = "postgres"
	password = "postgres"
	locations = arrayOf("classpath:db/migration")
	baselineOnMigrate = true
}

tasks.withType<Test> {
	useJUnitPlatform()
}