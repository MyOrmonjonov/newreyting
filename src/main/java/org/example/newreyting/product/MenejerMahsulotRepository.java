package org.example.newreyting.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MenejerMahsulotRepository extends JpaRepository<MenejerMahsulot, Long> {

    @Query("SELECT mm FROM MenejerMahsulot mm JOIN FETCH mm.mahsulot WHERE mm.menejer.id = :menejerId")
    List<MenejerMahsulot> findByMenejerId(@Param("menejerId") Long menejerId);

    @Modifying
    @Query("DELETE FROM MenejerMahsulot mm WHERE mm.menejer.id = :menejerId")
    void deleteByMenejerId(@Param("menejerId") Long menejerId);
}
