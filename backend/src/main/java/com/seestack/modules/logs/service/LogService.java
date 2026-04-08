package com.seestack.modules.logs.service;

import com.seestack.modules.logs.repository.LogClickHouseRepository;
import com.seestack.modules.logs.repository.LogClickHouseRepository.LogQueryResult;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@NullMarked
public class LogService {

    private final LogClickHouseRepository repository;

    public LogService(LogClickHouseRepository repository) {
        this.repository = repository;
    }

    public LogQueryResult search(UUID projectId, @Nullable String level, @Nullable String service,
                                  @Nullable String timeRange, @Nullable String search,
                                  @Nullable Instant startTime, @Nullable Instant endTime,
                                  int page, int perPage) {
        // If timeRange is provided, compute start/end from it
        if (timeRange != null && !timeRange.isBlank() && startTime == null) {
            Instant now = Instant.now();
            startTime = switch (timeRange) {
                case "15m" -> now.minus(Duration.ofMinutes(15));
                case "1h" -> now.minus(Duration.ofHours(1));
                case "6h" -> now.minus(Duration.ofHours(6));
                case "24h" -> now.minus(Duration.ofHours(24));
                case "7d" -> now.minus(Duration.ofDays(7));
                case "30d" -> now.minus(Duration.ofDays(30));
                default -> now.minus(Duration.ofHours(24));
            };
            endTime = now;
        }

        return repository.search(projectId, level, service, search, startTime, endTime, page, perPage);
    }
}
