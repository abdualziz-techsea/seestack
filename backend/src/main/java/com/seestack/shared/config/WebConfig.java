package com.seestack.shared.config;

import com.seestack.modules.chat.controller.ChatWebSocketHandler;
import com.seestack.modules.logs.controller.LogTailWebSocketHandler;
import com.seestack.modules.ssh.controller.SshTerminalWebSocketHandler;
import com.seestack.shared.security.RequestContextFilter;
import org.jspecify.annotations.NullMarked;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@NullMarked
public class WebConfig implements WebSocketConfigurer {

    private final LogTailWebSocketHandler logTailHandler;
    private final SshTerminalWebSocketHandler sshTerminalHandler;
    private final ChatWebSocketHandler chatHandler;

    public WebConfig(LogTailWebSocketHandler logTailHandler,
                     SshTerminalWebSocketHandler sshTerminalHandler,
                     ChatWebSocketHandler chatHandler) {
        this.logTailHandler = logTailHandler;
        this.sshTerminalHandler = sshTerminalHandler;
        this.chatHandler = chatHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(logTailHandler, "/api/v1/logs/tail")
                .setAllowedOrigins("*");
        registry.addHandler(sshTerminalHandler, "/api/v1/ssh/terminal")
                .setAllowedOrigins("*");
        registry.addHandler(chatHandler, "/api/v1/chat/ws")
                .setAllowedOrigins("*");
    }

    @Bean
    public FilterRegistrationBean<RequestContextFilter> requestContextFilterRegistration(
            RequestContextFilter filter) {
        FilterRegistrationBean<RequestContextFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(Ordered.LOWEST_PRECEDENCE - 100);
        registration.addUrlPatterns("/api/*", "/ingest/*");
        return registration;
    }
}
