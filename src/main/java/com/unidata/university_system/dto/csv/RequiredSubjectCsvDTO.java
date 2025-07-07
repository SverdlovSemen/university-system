package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequiredSubjectCsvDTO {
    @CsvBindByName(column = "combination_id", required = true) // Use 'subject_combination_id' if CSV header differs
    private Long combinationId;

    @CsvBindByName(column = "subject_id", required = true)
    private Long subjectId;
}
