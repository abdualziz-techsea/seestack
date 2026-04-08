package com.seestack.modules.alerts.channel;

import com.seestack.modules.alerts.dto.AlertTriggerEvent;
import org.jspecify.annotations.NullMarked;

import java.util.Map;

@NullMarked
public interface NotificationChannel {
    String getType();
    void send(AlertTriggerEvent event, Map<String, Object> channelConfig);
}
