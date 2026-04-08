package com.seestack.shared.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.jspecify.annotations.NullMarked;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@NullMarked
public class KafkaTopicsConfig {

    @Bean
    public NewTopic errorsTopic() {
        return TopicBuilder.name("seestack.errors")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic logsTopic() {
        return TopicBuilder.name("seestack.logs")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic monitorChecksTopic() {
        return TopicBuilder.name("seestack.monitor-checks")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic sshAuditTopic() {
        return TopicBuilder.name("seestack.ssh-audit")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic cronPingsTopic() {
        return TopicBuilder.name("seestack.cron_pings")
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic httpRequestsTopic() {
        return TopicBuilder.name("seestack.http_requests")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic replayTopic() {
        return TopicBuilder.name("seestack.replay")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
