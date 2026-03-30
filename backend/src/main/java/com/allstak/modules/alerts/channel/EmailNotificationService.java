package com.allstak.modules.alerts.channel;

import com.allstak.modules.alerts.dto.AlertTriggerEvent;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Email notification via Azure Communication Services.
 * Scaffold only — no credentials configured yet.
 */
@Service
@NullMarked
public class EmailNotificationService implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    @Override
    public String getType() { return "email"; }

    @Override
    public void send(AlertTriggerEvent event, Map<String, Object> channelConfig) {
        // TODO: implement when Azure Communication Services credentials are added
        // Config expected:
        //   channelConfig.get("to") -> List<String> email addresses
        //
        // Azure SDK usage (when implemented):
        //   EmailClient emailClient = new EmailClientBuilder()
        //       .connectionString(azureConnectionString).buildClient();
        //   EmailMessage message = new EmailMessage()
        //       .setSenderAddress("noreply@allstak.io")
        //       .setToRecipients(toAddresses)
        //       .setSubject(event.title())
        //       .setBodyHtml(buildHtmlBody(event));
        //   emailClient.beginSend(message);

        log.warn("Email notification not yet implemented — Azure credentials required. " +
                "Event: {}, Recipients: {}", event.triggerType(), channelConfig.get("to"));
    }
}
