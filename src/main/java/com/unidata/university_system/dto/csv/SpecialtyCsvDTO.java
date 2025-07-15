package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindAndSplitByName;
import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

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

    // Изменяем на список ID факультетов
    @CsvBindAndSplitByName(
            column = "faculty_ids",
            elementType = Long.class,
            splitOn = ",",
            required = true
    )
    private List<Long> facultyIds;
}