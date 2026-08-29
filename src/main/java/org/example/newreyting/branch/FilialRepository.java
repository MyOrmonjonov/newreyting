package org.example.newreyting.branch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FilialRepository extends JpaRepository<Filial, Long> {
    boolean existsByNomiIgnoreCase(String nomi);

    List<Filial> findAllByOrderByNomiAsc();
}
