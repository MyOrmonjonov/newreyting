package org.example.newreyting.audit;

public enum HarakatTuri {
    QOSHDI("qo'shdi"),
    OZGARTIRDI("o'zgartirdi"),
    OCHIRDI("o'chirdi"),
    KIRDI("kirdi");

    private final String label;

    HarakatTuri(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
