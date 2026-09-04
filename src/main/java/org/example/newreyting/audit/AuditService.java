package org.example.newreyting.audit;

import org.example.newreyting.user.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private static final int MAX_ENTRIES = 300;
    // AuditLog.maqsad ustuni varchar(255) — undan uzun matn PostgreSQL xatosi (22001) beradi.
    // Chaqiruvchi tomonda uzunlikni nazorat qilishga tayanmaslik uchun shu yerda ham kesiladi.
    private static final int MAX_MAQSAD_LENGTH = 255;

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(User actor, HarakatTuri harakat, String maqsad) {
        String qisqartirilgan = maqsad.length() > MAX_MAQSAD_LENGTH
                ? maqsad.substring(0, MAX_MAQSAD_LENGTH - 1) + "…"
                : maqsad;
        auditLogRepository.save(new AuditLog(actor, harakat, qisqartirilgan));
    }

    public List<AuditLog> recent() {
        return auditLogRepository.findRecent(PageRequest.of(0, MAX_ENTRIES));
    }
}
