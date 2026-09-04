package org.example.newreyting.employee;

/** Ishchi ishlaydigan (yashaydigan) viloyat — O'zbekistonning 12 ta viloyati. */
public enum Viloyat {
    ANDIJON, BUXORO, FARGONA, JIZZAX, XORAZM, NAMANGAN, NAVOIY,
    QASHQADARYO, SAMARQAND, SIRDARYO, SURXONDARYO, TOSHKENT;

    public String key() {
        return name();
    }
}
