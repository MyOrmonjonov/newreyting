package org.example.newreyting.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.createdBy WHERE LOWER(u.login) = LOWER(:login)")
    Optional<User> findByLoginIgnoreCase(@Param("login") String login);

    boolean existsByLoginIgnoreCase(String login);

    // createdBy — lazy @ManyToOne. JOIN FETCH bilan bir so'rovda olib kelamiz, aks holda
    // findByIdAndRole natijasidan UserResponse yasalganda (open-in-view=false bo'lgani uchun
    // tranzaksiya/sessiya allaqachon yopiq) LazyInitializationException tashlanadi.
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.createdBy WHERE u.id = :id AND u.role = :role")
    Optional<User> findByIdAndRoleFetchCreatedBy(@Param("id") Long id, @Param("role") Role role);

    // createdBy — lazy @ManyToOne. JOIN FETCH bilan bir so'rovda olib kelamiz,
    // aks holda kontroller javobni yig'ayotganda (sessiyadan tashqarida)
    // LazyInitializationException tashlanadi.
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.createdBy WHERE u.role = :role ORDER BY u.familiya ASC")
    List<User> findByRoleOrderByFamiliyaAsc(@Param("role") Role role);

    /** To'g'ridan-to'g'ri yaratuvchi bo'yicha (masalan: shu menejer yaratgan supervayzerlar). */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.createdBy WHERE u.role = :role AND u.createdBy.id = :createdById ORDER BY u.familiya ASC")
    List<User> findByRoleAndCreatedByIdOrderByFamiliyaAsc(@Param("role") Role role, @Param("createdById") Long createdById);

    boolean existsByRole(Role role);

    boolean existsByCreatedById(Long createdById);
}
