package org.example.newreyting.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MahsulotRepository extends JpaRepository<Mahsulot, Long> {
    List<Mahsulot> findAllByOrderByNomiAsc();
}
