package org.example.newreyting.result;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.result.dto.BulkNatijaRequest;
import org.example.newreyting.result.dto.NatijaRowResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/natijalar")
@PreAuthorize("hasAnyRole('ADMIN','OPERATOR','MENEJER','SUPERVAYZER')")
public class OylikNatijaController {

    private final OylikNatijaService natijaService;

    public OylikNatijaController(OylikNatijaService natijaService) {
        this.natijaService = natijaService;
    }

    @GetMapping
    public List<NatijaRowResponse> listByOy(@RequestParam LocalDate oy) {
        return natijaService.listByOy(oy).stream().map(NatijaRowResponse::from).toList();
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void saveBulk(@Valid @RequestBody BulkNatijaRequest req, @AuthenticationPrincipal AppUserDetails principal) {
        natijaService.saveBulk(req, principal.getUser());
    }
}
