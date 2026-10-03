package org.example.newreyting.employee;

/** Ishchi ishlaydigan (yashaydigan) hudud — O'zbekiston viloyatlari va ayrim shaharlari. */
public enum Viloyat {
    ANDIJON, BUXORO, FARGONA, JIZZAX, XORAZM, NAMANGAN, NAVOIY,
    QASHQADARYO, SAMARQAND, SIRDARYO, SURXONDARYO, TOSHKENT,
    TOSHKENT_VILOYATI, QOQON;

    public String key() {
        return name();
    }
}
