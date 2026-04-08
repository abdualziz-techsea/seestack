package com.seestack.modules.alerts.channel;

import com.seestack.modules.alerts.dto.AlertTriggerEvent;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Push notification via OneSignal.
 * Scaffold only — no credentials configured yet.
 */
@Service
@NullMarked
public class PushNotificationService implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Override
    public String getType() { return "push"; }

    @Override
    public void send(AlertTriggerEvent event, Map<String, Object> channelConfig) {
        // TODO: implement when OneSignal App ID and API key are configured
        //
        // OneSignal REST API call (when implemented):
        //   POST https://onesignal.com/api/v1/notifications
        //   Headers: Authorization: Basic {REST_API_KEY}
        //   Body: { "app_id": "{APP_ID}", "included_segments": ["All"],
        //           "headings": {"en": event.title()},
        //           "contents": {"en": event.description()},
        //           "url": event.deepLinkUrl() }

        log.warn("Push notification not yet implemented — OneSignal credentials required. " +
                "Event: {}", event.triggerType());
    }
}
