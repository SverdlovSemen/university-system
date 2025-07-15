package com.unidata.university_system.dto.gigachat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Message {
    private String role;
    private String content;


    public Message(String system, String systemPrompt) {
        this.role = system;
        this.content = systemPrompt;
    }
}
