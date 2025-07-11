package com.unidata.university_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.PropertySource;

@SpringBootApplication
@PropertySource("classpath:gigachat.properties")
public class UniversitySystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(UniversitySystemApplication.class, args);
	}

}
