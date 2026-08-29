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

    // createdBy — lazy @ManyToOne. JOIN FETCH bilan bir so'rovda olib kelamiz,
    // aks holda kontroller javobni yig'ayotganda (sessiyadan tashqarida)
    // LazyInitializationException tashlanadi.
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.createdBy WHERE u.role = :role ORDER BY u.familiya ASC")
    List<User> findByRoleOrderByFamiliyaAsc(@Param("role") Role role);

    boolean existsByRole(Role role);
}
