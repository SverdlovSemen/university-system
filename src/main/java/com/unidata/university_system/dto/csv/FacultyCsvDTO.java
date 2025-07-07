package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FacultyCsvDTO {
    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "name", required = true)
    private String name;

    @CsvBindByName(column = "university_id", required = true)
    private Long universityId;
}
