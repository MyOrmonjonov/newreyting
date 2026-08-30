package org.example.newreyting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NewreytingApplication {

    public static void main(String[] args) {
        SpringApplication.run(NewreytingApplication.class, args);
    }

}
