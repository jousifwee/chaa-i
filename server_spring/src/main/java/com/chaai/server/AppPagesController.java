package com.chaai.server;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class AppPagesController {

    private static final Logger log = LoggerFactory.getLogger(AppPagesController.class);

    @GetMapping({"/app", "/app/"})
    public String appRoot() {
        log.debug("Routing /app request to SPA root");
        return "forward:/app/index.html";
    }

    @GetMapping({"/app/secure", "/app/secure/"})
    public String appSecure() {
        log.debug("Routing /app/secure request to secure SPA");
        return "forward:/app/secure/index.html";
    }

    @GetMapping({"/app/simple", "/app/simple/"})
    public String appSimple() {
        log.debug("Routing /app/simple request to simple SPA");
        return "forward:/app/simple/index.html";
    }

    @GetMapping({"/app/svelte", "/app/svelte/"})
    public String appSvelte() {
        log.debug("Routing /app/svelte request to svelte SPA");
        return "forward:/app/svelte/index.html";
    }

    @GetMapping({"/app/angular", "/app/angular/"})
    public String appAngular() {
        log.debug("Routing /app/angular request to angular SPA");
        return "forward:/app/angular/index.html";
    }
}
