package com.seestack.modules.chat.service;

import com.seestack.modules.chat.entity.ChatChannelEntity;
import com.seestack.modules.chat.entity.ChatChannelMemberEntity;
import com.seestack.modules.chat.repository.ChatChannelMemberRepository;
import com.seestack.modules.chat.repository.ChatChannelRepository;
import com.seestack.modules.teams.entity.UserEntity;
import com.seestack.modules.teams.repository.UserRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@NullMarked
public class ChatChannelService {

    private static final List<String> DEFAULT_CHANNELS = List.of("general", "production", "bugs");

    private final ChatChannelRepository repository;
    private final ChatChannelMemberRepository memberRepository;
    private final UserRepository userRepository;

    public ChatChannelService(ChatChannelRepository repository,
                               ChatChannelMemberRepository memberRepository,
                               UserRepository userRepository) {
        this.repository = repository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatChannelEntity create(UUID orgId, String name) {
        return repository.save(new ChatChannelEntity(orgId, name, false));
    }

    @Transactional
    public List<ChatChannelEntity> createDefaultChannels(UUID orgId) {
        List<ChatChannelEntity> created = DEFAULT_CHANNELS.stream()
                .filter(name -> !repository.existsByOrgIdAndName(orgId, name))
                .map(name -> repository.save(new ChatChannelEntity(orgId, name, true)))
                .toList();

        // Auto-add all org users to default channels
        if (!created.isEmpty()) {
            List<UserEntity> orgUsers = userRepository.findByOrgId(orgId);
            for (ChatChannelEntity ch : created) {
                for (UserEntity user : orgUsers) {
                    String userName = user.getEmail().split("@")[0];
                    if (!memberRepository.existsByChannelIdAndUserId(ch.getId(), user.getId())) {
                        memberRepository.save(new ChatChannelMemberEntity(ch.getId(), user.getId(), userName));
                    }
                }
            }
        }

        return created;
    }

    @Transactional
    public ChatChannelMemberEntity addMember(UUID channelId, UUID userId, String userName) {
        if (memberRepository.existsByChannelIdAndUserId(channelId, userId)) {
            return memberRepository.findByChannelId(channelId).stream()
                    .filter(m -> m.getUserId().equals(userId))
                    .findFirst()
                    .orElseThrow();
        }
        return memberRepository.save(new ChatChannelMemberEntity(channelId, userId, userName));
    }

    @Transactional
    public void removeMember(UUID channelId, UUID userId) {
        memberRepository.deleteByChannelIdAndUserId(channelId, userId);
    }

    @Transactional(readOnly = true)
    public List<ChatChannelMemberEntity> listMembers(UUID channelId) {
        return memberRepository.findByChannelId(channelId);
    }

    @Transactional(readOnly = true)
    public boolean isMember(UUID channelId, UUID userId) {
        return memberRepository.existsByChannelIdAndUserId(channelId, userId);
    }

    @Transactional(readOnly = true)
    public Page<ChatChannelEntity> list(UUID orgId, int page, int perPage) {
        return repository.findByOrgId(orgId,
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.ASC, "name")));
    }

    @Transactional(readOnly = true)
    public ChatChannelEntity getById(UUID orgId, UUID channelId) {
        return repository.findByIdAndOrgId(channelId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("ChatChannel", channelId));
    }

    @Transactional
    public ChatChannelEntity rename(UUID orgId, UUID channelId, String name) {
        ChatChannelEntity entity = getById(orgId, channelId);
        entity.setName(name);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID orgId, UUID channelId) {
        ChatChannelEntity entity = getById(orgId, channelId);
        repository.delete(entity);
    }
}
