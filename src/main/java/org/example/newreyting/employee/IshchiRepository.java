package org.example.newreyting.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IshchiRepository extends JpaRepository<Ishchi, Long> {

    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.filial
            LEFT JOIN FETCH i.supervayzer
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllWithRefs();

    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.filial
            LEFT JOIN FETCH i.supervayzer
            WHERE i.supervayzer.id = :supervayzerId
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllBySupervayzerId(@Param("supervayzerId") Long supervayzerId);

    @Query("""
            SELECT i FROM Ishchi i
            LEFT JOIN FETCH i.filial
            LEFT JOIN FETCH i.supervayzer
            WHERE i.supervayzer.createdBy.id = :menejerId
            ORDER BY i.familiya ASC
            """)
    List<Ishchi> findAllBySupervayzerCreatedById(@Param("menejerId") Long menejerId);
}
