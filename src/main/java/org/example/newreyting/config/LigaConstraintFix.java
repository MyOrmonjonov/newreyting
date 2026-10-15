package org.example.newreyting.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * BIR MARTALIK TUZATISH (2026-10-15): {@code Liga} enum'iga yangi {@code NA} qiymati
 * qo'shilganda, {@link ViloyatConstraintFix}dagi bilan AYNAN BIR XIL muammo takrorlandi —
 * Hibernate avtomatik yaratgan {@code ishchi_boshlangich_liga_check} CHECK CONSTRAINT bazada
 * ESKI (faqat DIAMOND/GOLD/SILVER/BRONZE/RISING) holicha qolib ketgan edi, {@code ddl-auto=update}
 * mavjud cheklovlarni qayta yozmaydi. Natijada "N/A" ligaga agent qo'shish/tahrirlashga
 * urinilganda baza darajasida {@code DataIntegrityViolationException} bilan rad etilardi (ilova
 * kodi — {@code IshchiService.parseLiga} — to'g'ri ishlayotgan bo'lsa ham). Ilova darajasidagi
 * tekshiruv allaqachon yetarli bo'lgani uchun eski cheklov butunlay olib tashlanadi, yangisi
 * bilan almashtirilmaydi.
 */
@Component
public class LigaConstraintFix implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LigaConstraintFix.class);

    private final DataSource dataSource;

    public LigaConstraintFix(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE ishchi DROP CONSTRAINT IF EXISTS ishchi_boshlangich_liga_check");
            log.info("ishchi_boshlangich_liga_check (eski, qotib qolgan liga CHECK constraint) olib tashlandi (agar mavjud bo'lsa).");
        } catch (Exception e) {
            log.error("ishchi_boshlangich_liga_check'ni olib tashlashda xato (e'tiborsiz qoldiriladi): {}", e.toString());
        }
    }
}
