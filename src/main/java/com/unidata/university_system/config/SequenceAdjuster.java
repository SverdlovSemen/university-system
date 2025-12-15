package com.unidata.university_system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SequenceAdjuster implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SequenceAdjuster.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Ensure sequences are at least max(id) for their tables to avoid duplicate key on insert
        adjustSequence("faculties_id_seq", "faculties");
        adjustSequence("programs_id_seq", "programs");
        adjustSequence("universities_id_seq", "universities");
        adjustSequence("specializations_id_seq", "specializations");
        adjustSequence("users_id_seq", "users");
        adjustSequence("roles_id_seq", "roles");
        logger.info("SequenceAdjuster finished sequence checks");
    }

    private void adjustSequence(String sequenceName, String tableName) {
        try {
            String sql = String.format("SELECT setval('%s', COALESCE((SELECT MAX(id) FROM %s), 0))", sequenceName, tableName);
            jdbcTemplate.execute(sql);
            logger.info("Adjusted sequence {} for table {}", sequenceName, tableName);
        } catch (Exception e) {
            logger.warn("Failed to adjust sequence {} for table {}: {}", sequenceName, tableName, e.getMessage());
        }
    }
}
