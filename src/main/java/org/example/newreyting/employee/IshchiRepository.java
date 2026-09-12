package org.example.newreyting.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IshchiRepository extends JpaRepository<Ishchi, Long> {

    // supervayzer.createdBy (menejer) LAZY bo'lgani uchun ham fetch qilinadi — aks holda
    // RatingService.menejerOf() har bir noyob supervayzer uchun alohida SELECT chiqarardi
    // (har 5 soniyada, har ochiq TV ekrani uchun — /api/reyting/ishchi'ni sekinlashtirgan).
    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.supervayzer s
            LEFT JOIN FETCH s.createdBy
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

    boolean existsBySupervayzerId(Long supervayzerId);

    /** Foydalanuvchi o'chirilishidan oldin — bu metadata maydon, o'chirilayotgan userga FK to'sqinlik qilmasligi uchun bo'shatiladi. */
    @Modifying
    @Query("UPDATE Ishchi i SET i.createdBy = null WHERE i.createdBy.id = :userId")
    void clearCreatedBy(@Param("userId") Long userId);
}
