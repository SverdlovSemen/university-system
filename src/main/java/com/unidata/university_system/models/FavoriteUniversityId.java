package com.unidata.university_system.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
public class FavoriteUniversityId implements Serializable {
    private Long userId;
    private Long universityId;
}

