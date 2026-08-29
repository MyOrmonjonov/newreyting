package org.example.newreyting.product;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.product.dto.MahsulotRequest;
import org.example.newreyting.result.OylikNatijaRepository;
import org.example.newreyting.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MahsulotService {

    private final MahsulotRepository mahsulotRepository;
    private final OylikNatijaRepository natijaRepository;
    private final AuditService auditService;

    public MahsulotService(MahsulotRepository mahsulotRepository, OylikNatijaRepository natijaRepository,
                            AuditService auditService) {
        this.mahsulotRepository = mahsulotRepository;
        this.natijaRepository = natijaRepository;
        this.auditService = auditService;
    }

    public List<Mahsulot> list() {
        return mahsulotRepository.findAllByOrderByNomiAsc();
    }

    @Transactional
    public Mahsulot create(MahsulotRequest req, User actor) {
        Mahsulot saved = mahsulotRepository.save(new Mahsulot(req.nomi().trim(), req.birlik().trim(), req.standartPlan()));
        auditService.record(actor, HarakatTuri.QOSHDI, "Mahsulot: " + saved.getNomi());
        return saved;
    }

    @Transactional
    public Mahsulot update(Long id, MahsulotRequest req, User actor) {
        Mahsulot mahsulot = mahsulotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mahsulot topilmadi"));
        mahsulot.setNomi(req.nomi().trim());
        mahsulot.setBirlik(req.birlik().trim());
        mahsulot.setStandartPlan(req.standartPlan());
        auditService.record(actor, HarakatTuri.OZGARTIRDI, "Mahsulot: " + mahsulot.getNomi());
        return mahsulot;
    }

    @Transactional
    public void delete(Long id, User actor) {
        Mahsulot mahsulot = mahsulotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mahsulot topilmadi"));
        if (natijaRepository.existsByMahsulotId(id)) {
            throw new IllegalArgumentException(
                    "\"" + mahsulot.getNomi() + "\" mahsulotini o'chirib bo'lmaydi — unga oylik natijalar bog'langan");
        }
        String nomi = mahsulot.getNomi();
        mahsulotRepository.deleteById(id);
        auditService.record(actor, HarakatTuri.OCHIRDI, "Mahsulot: " + nomi);
    }
}
