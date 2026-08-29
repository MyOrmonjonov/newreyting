package org.example.newreyting.audit;

import org.example.newreyting.user.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private static final int MAX_ENTRIES = 300;

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(User actor, HarakatTuri harakat, String maqsad) {
        auditLogRepository.save(new AuditLog(actor, harakat, maqsad));
    }

    public List<AuditLog> recent() {
        return auditLogRepository.findRecent(PageRequest.of(0, MAX_ENTRIES));
    }
}
