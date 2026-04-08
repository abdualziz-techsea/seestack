package com.seestack.shared.exception;

import org.jspecify.annotations.NullMarked;

@NullMarked
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(String entity, Object id) {
        super("%s not found: %s".formatted(entity, id));
    }
}
