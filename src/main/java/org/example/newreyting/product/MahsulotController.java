package org.example.newreyting.product;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.product.dto.MahsulotRequest;
import org.example.newreyting.product.dto.MahsulotResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mahsulotlar")
public class MahsulotController {

    private final MahsulotService mahsulotService;
    private final MenejerMahsulotService menejerMahsulotService;

    public MahsulotController(MahsulotService mahsulotService, MenejerMahsulotService menejerMahsulotService) {
        this.mahsulotService = mahsulotService;
        this.menejerMahsulotService = menejerMahsulotService;
    }

    @GetMapping
    public List<MahsulotResponse> list() {
        return mahsulotService.list().stream().map(MahsulotResponse::from).toList();
    }

    /** Natija kiritishda ko'rsatiladigan mahsulotlar — shu menejerga biriktirilganlar (hech narsa
     * biriktirilmagan bo'lsa, hammasi — {@link MenejerMahsulotService#visibleFor}). */
    @GetMapping("/menejer/{menejerId}")
    public List<MahsulotResponse> listForMenejer(@PathVariable Long menejerId) {
        return menejerMahsulotService.visibleFor(menejerId).stream().map(MahsulotResponse::from).toList();
    }

    /** Biriktirish oynasi uchun — aynan shu menejerga belgilangan mahsulot ID'lari. */
    @GetMapping("/menejer/{menejerId}/tanlangan")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public List<Long> assignedForMenejer(@PathVariable Long menejerId) {
        return menejerMahsulotService.assignedIds(menejerId);
    }

    /** Menejerga qaysi mahsulotlar tegishli ekanini belgilash (to'liq almashtiradi). */
    @PutMapping("/menejer/{menejerId}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setForMenejer(@PathVariable Long menejerId, @RequestBody List<Long> mahsulotIds,
                               @AuthenticationPrincipal AppUserDetails principal) {
        menejerMahsulotService.setAssignments(menejerId, mahsulotIds, principal.getUser());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public MahsulotResponse create(@Valid @RequestBody MahsulotRequest req, @AuthenticationPrincipal AppUserDetails principal) {
        return MahsulotResponse.from(mahsulotService.create(req, principal.getUser()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public MahsulotResponse update(@PathVariable Long id, @Valid @RequestBody MahsulotRequest req,
                                    @AuthenticationPrincipal AppUserDetails principal) {
        return MahsulotResponse.from(mahsulotService.update(id, req, principal.getUser()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        mahsulotService.delete(id, principal.getUser());
    }
}
