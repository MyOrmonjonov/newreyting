package org.example.newreyting.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IshchiRepository extends JpaRepository<Ishchi, Long> {

    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.supervayzer
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllWithRefs();

    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.supervayzer
            WHERE i.supervayzer.id = :supervayzerId
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllBySupervayzerId(@Param("supervayzerId") Long supervayzerId);

    /** MENEJER — o'zi yaratgan supervayzerlarga tegishli ishchilar (1 pog'ona pastga). */
    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.supervayzer
            WHERE i.supervayzer.createdBy.id = :menejerId
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllBySupervayzerCreatedById(@Param("menejerId") Long menejerId);

    /** OPERATOR — o'zi yaratgan menejerlarga tegishli supervayzerlarning ishchilari (2 pog'ona pastga). */
    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.supervayzer
            WHERE i.supervayzer.createdBy.createdBy.id = :operatorId
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllBySupervayzerCreatedByCreatedById(@Param("operatorId") Long operatorId);

    boolean existsBySupervayzerId(Long supervayzerId);

    /** Foydalanuvchi o'chirilishidan oldin — bu metadata maydon, o'chirilayotgan userga FK to'sqinlik qilmasligi uchun bo'shatiladi. */
    @Modifying
    @Query("UPDATE Ishchi i SET i.createdBy = null WHERE i.createdBy.id = :userId")
    void clearCreatedBy(@Param("userId") Long userId);
}
