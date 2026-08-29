package org.example.newreyting.branch;

import jakarta.persistence.*;

@Entity
@Table(name = "filial", uniqueConstraints = @UniqueConstraint(columnNames = "nomi"))
public class Filial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nomi;

    protected Filial() {
    }

    public Filial(String nomi) {
        this.nomi = nomi;
    }

    public Long getId() {
        return id;
    }

    public String getNomi() {
        return nomi;
    }
}
