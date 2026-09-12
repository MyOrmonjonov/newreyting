package org.example.newreyting.rating;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IshchiPlaceSnapshotRepository extends JpaRepository<IshchiPlaceSnapshot, Long> {

    Optional<IshchiPlaceSnapshot> findByIshchiIdAndOy(Long ishchiId, LocalDate oy);

    List<IshchiPlaceSnapshot> findAllByOy(LocalDate oy);
}
