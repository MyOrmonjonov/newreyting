package org.example.newreyting.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * BIR MARTALIK TUZATISH (2026-10-14): {@code Viloyat} enum'iga uchta yangi qiymat
 * (TOSHKENT_VILOYATI, QOQON, QORAQALPOGISTON) qo'shilganda, Hibernate avtomatik yaratgan
 * {@code ishchi_viloyat_check} CHECK CONSTRAINT bazada ESKI (faqat dastlabki 12 ta viloyat)
 * holicha qolib ketgan edi — {@code ddl-auto=update} mavjud cheklovlarni qayta yozmaydi,
 * faqat yetishmagan ustun/jadvallarni qo'shadi. Natijada shu uchta viloyat bilan agent
 * qo'shish/tahrirlashga urinilganda baza darajasida {@code DataIntegrityViolationException}
 * bilan rad etilardi (ilova kodi — {@code IshchiService.parseViloyat} — to'g'ri ishlayotgan
 * bo'lsa ham). Ilova darajasidagi tekshiruv allaqachon yetarli bo'lgani uchun eski cheklov
 * butunlay olib tashlanadi, yangisi bilan almashtirilmaydi.
 */
@Component
public class ViloyatConstraintFix implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ViloyatConstraintFix.class);

    private final DataSource dataSource;

    public ViloyatConstraintFix(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE ishchi DROP CONSTRAINT IF EXISTS ishchi_viloyat_check");
            log.info("ishchi_viloyat_check (eski, qotib qolgan viloyat CHECK constraint) olib tashlandi (agar mavjud bo'lsa).");
        } catch (Exception e) {
            log.error("ishchi_viloyat_check'ni olib tashlashda xato (e'tiborsiz qoldiriladi): {}", e.toString());
        }
    }
}
