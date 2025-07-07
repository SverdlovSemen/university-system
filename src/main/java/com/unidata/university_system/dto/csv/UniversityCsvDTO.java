package com.unidata.university_system.dto.csv;

import com.opencsv.bean.CsvBindByName;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UniversityCsvDTO {
    @CsvBindByName(column = "id")
    private Long id;

    @CsvBindByName(column = "name", required = true)
    private String name;

    @CsvBindByName(column = "type", required = true)
    private String type;

    @CsvBindByName(column = "avg_ege_score")
    private Double avgEgeScore;

    @CsvBindByName(column = "country_ranking")
    private Integer countryRanking;

    @CsvBindByName(column = "city_id", required = true)
    private Long cityId;
}
