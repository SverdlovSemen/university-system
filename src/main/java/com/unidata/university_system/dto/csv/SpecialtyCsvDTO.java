package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpecialtyCsvDTO {
    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "name", required = true)
    private String name;

    @CsvBindByName(column = "program_code", required = true)
    private String programCode;

    @CsvBindByName(column = "description")
    private String description;

    @CsvBindByName(column = "faculty_id", required = true)
    private Long facultyId;
}
