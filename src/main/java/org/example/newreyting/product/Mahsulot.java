package org.example.newreyting.product;

import jakarta.persistence.*;

@Entity
@Table(name = "mahsulot")
public class Mahsulot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomi;

    @Column(nullable = false)
    private String birlik;

    @Column(nullable = false)
    private int standartPlan;

    protected Mahsulot() {
    }

    public Mahsulot(String nomi, String birlik, int standartPlan) {
        this.nomi = nomi;
        this.birlik = birlik;
        this.standartPlan = standartPlan;
    }

    public Long getId() {
        return id;
    }

    public String getNomi() {
        return nomi;
    }

    public void setNomi(String nomi) {
        this.nomi = nomi;
    }

    public String getBirlik() {
        return birlik;
    }

    public void setBirlik(String birlik) {
        this.birlik = birlik;
    }

    public int getStandartPlan() {
        return standartPlan;
    }

    public void setStandartPlan(int standartPlan) {
        this.standartPlan = standartPlan;
    }
}
