package org.example.newreyting.employee;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.employee.dto.CreateIshchiRequest;
import org.example.newreyting.employee.dto.IshchiRasmResponse;
import org.example.newreyting.employee.dto.IshchiResponse;
import org.example.newreyting.employee.dto.UpdateIshchiRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ishchilar")
@PreAuthorize("hasAnyRole('ADMIN','OPERATOR','MENEJER','SUPERVAYZER')")
public class IshchiController {

    private final IshchiService ishchiService;

    public IshchiController(IshchiService ishchiService) {
        this.ishchiService = ishchiService;
    }

    @GetMapping
    public List<IshchiResponse> list(@AuthenticationPrincipal AppUserDetails principal) {
        return ishchiService.listVisibleTo(principal.getUser()).stream().map(IshchiResponse::listItem).toList();
    }

    /** Tahrirlash oynasi uchun — ro'yxatdagi (endi URL bo'lgan) {@code rasm} o'rniga haqiqiy
     * (base64) qiymatni oldindan to'ldirish uchun alohida so'raladi. */
    @GetMapping("/{id}/rasm")
    public IshchiRasmResponse rasm(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        return new IshchiRasmResponse(ishchiService.getRasm(id, principal.getUser()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IshchiResponse create(@Valid @RequestBody CreateIshchiRequest req,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        return IshchiResponse.from(ishchiService.create(req, principal.getUser()));
    }

    @PutMapping("/{id}")
    public IshchiResponse update(@PathVariable Long id, @Valid @RequestBody UpdateIshchiRequest req,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        return IshchiResponse.from(ishchiService.update(id, req, principal.getUser()));
    }

    // Diqqat: MENEJER agent qo'sha/tahrirlay/faolsizlantira oladi, lekin o'chira olmaydi
    // (bu yerda klass darajasidagi ruxsatni method-level @PreAuthorize toraytiradi) —
    // buyurtma bo'yicha ataylab shunday cheklangan.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR','SUPERVAYZER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean force,
                        @AuthenticationPrincipal AppUserDetails principal) {
        ishchiService.delete(id, principal.getUser(), force);
    }
}
