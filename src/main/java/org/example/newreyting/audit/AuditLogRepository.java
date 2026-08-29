package org.example.newreyting.audit;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.actor ORDER BY a.vaqt DESC")
    List<AuditLog> findRecent(Pageable pageable);
}
