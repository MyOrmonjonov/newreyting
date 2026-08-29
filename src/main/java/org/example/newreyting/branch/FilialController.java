package org.example.newreyting.branch;

import jakarta.validation.Valid;
import org.example.newreyting.branch.dto.CreateFilialRequest;
import org.example.newreyting.branch.dto.FilialResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/filiallar")
public class FilialController {

    private final FilialService filialService;

    public FilialController(FilialService filialService) {
        this.filialService = filialService;
    }

    @GetMapping
    public List<FilialResponse> list() {
        return filialService.list().stream().map(FilialResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public FilialResponse create(@Valid @RequestBody CreateFilialRequest req) {
        return FilialResponse.from(filialService.create(req.nomi()));
    }
}
