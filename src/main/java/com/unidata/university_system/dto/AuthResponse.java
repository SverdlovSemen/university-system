package com.unidata.university_system.dto;

public record AuthResponse(String token, String message) {
    // Constructor for successful responses (no message)
    public AuthResponse(String token) {
        this(token, null);
    }
}