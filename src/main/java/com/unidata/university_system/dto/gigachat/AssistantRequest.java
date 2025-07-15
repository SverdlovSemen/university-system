package com.unidata.university_system.dto.gigachat;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssistantRequest {
    private List<Message> messages;
    private String model;
}
