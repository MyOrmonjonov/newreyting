package org.example.newreyting.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RahbarOylikNatijaRepository extends JpaRepository<RahbarOylikNatija, Long> {

    @Query("SELECT r FROM RahbarOylikNatija r LEFT JOIN FETCH r.user WHERE r.oy = :oy")
    List<RahbarOylikNatija> findAllByOy(@Param("oy") LocalDate oy);

    Optional<RahbarOylikNatija> findByUserIdAndOy(@Param("userId") Long userId, @Param("oy") LocalDate oy);
}
