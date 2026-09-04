package org.example.newreyting.result;

import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.employee.Ishchi;
import org.example.newreyting.employee.IshchiService;
import org.example.newreyting.product.Mahsulot;
import org.example.newreyting.product.MahsulotRepository;
import org.example.newreyting.result.dto.BulkNatijaRequest;
import org.example.newreyting.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class OylikNatijaService {

    private final OylikNatijaRepository natijaRepository;
    private final IshchiService ishchiService;
    private final MahsulotRepository mahsulotRepository;
    private final AuditService auditService;

    public OylikNatijaService(OylikNatijaRepository natijaRepository, IshchiService ishchiService,
                              MahsulotRepository mahsulotRepository, AuditService auditService) {
        this.natijaRepository = natijaRepository;
        this.ishchiService = ishchiService;
        this.mahsulotRepository = mahsulotRepository;
        this.auditService = auditService;
    }

    public List<OylikNatija> listByOy(LocalDate oy) {
        return natijaRepository.findAllByOy(oy.withDayOfMonth(1));
    }

    @Transactional
    public void saveBulk(BulkNatijaRequest req, User currentUser) {
        LocalDate oy = req.oy().withDayOfMonth(1);
        Set<String> ishchiNomlari = new LinkedHashSet<>();
        for (BulkNatijaRequest.Satr satr : req.satrlar()) {
            Ishchi ishchi = ishchiService.getById(satr.ishchiId());
            if (!ishchiService.canManage(currentUser, ishchi)) {
                throw new IllegalArgumentException("Bu agent uchun ma'lumot kiritish huquqingiz yo'q");
            }
            Mahsulot mahsulot = mahsulotRepository.findById(satr.mahsulotId())
                    .orElseThrow(() -> new IllegalArgumentException("Mahsulot topilmadi"));

            OylikNatija natija = natijaRepository
                    .findByIshchiIdAndMahsulotIdAndOy(ishchi.getId(), mahsulot.getId(), oy)
                    .orElseGet(() -> natijaRepository.save(new OylikNatija(ishchi, mahsulot, oy, 0, 0)));
            natija.setPlan(satr.plan());
            natija.setBajarildi(satr.bajarildi());
            ishchiNomlari.add(ishchi.getIsm() + " " + ishchi.getFamiliya());
        }
        if (!ishchiNomlari.isEmpty()) {
            auditService.record(currentUser, HarakatTuri.OZGARTIRDI,
                    String.join(", ", ishchiNomlari) + " — " + oy + " natijasi");
        }
    }
}
