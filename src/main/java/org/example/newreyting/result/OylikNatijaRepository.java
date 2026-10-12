package org.example.newreyting.result;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OylikNatijaRepository extends JpaRepository<OylikNatija, Long> {

    /** RatingService uchun — supervayzer ham fetch qilinadi, chunki menejerFullName hisoblashda
     * kerak (aks holda har noyob supervayzer uchun alohida SELECT, ya'ni N+1). */
    @Query("""
            SELECT n FROM OylikNatija n
            LEFT JOIN FETCH n.ishchi i
            LEFT JOIN FETCH n.mahsulot
            LEFT JOIN FETCH i.supervayzer
            WHERE n.oy = :oy
            """)
    List<OylikNatija> findAllByOy(@Param("oy") LocalDate oy);

    /** Operator panelidagi "Oylik natija" ro'yxati ({@link org.example.newreyting.result.dto.NatijaRowResponse})
     * uchun — supervayzer'ga ehtiyoj yo'q, shuning uchun {@link #findAllByOy} dagi qo'shimcha
     * JOIN olib tashlangan (natija kiritish sahifasi tezroq yuklansin uchun). */
    @Query("""
            SELECT n FROM OylikNatija n
            LEFT JOIN FETCH n.ishchi
            LEFT JOIN FETCH n.mahsulot
            WHERE n.oy = :oy
            """)
    List<OylikNatija> findAllByOyLight(@Param("oy") LocalDate oy);

    Optional<OylikNatija> findByIshchiIdAndMahsulotIdAndOy(Long ishchiId, Long mahsulotId, LocalDate oy);

    boolean existsByMahsulotId(Long mahsulotId);

    boolean existsByIshchiId(Long ishchiId);

    long countByIshchiId(Long ishchiId);

    @Modifying
    @Query("DELETE FROM OylikNatija n WHERE n.ishchi.id = :ishchiId")
    void deleteByIshchiId(@Param("ishchiId") Long ishchiId);

    /** Barcha oylar bo'yicha (ishchi bo'yicha guruhlanmagan xom yozuvlar) — tarixiy hisob-kitob (masalan trophies) uchun. */
    @Query("SELECT DISTINCT n.oy FROM OylikNatija n WHERE n.oy < :oy ORDER BY n.oy ASC")
    List<LocalDate> findDistinctPastMonths(@Param("oy") LocalDate oy);
}
