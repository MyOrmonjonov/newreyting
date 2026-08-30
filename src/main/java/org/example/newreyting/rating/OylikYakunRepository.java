package org.example.newreyting.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface OylikYakunRepository extends JpaRepository<OylikYakun, Long> {

    @Query("""
            SELECT y FROM OylikYakun y
            LEFT JOIN FETCH y.ishchi i
            LEFT JOIN FETCH i.supervayzer
            WHERE y.oy = :oy
            """)
    List<OylikYakun> findAllByOy(@Param("oy") LocalDate oy);

    boolean existsByOy(LocalDate oy);
}
