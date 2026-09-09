package org.example.newreyting.rating;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.rating.dto.RahbarNatijaBulkRequest;
import org.example.newreyting.rating.dto.RahbarNatijaRowResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Menejer/Supervayzer uchun qo'lda kiritiladigan tarixiy oylik ball/foiz — {@link RahbarOylikNatija} izohiga qarang. */
@RestController
@RequestMapping("/api/rahbar-natija")
@PreAuthorize("hasAnyRole('ADMIN','OPERATOR','MENEJER')")
public class RahbarOylikNatijaController {

    private final RahbarOylikNatijaService natijaService;

    public RahbarOylikNatijaController(RahbarOylikNatijaService natijaService) {
        this.natijaService = natijaService;
    }

    @GetMapping
    public List<RahbarNatijaRowResponse> listByOy(@RequestParam LocalDate oy) {
        return natijaService.listByOy(oy).stream().map(RahbarNatijaRowResponse::from).toList();
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveBulk(@Valid @RequestBody RahbarNatijaBulkRequest req, @AuthenticationPrincipal AppUserDetails principal) {
        natijaService.saveBulk(req, principal.getUser());
    }
}
