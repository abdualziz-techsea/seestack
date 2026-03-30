package com.allstak.modules.alerts.service;

import com.allstak.modules.alerts.channel.NotificationChannel;
import com.allstak.modules.alerts.dto.AlertTriggerEvent;
import com.allstak.modules.alerts.entity.AlertRuleEntity;
import com.allstak.modules.alerts.entity.NotificationLogEntity;
import com.allstak.modules.alerts.repository.NotificationLogRepository;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@NullMarked
public class NotificationDispatcherService {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcherService.class);

    private final Map<String, NotificationChannel> channelMap;
    private final NotificationLogRepository logRepository;

    public NotificationDispatcherService(List<NotificationChannel> channels,
                                          NotificationLogRepository logRepository) {
        this.channelMap = channels.stream()
                .collect(Collectors.toMap(NotificationChannel::getType, Function.identity()));
        this.logRepository = logRepository;
    }

    public void dispatch(AlertTriggerEvent event, AlertRuleEntity rule) {
        for (Map<String, Object> channelConfig : rule.getChannels()) {
            String type = (String) channelConfig.get("type");
            NotificationChannel channel = channelMap.get(type);

            if (channel == null) {
                log.warn("Unknown notification channel type: {}", type);
                continue;
            }

            try {
                channel.send(event, channelConfig);
                logRepository.save(new NotificationLogEntity(
                        rule.getId(), event.projectId(), event.triggerType(),
                        type, "sent", null, null));
            } catch (Exception e) {
                log.error("Failed to send {} notification for rule {}", type, rule.getId(), e);
                logRepository.save(new NotificationLogEntity(
                        rule.getId(), event.projectId(), event.triggerType(),
                        type, "failed", null, e.getMessage()));
            }
        }
    }
}
