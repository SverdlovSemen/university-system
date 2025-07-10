package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UniversityCsvDTO {
    @CsvBindByName(column = "short_name", required = true) // Новое поле
    private String shortName;

    @CsvBindByName(column = "full_name", required = true) // Новое поле
    private String fullName;

    @CsvBindByName(column = "type", required = true)
    private String type;

    @CsvBindByName(column = "avgEgeScore")
    private Double avgEgeScore;

    @CsvBindByName(column = "countryRanking")
    private Integer countryRanking;

    @CsvBindByName(column = "city_name", required = true)
    private String cityName;
}