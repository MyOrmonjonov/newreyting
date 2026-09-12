package org.example.newreyting.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface OylikYakunRepository extends JpaRepository<OylikYakun, Long> {

    // supervayzer.createdBy (menejer) ham fetch qilinadi — RatingService.menejerOf() shu
    // maydonni o'qiydi, aks holda LAZY bo'lgani uchun har noyob supervayzer uchun alohida
    // SELECT chiqarardi (bu yerda — MUZLATILGAN/o'tgan oylar uchun).
    @Query("""
            SELECT y FROM OylikYakun y
            LEFT JOIN FETCH y.ishchi i
            LEFT JOIN FETCH i.supervayzer s
            LEFT JOIN FETCH s.createdBy
            WHERE y.oy = :oy
            """)
    List<OylikYakun> findAllByOy(@Param("oy") LocalDate oy);

    boolean existsByOy(LocalDate oy);

    /** Barcha MUZLATILGAN (finalize qilingan) oylar — formula-tuzatish migratsiyasi uchun. */
    @Query("SELECT DISTINCT y.oy FROM OylikYakun y ORDER BY y.oy ASC")
    List<LocalDate> findDistinctOylar();
}
