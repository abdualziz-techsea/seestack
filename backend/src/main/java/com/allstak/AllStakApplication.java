package com.allstak;

import org.jspecify.annotations.NullMarked;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@NullMarked
public class AllStakApplication {

    public static void main(String[] args) {
        SpringApplication.run(AllStakApplication.class, args);
    }
}
