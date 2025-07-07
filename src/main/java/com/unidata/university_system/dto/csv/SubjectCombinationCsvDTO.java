package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubjectCombinationCsvDTO {
    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "specialty_id", required = true)
    private Long specialtyId;
}
