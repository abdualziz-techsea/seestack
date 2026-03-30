package com.allstak.modules.chat.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record ReactionSummary(
        String emoji,
        int count,
        boolean reactedByMe
) {}
