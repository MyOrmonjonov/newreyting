package org.example.newreyting.result;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OylikNatijaRepository extends JpaRepository<OylikNatija, Long> {

    @Query("""
            SELECT n FROM OylikNatija n
            LEFT JOIN FETCH n.ishchi i
            LEFT JOIN FETCH n.mahsulot
            LEFT JOIN FETCH i.supervayzer
            WHERE n.oy = :oy
            """)
    List<OylikNatija> findAllByOy(@Param("oy") LocalDate oy);

    Optional<OylikNatija> findByIshchiIdAndMahsulotIdAndOy(Long ishchiId, Long mahsulotId, LocalDate oy);

    boolean existsByMahsulotId(Long mahsulotId);

    boolean existsByIshchiId(Long ishchiId);

    /** Barcha oylar bo'yicha (ishchi bo'yicha guruhlanmagan xom yozuvlar) — tarixiy hisob-kitob (masalan trophies) uchun. */
    @Query("SELECT DISTINCT n.oy FROM OylikNatija n WHERE n.oy < :oy ORDER BY n.oy ASC")
    List<LocalDate> findDistinctPastMonths(@Param("oy") LocalDate oy);
}
