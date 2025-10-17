package com.chaai.server;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.SpringApplication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
public class ChaaiSpringServerApplication {

    private static final Logger log = LoggerFactory.getLogger(ChaaiSpringServerApplication.class);

    public static void main(String[] args) {
        log.info("Starting chaa-i Spring server");
        SpringApplication.run(ChaaiSpringServerApplication.class, args);
    }
}
