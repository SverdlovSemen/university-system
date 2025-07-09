package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UniversityCsvDTO {
    @CsvBindByName(column = "name", required = true)
    private String name;

    @CsvBindByName(column = "type", required = true)
    private String type;

    @CsvBindByName(column = "avgEgeScore")
    private Double avgEgeScore;

    @CsvBindByName(column = "countryRanking")
    private Integer countryRanking;

    @CsvBindByName(column = "city_name", required = true)
    private String cityName;
}
