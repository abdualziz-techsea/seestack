package com.seestack;

import org.jspecify.annotations.NullMarked;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@NullMarked
public class SeeStackApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeeStackApplication.class, args);
    }
}
