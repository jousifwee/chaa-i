package com.chaai.server;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    @GetMapping("/")
    public String home() {
        log.debug("Health check endpoint accessed");
        return "chaa-i routing server (Spring) running";
    }
}
