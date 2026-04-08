package com.seestack.modules.chat.service;

import com.seestack.modules.chat.entity.ChatMessageEntity;
import com.seestack.modules.chat.repository.ChatMessageRepository;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seestack.modules.chat.dto.ChatSearchResult;
import java.util.List;
import java.util.UUID;

@Service
@NullMarked
public class ChatMessageService {

    private final ChatMessageRepository repository;

    public ChatMessageService(ChatMessageRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ChatMessageEntity send(UUID channelId, UUID userId, String userName, String content, @Nullable UUID linkedErrorId) {
        return repository.save(new ChatMessageEntity(channelId, userId, userName, content, linkedErrorId));
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageEntity> getHistory(UUID channelId, int page, int perPage) {
        return repository.findByChannelId(channelId,
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional(readOnly = true)
    public List<ChatSearchResult> search(UUID orgId, String query) {
        var messages = repository.searchByOrgAndContent(orgId, query);
        return messages.stream()
                .limit(50)
                .map(m -> new ChatSearchResult(
                        m.getId(), m.getContent(), m.getChannelId(),
                        "", // channel name resolved at controller layer if needed
                        "", // sender email
                        m.getCreatedAt()))
                .toList();
    }
}
