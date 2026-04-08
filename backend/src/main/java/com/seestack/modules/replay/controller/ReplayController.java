package com.seestack.modules.replay.controller;

import com.seestack.modules.replay.dto.ReplayEventResponse;
import com.seestack.modules.replay.repository.ReplayClickHouseRepository;
import com.seestack.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/errors")
@NullMarked
public class ReplayController {

    private final ReplayClickHouseRepository replayRepository;

    public ReplayController(ReplayClickHouseRepository replayRepository) {
        this.replayRepository = replayRepository;
    }

    @GetMapping("/{fingerprint}/replay")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReplay(
            @PathVariable String fingerprint,
            @RequestParam UUID projectId) {

        List<ReplayEventResponse> events = replayRepository.getReplayEvents(projectId, fingerprint);

        Map<String, Object> data = Map.of(
                "fingerprint", fingerprint,
                "totalEvents", events.size(),
                "events", events
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
