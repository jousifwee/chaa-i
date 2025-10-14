package com.chaai.server;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AppPagesController {

    @GetMapping({"/app", "/app/"})
    public String appRoot() {
        return "forward:/app/index.html";
    }

    @GetMapping({"/app/secure", "/app/secure/"})
    public String appSecure() {
        return "forward:/app/secure/index.html";
    }

    @GetMapping({"/app/simple", "/app/simple/"})
    public String appSimple() {
        return "forward:/app/simple/index.html";
    }

    @GetMapping({"/app/svelte", "/app/svelte/"})
    public String appSvelte() {
        return "forward:/app/svelte/index.html";
    }

    @GetMapping({"/app/angular", "/app/angular/"})
    public String appAngular() {
        return "forward:/app/angular/index.html";
    }
}

