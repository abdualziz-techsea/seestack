package com.seestack.modules.chat.dto;

import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.UUID;

@NullMarked
public record ChatSearchResult(
        UUID messageId,
        String content,
        UUID channelId,
        String channelName,
        String senderEmail,
        Instant createdAt
) {}
